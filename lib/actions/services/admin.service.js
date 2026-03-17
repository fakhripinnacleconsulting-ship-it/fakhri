'use server';

import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Task from '@/models/Task';
import { createNotification } from '@/lib/actions/notification';
import { sendEmail, emailTemplates } from '@/lib/mail';
import { logActivity } from '@/lib/actions/dashboard';
import bcrypt from 'bcryptjs';
import { getBaseUrl } from "@/lib/server-utils";
import { validateRole } from "@/lib/auth-utils";


// Helper: notify all super-admins about an event
export async function notifySuperAdmins({ title, message, type = 'info', link = '#Dashboard', icon, skipEmail = false }) {
    try {
        const superAdmins = await User.find({ role: 'super-admin' }).select('_id').lean();
        await Promise.all(
            superAdmins.map(sa =>
                createNotification({ recipientId: sa._id, title, message, type, link, icon, skipEmail })
            )
        );
    } catch (error) {
        console.error('Error notifying super-admins:', error);
    }
}

export async function getAdmins({ startDate, endDate } = {}) {
    await validateRole(['super-admin', 'admin']);
    await connectDB();
    try {
        const admins = await User.find({ role: 'admin' })
            .select('-password -refresh_token -pushSubscriptions')
            .sort({ createdAt: -1 })
            .lean();

        // Convert dates if provided
        const start = startDate ? new Date(startDate) : null;
        const end = endDate ? new Date(endDate) : null;

        // Fetch client and task counts for each admin
        const adminsWithCounts = await Promise.all(admins.map(async (admin) => {
            const taskQuery = { 'assignee.id': admin._id };
            const completedQuery = { 'assignee.id': admin._id, status: 'Completed' };

            if (start || end) {
                const dateFilter = {};
                if (start) dateFilter.$gte = start;
                if (end) dateFilter.$lte = end;
                
                // For completed tasks, we usually care about when they were completed (updatedAt)
                completedQuery.updatedAt = dateFilter;
                
                // For active tasks, we might care about tasks that were active during this period
                // But usually, active tasks is a "current" snapshot, so we might not filter them by date
                // or we filter by createdAt. Let's stick to current active tasks but filter completed by date.
            }

            const [clientsCount, activeTasks, completedTasks] = await Promise.all([
                User.countDocuments({
                    role: 'client',
                    $or: [
                        { managerId: admin._id },
                        { salesManagerId: admin._id },
                        { listingManagerId: admin._id },
                        { adsManagerId: admin._id },
                        { manager: admin.name }, // fallback to name for POC
                        { salesManager: admin.name }, // fallback to name
                        { listingManager: admin.name }, // fallback to name
                        { adsManager: admin.name }, // fallback to name
                        { assignedAdminIds: admin._id }
                    ]
                }),
                Task.countDocuments({
                    'assignee.id': admin._id,
                    status: { $in: ['In Progress', 'Under Review'] }
                }),
                Task.countDocuments(completedQuery)
            ]);

            return {
                ...admin,
                clientsCount,
                performance: {
                    ...admin.performance,
                    activeTasks,
                    completedTasks
                }
            };
        }));

        return JSON.parse(JSON.stringify(adminsWithCounts));
    } catch (error) {
        console.error('Error fetching admins:', error);
        return [];
    }
}

export async function getAdminClients(adminId) {
    await validateRole(['super-admin', 'admin']);
    await connectDB();
    try {
        const admin = await User.findById(adminId).select('name').lean();
        if (!admin) return [];

        const clients = await User.find({
            role: 'client',
            $or: [
                { managerId: adminId },
                { salesManagerId: adminId },
                { listingManagerId: adminId },
                { adsManagerId: adminId },
                { salesManager: admin.name },
                { listingManager: admin.name },
                { adsManager: admin.name },
                { assignedAdminIds: adminId }
            ]
        }).select('name company email manager managerId salesManager salesManagerId listingManager listingManagerId adsManager adsManagerId assignedAdminIds status').lean();

        // Process clients to identify roles
        const processedClients = clients.map(client => {
            const roles = [];
            if (String(client.managerId) === String(adminId) || client.manager === admin.name) roles.push('POC (Account Manager)');
            if (String(client.salesManagerId) === String(adminId) || client.salesManager === admin.name) roles.push('Sales Manager');
            if (String(client.listingManagerId) === String(adminId) || client.listingManager === admin.name) roles.push('Listing Manager');
            if (String(client.adsManagerId) === String(adminId) || client.adsManager === admin.name) roles.push('Ads Manager');
            
            const isAdditional = client.assignedAdminIds && client.assignedAdminIds.some(id => String(id) === String(adminId));
            if (isAdditional && roles.length === 0) {
                roles.push('Additional Admin');
            } else if (isAdditional) {
                roles.push('Assigned Admin');
            }

            return {
                ...client,
                roles: roles.length > 0 ? roles : ['Member']
            };
        });

        return JSON.parse(JSON.stringify(processedClients));
    } catch (error) {
        console.error('Error fetching admin clients:', error);
        return [];
    }
}

export async function getTeamMembers() {
    await validateRole(['super-admin', 'admin']);
    await connectDB();
    try {
        const team = await User.find({ role: { $in: ['admin', 'super-admin'] } })
            .select('name email role _id team adminRole')
            .sort({ name: 1 })
            .lean();
        return JSON.parse(JSON.stringify(team));
    } catch (error) {
        console.error('Error fetching team members:', error);
        return [];
    }
}

export async function upsertAdmin(adminData) {
    await validateRole(['super-admin']);
    await connectDB();
    try {
        const id = adminData._id || adminData.id;
        let admin;

        const { _id, ...updateData } = adminData;

        if (id && id.toString().length >= 12) {
            const oldAdmin = await User.findById(id).lean();

            if (updateData.password) {
                const salt = await bcrypt.genSalt(10);
                updateData.password = await bcrypt.hash(updateData.password, salt);
            }
            admin = await User.findByIdAndUpdate(id, updateData, { new: true }).lean();

            // If name changed, update all tasks assigned to this admin
            if (admin && oldAdmin && oldAdmin.name !== admin.name) {
                await Task.updateMany(
                    { 'assignee.id': id },
                    {
                        $set: {
                            'assignee.name': admin.name,
                            'owner': admin.name
                        }
                    }
                );
                // Also update client documents where name strings are stored
                await User.updateMany(
                    { managerId: id },
                    { $set: { manager: admin.name } }
                );
                await User.updateMany(
                    { salesManager: oldAdmin.name },
                    { $set: { salesManager: admin.name } }
                );
                await User.updateMany(
                    { listingManager: oldAdmin.name },
                    { $set: { listingManager: admin.name } }
                );
                await User.updateMany(
                    { adsManager: oldAdmin.name },
                    { $set: { adsManager: admin.name } }
                );
            }

            // If password was updated, notify them?
            if (updateData.password) {
                await sendEmail({
                    to: admin.email,
                    ...emailTemplates.notification({
                        title: 'Account Password Updated',
                        message: `Hello ${admin.name}, your account password has been updated by the super admin. If you did not request this, please contact support.`,
                        link: `${getBaseUrl()}/login`
                    })
                });
            }
        } else {
            const existing = await User.findOne({ email: adminData.email });
            if (existing) {
                throw new Error("A user with this email already exists");
            }
            if (adminData.password) {
                const salt = await bcrypt.genSalt(10);
                adminData.password = await bcrypt.hash(adminData.password, salt);
            }
            admin = await User.create({ ...adminData, role: 'admin' });

            if (admin) {
                // Determine recipients for this event - Matrix: Super Admin (Yes/Yes), Admin (Yes/Yes), Client (No/No)

                // 1. Notify Admin (Self) - Welcome Mail
                await sendEmail({
                    to: admin.email,
                    ...emailTemplates.welcomeAccount({
                        name: admin.name,
                        email: admin.email,
                        password: "As set by administrator",
                        role: 'Admin / ' + (admin.adminRole || 'Account Manager'),
                        dashboardUrl: `${getBaseUrl()}/login`
                    })
                });
                await createNotification({
                    recipientId: admin._id,
                    title: 'Welcome Admin',
                    message: `Welcome ${admin.name}! Your admin account is ready.`,
                    type: 'info',
                    link: '#Dashboard'
                });

                // 2. Notify super-admins
                await notifySuperAdmins({
                    title: 'New Admin Created',
                    message: `${admin.name} (${admin.email}) has been added as an admin.`,
                    type: 'success',
                    link: '#Admins',
                    icon: 'UserPlus'
                });
                // Send email to super-admins
                const superAdmins = await User.find({ role: 'super-admin' }).select('email');
                for (const sa of superAdmins) {
                    await sendEmail({
                        to: sa.email,
                        ...emailTemplates.notification({
                            title: 'New Admin Account Created',
                            message: `A new admin account for ${admin.name} (${admin.email}) has been created in the system.`,
                            link: `${getBaseUrl()}/super-admin/dashboard?tab=Admins`
                        })
                    });
                }
            }
        }
        return JSON.parse(JSON.stringify(admin));
    } catch (error) {
        console.error('Error upserting admin:', error);
        throw new Error(error.message || 'Failed to preserve admin');
    }
}

export async function deleteAdmin(id) {
    await validateRole(['super-admin']);
    await connectDB();
    try {
        const admin = await User.findById(id).lean();
        await User.findByIdAndDelete(id);

        // Notify super-admins about deleted admin
        if (admin) {
            // Clean up all references to this admin in Client documents
            await User.updateMany(
                { managerId: id },
                { $set: { managerId: null, manager: 'Unassigned' } }
            );
            await User.updateMany(
                { salesManagerId: id },
                { $set: { salesManagerId: null, salesManager: 'Unassigned' } }
            );
            await User.updateMany(
                { listingManagerId: id },
                { $set: { listingManagerId: null, listingManager: 'Unassigned' } }
            );
            await User.updateMany(
                { adsManagerId: id },
                { $set: { adsManagerId: null, adsManager: 'Unassigned' } }
            );
            await User.updateMany(
                { role: 'client' },
                { $pull: { assignedAdminIds: id } }
            );

            await notifySuperAdmins({
                title: 'Admin Removed',
                message: `${admin.name} (${admin.email}) has been removed as an admin.`,
                type: 'warning',
                link: '#Admins'
            });
        }

        return { success: true };
    } catch (error) {
        console.error('Error deleting admin:', error);
        return { success: false, error: error.message };
    }
}

export async function toggleAdminStatus(id, status) {
    await validateRole(['super-admin']);
    await connectDB();
    try {
        const admin = await User.findByIdAndUpdate(id, { status }, { new: true }).lean();
        return JSON.parse(JSON.stringify(admin));
    } catch (error) {
        console.error('Error toggling admin status:', error);
        return null;
    }
}
