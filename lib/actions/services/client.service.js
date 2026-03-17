'use server';

import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Task from '@/models/Task';
import Team from '@/models/Team';
import Note from '@/models/Note';
import { createNotification } from '@/lib/actions/notification';
import { sendEmail, emailTemplates } from '@/lib/mail';
import { logActivity } from '@/lib/actions/dashboard';
import bcrypt from 'bcryptjs';
import { getBaseUrl } from "@/lib/server-utils";
import { notifySuperAdmins } from './admin.service';
import mongoose from 'mongoose';
import { validateRole } from "@/lib/auth-utils";

// --- Relationship Sync Helpers ---

// Resolve all manager IDs based on names if only names are provided
export async function resolveManagerIdByName(name) {
    if (!name || name === 'Unassigned') return null;
    const user = await User.findOne({ name, role: 'admin' }).select('_id');
    return user ? user._id : null;
}

// Collect all assigned admins for this client to update their assignedClientIds
export const getRelevantAdminIdsForClient = async (data) => {
    const ids = new Set();
    if (data.managerId) ids.add(data.managerId.toString());
    if (data.salesManagerId) ids.add(data.salesManagerId.toString());
    if (data.listingManagerId) ids.add(data.listingManagerId.toString());
    if (data.adsManagerId) ids.add(data.adsManagerId.toString());
    if (data.assignedAdminIds) {
        data.assignedAdminIds.forEach(id => {
            if (id) ids.add(id.toString());
        });
    }
    return Array.from(ids);
};

export const syncAdminAssignedClients = async (clientId, currentAdminIds, previousAdminIds = []) => {
    // Remove from old admins who are no longer assigned
    const removedAdmins = previousAdminIds.filter(id => !currentAdminIds.includes(id));
    if (removedAdmins.length > 0) {
        await User.updateMany(
            { _id: { $in: removedAdmins } },
            { $pull: { assignedClientIds: clientId } }
        );
    }
    // Add to current admins
    if (currentAdminIds.length > 0) {
        await User.updateMany(
            { _id: { $in: currentAdminIds } },
            { $addToSet: { assignedClientIds: clientId } }
        );
    }
};


export async function sendClientEmail({ to, subject, body, fromAdmin, includeDashboardButton }) {
    await validateRole(['super-admin', 'admin']);
    console.log('>>> Server Action: sendClientEmail triggered');
    await connectDB();
    try {
        const template = emailTemplates.clientMessage({
            subject,
            body,
            adminName: fromAdmin.name,
            includeDashboardButton
        });

        const result = await sendEmail({
            to,
            subject: template.subject,
            html: template.html,
            text: template.text,
            replyTo: fromAdmin.email, // Ensure client replies go to the logged-in admin
            fromName: fromAdmin.name // Make it appear as from the admin
        });

        // Also notify client in-app only if mail sent successfully
        if (result.success) {
            const client = await User.findOne({ email: to });
            if (client) {
                await createNotification({
                    recipientId: client._id,
                    title: 'New Email Received',
                    message: `You received an email from ${fromAdmin.name}: "${subject}"`,
                    type: 'info',
                    link: '#Dashboard',
                    skipEmail: true
                });
            }
        }

        return result;
    } catch (error) {
        console.error('Error in sendClientEmail action:', error);
        return { success: false, error: error.message };
    }
}

export async function getClients(filter = {}, options = {}) {
    await connectDB();
    const { page = 1, limit = 1000, projection = null } = options;
    const skip = (page - 1) * limit;

    try {
        if (filter.managerId) {
            const adminUser = await User.findById(filter.managerId).select('name');
            if (adminUser) {
                let mId = filter.managerId;
                try { mId = new mongoose.Types.ObjectId(filter.managerId); } catch (e) { }

                filter.$or = [
                    { managerId: filter.managerId },
                    { managerId: mId },
                    { manager: adminUser.name },
                    { salesManager: adminUser.name },
                    { listingManager: adminUser.name },
                    { adsManager: adminUser.name },
                    { assignedAdminIds: filter.managerId },
                    { assignedAdminIds: mId }
                ];
                delete filter.managerId;
            }
        }
        const query = { role: 'client', ...filter };

        const clientQuery = User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit);
        if (projection) clientQuery.select(projection);

        const [clients, total] = await Promise.all([
            clientQuery.lean(),
            User.countDocuments(query)
        ]);

        return {
            clients: JSON.parse(JSON.stringify(clients)),
            total,
            pages: Math.ceil(total / limit),
            currentPage: page
        };
    } catch (error) {
        console.error('Error fetching clients:', error);
        return { clients: [], total: 0, pages: 0, currentPage: 1 };
    }
}

export async function upsertClient(clientData) {
    await validateRole(['super-admin', 'admin']);
    await connectDB();
    try {
        const id = clientData._id || clientData.id;
        let client;

        const { _id, ...updateData } = clientData;
        console.log('>>> upsertClient incoming assignedAdminIds:', updateData.assignedAdminIds);

        if (updateData.teams && updateData.teams.length > 0) {
            const assignedTeams = await Team.find({ _id: { $in: updateData.teams } }).select('lead');
            const leads = assignedTeams.map(t => t.lead).filter(Boolean);
            if (leads.length > 0) {
                updateData.supervisor = [...new Set(leads)].join(', ');
            }
        } else if (updateData.teams && updateData.teams.length === 0) {
            updateData.supervisor = '';
        }

        // Always attempt to resolve manager IDs if the name is present to ensure synchronization
        if (updateData.manager && updateData.manager !== 'Unassigned') {
            updateData.managerId = await resolveManagerIdByName(updateData.manager);
        } else if (updateData.manager === 'Unassigned') {
            updateData.managerId = null;
        }

        if (updateData.salesManager) {
            updateData.salesManagerId = await resolveManagerIdByName(updateData.salesManager);
        }
        if (updateData.listingManager) {
            updateData.listingManagerId = await resolveManagerIdByName(updateData.listingManager);
        }
        if (updateData.adsManager) {
            updateData.adsManagerId = await resolveManagerIdByName(updateData.adsManager);
        }

        if (id && id.toString().length >= 12) {
            const oldClient = await User.findById(id).lean();

            // Clean assignedAdminIds: Remove any IDs that are already designated as primary managers
            // This prevents double-counting and ensures stale managers are properly removed when roles change.
            if (updateData.assignedAdminIds || oldClient) {
                const currentPrimaryIds = new Set([
                    (updateData.managerId || oldClient?.managerId || '').toString(),
                    (updateData.salesManagerId || oldClient?.salesManagerId || '').toString(),
                    (updateData.listingManagerId || oldClient?.listingManagerId || '').toString(),
                    (updateData.adsManagerId || oldClient?.adsManagerId || '').toString()
                ].filter(Boolean));

                const baseAdmins = updateData.assignedAdminIds || (oldClient ? oldClient.assignedAdminIds : []) || [];
                
                updateData.assignedAdminIds = [...new Set(
                    baseAdmins
                        .filter(adminId => adminId && !currentPrimaryIds.has(adminId.toString()))
                        .filter(adminId => {
                            // If we are changing manager, and this adminId is the OLD manager, 
                            // and it's NOT one of the NEW primary managers, remove it.
                            if (oldClient && updateData.manager && adminId.toString() === oldClient.managerId?.toString()) {
                                 return currentPrimaryIds.has(adminId.toString());
                            }
                            return true;
                        })
                        .map(adminId => adminId.toString())
                )];
            }

            if (updateData.password) {
                const salt = await bcrypt.genSalt(10);
                updateData.password = await bcrypt.hash(updateData.password, salt);
            }

            client = await User.findByIdAndUpdate(id, updateData, { new: true }).lean();

            if (client && oldClient) {
                // Sync admin relationship
                const currentAdmins = await getRelevantAdminIdsForClient(client);
                const previousAdmins = await getRelevantAdminIdsForClient(oldClient);
                await syncAdminAssignedClients(client._id, currentAdmins, previousAdmins);

                const nameChanged = oldClient.name !== client.name;
                const companyChanged = oldClient.company !== client.company;
                const managerChanged = oldClient.managerId?.toString() !== client.managerId?.toString();

                if (nameChanged || companyChanged) {
                    await Task.updateMany(
                        { 'client.id': id },
                        {
                            $set: {
                                'client.name': client.name,
                                'client.company': client.company
                            }
                        }
                    );
                }

            }

            // Notify managers if newly assigned or changed
            if (client && (!oldClient || oldClient.managerId?.toString() !== client.managerId?.toString() || oldClient.salesManager !== client.salesManager || oldClient.listingManager !== client.listingManager)) {
                const managerNames = [client.salesManager, client.listingManager].filter(Boolean);
                const explicitManagers = await User.find({ name: { $in: managerNames }, role: 'admin' }).select('_id');
                const managersToNotify = [];
                if (client.managerId) managersToNotify.push(client.managerId);
                explicitManagers.forEach(m => managersToNotify.push(m._id));
                const uniqueIds = [...new Set(managersToNotify.map(id => id.toString()))];
                for (const mId of uniqueIds) {
                    await createNotification({
                        recipientId: mId,
                        title: 'New Client Assigned',
                        message: `You have been assigned as a manager for ${client.name} (${client.company || 'N/A'}).`,
                        type: 'info',
                        link: '#Clients'
                    });
                }
            }
        } else {
            const existing = await User.findOne({ email: updateData.email || clientData.email });
            if (existing) {
                throw new Error("A user with this email already exists");
            }

            if (updateData.password || clientData.password) {
                const pass = updateData.password || clientData.password;
                const salt = await bcrypt.genSalt(10);
                updateData.password = await bcrypt.hash(pass, salt);
            }

            client = await User.create({ ...updateData, role: 'client' });

            if (client) {
                // Sync admin relationship
                await syncAdminAssignedClients(client._id, await getRelevantAdminIdsForClient(client), []);

                await sendEmail({
                    to: client.email,
                    ...emailTemplates.welcomeAccount({
                        name: client.name,
                        email: client.email,
                        password: clientData.password || "Set during signup",
                        role: 'Client',
                        company: client.company || 'Personal',
                        dashboardUrl: `${await getBaseUrl()}/login`
                    })
                });
                await createNotification({
                    recipientId: client._id,
                    title: 'Welcome to Dashboard',
                    message: `Welcome ${client.name}! Your account has been created.`,
                    type: 'info',
                    link: '#Dashboard'
                });

                await notifySuperAdmins({
                    title: 'New Client Registered',
                    message: `${client.name} (${client.company || 'N/A'}) has joined.`,
                    type: 'success',
                    link: '#Clients',
                    icon: 'UserPlus',
                    skipEmail: true
                });
                const superAdmins = await User.find({ role: 'super-admin' }).select('email name');
                for (const sa of superAdmins) {
                    await sendEmail({
                        to: sa.email,
                        ...emailTemplates.notification({
                            title: 'New Client Registered',
                            message: `A new client ${client.name} from ${client.company || 'N/A'} has been registered in the system.`,
                            link: `${await getBaseUrl()}/super-admin/dashboard?tab=Clients`
                        })
                    });
                }

                const managerNames = [client.salesManager, client.listingManager].filter(Boolean);
                const explicitManagers = await User.find({ name: { $in: managerNames }, role: 'admin' }).select('email name _id');
                const managersToNotify = [];
                if (client.managerId) {
                    const manager = await User.findById(client.managerId).select('email name _id');
                    if (manager) managersToNotify.push(manager);
                }
                explicitManagers.forEach(m => {
                    if (!managersToNotify.some(existing => existing._id.toString() === m._id.toString())) {
                        managersToNotify.push(m);
                    }
                });

                for (const manager of managersToNotify) {
                    await createNotification({
                        recipientId: manager._id,
                        title: 'New Client Assigned',
                        message: `You have been assigned as a manager for ${client.name} (${client.company || 'N/A'}).`,
                        type: 'info',
                        link: '#Clients',
                        skipEmail: true
                    });
                    if (manager.email) {
                        await sendEmail({
                            to: manager.email,
                            ...emailTemplates.notification({
                                title: 'New Client Assigned',
                                message: `You have been assigned as a manager for ${client.name} from ${client.company || 'N/A'}.`,
                                link: `${await getBaseUrl()}/admin/dashboard?tab=Clients`
                            })
                        });
                    }
                }
            }
        }

        await logActivity({
            action: id ? 'Client Updated' : 'New Client Added',
            target: client.company || client.name,
            details: id ? `Updated details for ${client.name}` : `Onboarded new client: ${client.name}`,
            type: 'client',
            user: { name: 'System/Admin' }
        });

        return JSON.parse(JSON.stringify(client));
    } catch (error) {
        console.error('Error upserting client:', error);
        return null;
    }
}

export async function deleteClient(id) {
    await validateRole(['super-admin', 'admin']);
    await connectDB();
    try {
        const client = await User.findById(id).lean();
        if (client) {
            // Remove client reference from all admins' assignedClientIds list
            await User.updateMany(
                { role: 'admin' },
                { $pull: { assignedClientIds: id } }
            );

            await User.findByIdAndDelete(id);

            await logActivity({
                action: 'Client Removed',
                target: client.company || client.name,
                details: `Client ${client.name} has been deleted from the system`,
                type: 'client'
            });

            await notifySuperAdmins({
                title: 'Client Removed',
                message: `${client.name} (${client.company || 'N/A'}) has been removed.`,
                type: 'warning',
                link: '#Clients'
            });
        }

        return { success: true };
    } catch (error) {
        console.error('Error deleting client:', error);
        return { success: false, error: error.message };
    }
}

export async function bulkDeleteClients(clientIds) {
    await validateRole(['super-admin']);
    await connectDB();
    try {
        if (!clientIds || clientIds.length === 0) {
            return { success: false, error: 'No clients specified' };
        }

        const results = { deleted: 0, failed: 0, errors: [] };

        for (const clientId of clientIds) {
            try {
                const client = await User.findById(clientId).lean();
                if (!client) {
                    results.failed++;
                    results.errors.push(`Client ${clientId} not found`);
                    continue;
                }

                // Remove client reference from all admins' assignedClientIds list
                await User.updateMany(
                    { role: 'admin' },
                    { $pull: { assignedClientIds: clientId } }
                );

                await User.findByIdAndDelete(clientId);

                await logActivity({
                    action: 'Client Removed (Bulk)',
                    target: client.company || client.name,
                    details: `Client ${client.name} deleted via bulk delete`,
                    type: 'client'
                });

                results.deleted++;
            } catch (err) {
                results.failed++;
                results.errors.push(`${clientId}: ${err.message}`);
            }
        }

        // Notify super admins once about the bulk deletion
        if (results.deleted > 0) {
            await notifySuperAdmins({
                title: 'Bulk Client Deletion',
                message: `${results.deleted} client(s) have been removed from the system.`,
                type: 'warning',
                link: '#Clients'
            });
        }

        return { success: true, ...results };
    } catch (error) {
        console.error('Error in bulkDeleteClients:', error);
        return { success: false, error: error.message };
    }
}

export async function toggleClientStatus(id, status) {
    await validateRole(['super-admin', 'admin']);
    await connectDB();
    try {
        const client = await User.findByIdAndUpdate(id, { status }, { new: true }).lean();
        return JSON.parse(JSON.stringify(client));
    } catch (error) {
        console.error('Error toggling client status:', error);
        return null;
    }
}

export async function updateSubscribedServiceStatus(clientId, serviceId, status) {
    await connectDB();
    try {
        const client = await User.findOneAndUpdate(
            { _id: clientId, "subscribedServices._id": serviceId },
            { $set: { "subscribedServices.$.status": status } },
            { new: true }
        ).lean();

        if (client) {
            await createNotification({
                recipientId: clientId,
                title: 'Service Status Updated',
                message: `The status of your service has been updated to "${status}".`,
                type: 'info',
                link: '#Dashboard'
            });
        }

        return JSON.parse(JSON.stringify(client));
    } catch (error) {
        console.error('Error updating service status:', error);
        return null;
    }
}

export async function validateBulkClientsData(clientsData) {
    await connectDB();
    try {
        const emails = clientsData.map(c => c.email).filter(Boolean);
        const uniqueEmails = new Set();
        const duplicates = [];

        // Check for duplicates within the current uploaded sheet
        for (const e of emails) {
            if (uniqueEmails.has(e)) duplicates.push(e);
            uniqueEmails.add(e);
        }

        if (duplicates.length > 0) {
            return {
                isValid: false,
                errors: duplicates.map(e => `Duplicate email found within the Excel sheet conflicts: ${e}`)
            };
        }

        // Check for conflicts within the database
        const existingUsers = await User.find({ email: { $in: Array.from(uniqueEmails) } }).select('email');
        if (existingUsers.length > 0) {
            const existingEmails = existingUsers.map(u => u.email);
            return {
                isValid: false,
                errors: existingEmails.map(e => `Email ${e} already exists in Database.`)
            };
        }

        return { isValid: true, errors: [] };
    } catch (error) {
        console.error('Error in validateBulkClientsData:', error);
        return { isValid: false, errors: [error.message] };
    }
}


export async function bulkUploadClients(clientsData) {
    await validateRole(['super-admin', 'admin']);
    await connectDB();
    try {
        const results = { success: 0, failed: 0, errors: [] };
        const adminUsers = await User.find({ role: 'admin' }).select('_id name');

        // Optimizing chunking to prevent Event Loop Blocking on 1000+ uploads
        const CHUNK_SIZE = 50;

        for (let i = 0; i < clientsData.length; i += CHUNK_SIZE) {
            const chunk = clientsData.slice(i, i + CHUNK_SIZE);

            await Promise.all(chunk.map(async (data) => {
                try {
                    if (!data.email) throw new Error("Email is required");
                    const existing = await User.findOne({ email: data.email });
                    if (existing) throw new Error(`Email ${data.email} already exists.`);

                    const cName = String(data.name || "Client");
                    const firstTwo = cName.substring(0, 2).toUpperCase().padEnd(2, 'C');
                    const cPhone = String(data.phone || '0000');
                    const lastFour = cPhone.length > 4 ? cPhone.slice(-4) : cPhone.padStart(4, '0');
                    const generatedPassword = `${firstTwo}${lastFour}`;

                    const clientPayload = { ...data, role: 'client' };
                    const salt = await bcrypt.genSalt(10);
                    clientPayload.password = await bcrypt.hash(generatedPassword, salt);

                    if (clientPayload.manager) {
                        const managerUser = adminUsers.find(u => u.name?.toLowerCase() === clientPayload.manager.toLowerCase());
                        if (managerUser) {
                            clientPayload.managerId = managerUser._id;
                            clientPayload.manager = managerUser.name;
                        }
                    }

                    const client = await User.create(clientPayload);
                    if (client) {
                        try {
                            // Sync admin relationship
                            await syncAdminAssignedClients(client._id, await getRelevantAdminIdsForClient(client), []);

                            await sendEmail({
                                to: client.email,
                                ...emailTemplates.welcomeAccount({
                                    name: client.name,
                                    email: client.email,
                                    password: generatedPassword,
                                    role: 'Client',
                                    company: client.company || 'Personal',
                                    dashboardUrl: `${await getBaseUrl()}/login`
                                })
                            });

                            await notifySuperAdmins({
                                title: 'Bulk Client Added',
                                message: `${client.name} has joined via bulk upload.`,
                                type: 'success',
                                link: '#Clients',
                                icon: 'UserPlus',
                                skipEmail: true
                            });
                        } catch (e) {
                            console.error("Non fatal error sending welcome email or notification:", e);
                        }
                    }
                    results.success++;
                } catch (err) {
                    console.error("Error bulk uploading client:", data.email, err);
                    results.failed++;
                    results.errors.push(`${data.email || 'Unknown'}: ${err.message}`);
                }
            }));
        }
        return results;
    } catch (error) {
        console.error('Error in bulkUploadClients:', error);
        return { success: false, error: error.message };
    }
}

export async function bulkExtendSubscription(clientIds, days) {
    await validateRole(['super-admin', 'admin']);
    await connectDB();
    try {
        if (!clientIds || clientIds.length === 0) {
            return { success: false, error: 'No clients specified' };
        }
        if (!days || days <= 0) {
            return { success: false, error: 'Days must be a positive number' };
        }

        const results = { updated: 0, failed: 0, errors: [] };

        for (const clientId of clientIds) {
            try {
                const client = await User.findById(clientId).lean();
                if (!client) {
                    results.failed++;
                    results.errors.push(`Client ${clientId} not found`);
                    continue;
                }

                const currentEnd = client.subscriptionEnd ? new Date(client.subscriptionEnd) : new Date();
                const baseDate = currentEnd < new Date() ? new Date() : currentEnd;
                const newEndDate = new Date(baseDate.getTime() + days * 24 * 60 * 60 * 1000);

                await User.findByIdAndUpdate(clientId, { subscriptionEnd: newEndDate });
                results.updated++;
            } catch (err) {
                results.failed++;
                results.errors.push(`${clientId}: ${err.message}`);
            }
        }

        return { success: true, ...results };
    } catch (error) {
        console.error('Error in bulkExtendSubscription:', error);
        return { success: false, error: error.message };
    }
}

export async function updateClientSubscriptionEnd(clientId, newEndDate) {
    await validateRole(['super-admin', 'admin']);
    await connectDB();
    try {
        const client = await User.findByIdAndUpdate(
            clientId,
            { subscriptionEnd: new Date(newEndDate) },
            { new: true }
        ).lean();

        if (!client) {
            return { success: false, error: 'Client not found' };
        }

        return { success: true, client: JSON.parse(JSON.stringify(client)) };
    } catch (error) {
        console.error('Error updating subscription end date:', error);
        return { success: false, error: error.message };
    }
}

export async function getNotes(clientId) {
    await connectDB();
    try {
        const notes = await Note.find({ clientId }).sort({ date: -1 }).lean();
        return JSON.parse(JSON.stringify(notes));
    } catch (error) {
        console.error('Error fetching notes:', error);
        return [];
    }
}

export async function upsertNote(noteData) {
    await connectDB();
    try {
        const note = await Note.create(noteData);

        // Notify Super Admins and related Admins, NOT the Client
        if (note && note.clientId) {
            const client = await User.findById(note.clientId).select('managerId manager salesManager listingManager adsManager assignedAdminIds name').lean();
            if (client) {
                const superAdmins = await User.find({ role: 'super-admin' }).select('_id').lean();
                const adminsToNotify = new Set();

                // Add all super-admins
                superAdmins.forEach(sa => adminsToNotify.add(sa._id.toString()));

                // Collect related admins for this client
                const managerNames = [client.manager, client.salesManager, client.listingManager, client.adsManager].filter(Boolean);
                if (managerNames.length > 0) {
                    const mappedAdmins = await User.find({ name: { $in: managerNames }, role: 'admin' }).select('_id').lean();
                    mappedAdmins.forEach(a => adminsToNotify.add(a._id.toString()));
                }

                if (client.managerId) {
                    adminsToNotify.add(client.managerId.toString());
                }

                if (client.assignedAdminIds && client.assignedAdminIds.length > 0) {
                    client.assignedAdminIds.forEach(id => adminsToNotify.add(id.toString()));
                }

                // Remove the author of the note from the notification list to prevent self-notification
                const authorId = note.authorId ? note.authorId.toString() : null;
                if (authorId) {
                    adminsToNotify.delete(authorId);
                }

                // Send notifications
                const ArrayOfAdmins = Array.from(adminsToNotify);
                await Promise.all(
                    ArrayOfAdmins.map(adminId =>
                        createNotification({
                            recipientId: adminId,
                            title: `New Client Note: ${client.name}`,
                            message: `${note.author || 'An admin'} added a note: "${note.content}"`,
                            type: 'info',
                            link: '#Clients'
                        })
                    )
                );
            }
        }

        await logActivity({
            action: 'New Note Added',
            target: note.title || 'Client Note',
            details: `Note added for client ID: ${note.clientId}`,
            type: 'note'
        });

        return JSON.parse(JSON.stringify(note));
    } catch (error) {
        console.error('Error creating note:', error);
        return null;
    }
}
