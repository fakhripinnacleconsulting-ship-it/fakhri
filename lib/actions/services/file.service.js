'use server';

import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Task from '@/models/Task';
import { createNotification } from '@/lib/actions/notification';
import { sendEmail, emailTemplates } from '@/lib/mail';
import { logActivity } from '@/lib/actions/dashboard';
import { getBaseUrl } from "@/lib/server-utils";
import { notifySuperAdmins } from './admin.service'; // We will use the common notifier

export async function getFiles(filter = {}) {
    await connectDB();
    try {
        const FileModel = (await import('@/models/File')).default;

        // 1. Get standard files
        const files = await FileModel.find(filter)
            .select('-content') // don't fetch heavy contents if any
            .sort({ createdAt: -1 })
            .lean();

        // 2. Identify the clients this admin cares about based on the filter
        // We look for clientIds inside the $or filter
        let clientIdsToInclude = [];
        if (filter.$or) {
            filter.$or.forEach(cond => {
                if (cond.clientId && cond.clientId.$in) {
                    clientIdsToInclude.push(...cond.clientId.$in);
                }
            });
        }

        let taskFilter = { "attachment.url": { $exists: true, $ne: "" } };

        // If it's an admin filter (has $or with client IDs), restrict tasks to those clients
        // or tasks assigned to this admin, or tasks owned by this admin
        if (clientIdsToInclude.length > 0) {
            const adminName = filter.$or.find(c => c.uploadedBy)?.uploadedBy;
            let adminIdMatch = filter.$or.find(c => c.recipientId && c.recipientId.$in);
            const adminId = adminIdMatch ? adminIdMatch.recipientId.$in.find(id => !clientIdsToInclude.includes(id)) : null;

            taskFilter = {
                $and: [
                    { "attachment.url": { $exists: true, $ne: "" } },
                    {
                        $or: [
                            { "client.id": { $in: clientIdsToInclude } },
                            { clientId: { $in: clientIdsToInclude } },
                            ...(adminId ? [{ "assignee.id": adminId }, { ownerId: adminId }] : []),
                            ...(adminName ? [{ owner: adminName }] : [])
                        ]
                    }
                ]
            };
        }

        const tasksWithFiles = await Task.find(taskFilter).sort({ createdAt: -1 }).lean();

        // 3. Convert task attachments to file format
        const taskFiles = tasksWithFiles.map(task => ({
            _id: `task-${task._id}`,
            name: task.attachment.name || "Unnamed Task Attachment",
            url: task.attachment.url,
            clientId: task.client?.id || task.clientId,
            clientName: task.client?.name || "Unknown",
            type: task.attachment.name?.split('.').pop().toLowerCase() || 'file',
            size: "N/A",
            version: "Task Attachment",
            uploadedBy: task.assignee?.name || task.owner || "System",
            date: new Date(task.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
            createdAt: task.createdAt,
            isTaskAttachment: true,
            taskId: task.taskId,
            taskTitle: task.title
        }));

        // 4. Combine and sort
        const allFiles = [...files, ...taskFiles].sort((a, b) =>
            new Date(b.createdAt) - new Date(a.createdAt)
        );

        return JSON.parse(JSON.stringify(allFiles));
    } catch (error) {
        console.error('Error fetching files:', error);
        return [];
    }
}

export async function getFilesByClientId(clientId, options = {}) {
    await connectDB();
    try {
        const FileModel = (await import('@/models/File')).default;

        // 1. Standard Files shared with this client
        const files = await FileModel.find({ clientId }).sort({ createdAt: -1 }).lean();

        // 2. Task Attachments for this client
        const taskFiles = await Task.find({
            $or: [
                { "client.id": clientId },
                { clientId: clientId },
                { "client.id": clientId.toString() },
                { clientId: clientId.toString() }
            ],
            "attachment.url": { $exists: true, $ne: "" }
        }).sort({ createdAt: -1 }).lean();

        const mappedTaskFiles = taskFiles.map(task => ({
            _id: `task-${task._id}`,
            name: task.attachment.name || "Task Attachment",
            url: task.attachment.url,
            clientId: task.client?.id || task.clientId,
            clientName: task.client?.name || "Self",
            type: task.attachment.name?.split('.').pop().toLowerCase() || 'file',
            size: "N/A",
            version: "Task Attachment",
            uploadedBy: task.assignee?.name || task.owner || "System",
            date: new Date(task.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
            createdAt: task.createdAt,
            isTaskAttachment: true,
            taskId: task.taskId,
            taskTitle: task.title
        }));

        const combined = [...files, ...mappedTaskFiles].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        return {
            files: JSON.parse(JSON.stringify(combined)),
            total: combined.length
        };
    } catch (error) {
        console.error('Error fetching files for client:', error);
        return { files: [], total: 0 };
    }
}

export async function getSuperAdminFiles() {
    await connectDB();
    try {
        const FileModel = (await import('@/models/File')).default;

        // 1. Get all from File model
        const dbFiles = await FileModel.find({}).sort({ createdAt: -1 }).lean();

        // 2. Get all tasks that have an attachment
        const tasksWithFiles = await Task.find({
            "attachment.url": { $exists: true, $ne: "" }
        }).sort({ createdAt: -1 }).lean();

        // 3. Convert task attachments to file format
        const taskFiles = tasksWithFiles.map(task => ({
            _id: `task-${task._id}`,
            name: task.attachment.name || "Unnamed Task Attachment",
            url: task.attachment.url,
            clientId: task.client?.id,
            clientName: task.client?.name || "Multiple/Unknown",
            type: task.attachment.name?.split('.').pop().toLowerCase() || 'file',
            size: "N/A", // Tasks don't store file size currently
            version: "Task Attachment",
            uploadedBy: task.assignee?.name || task.owner || "System",
            date: new Date(task.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
            createdAt: task.createdAt,
            isTaskAttachment: true,
            taskId: task.taskId,
            taskTitle: task.title
        }));

        // 4. Transform dbFiles for consistency if needed (already standard)
        const allFiles = [...dbFiles, ...taskFiles].sort((a, b) =>
            new Date(b.createdAt) - new Date(a.createdAt)
        );

        return JSON.parse(JSON.stringify(allFiles));
    } catch (error) {
        console.error('Error fetching super admin files:', error);
        return [];
    }
}

/**
 * Uploads a file and shares it with multiple clients
 * @param {FormData} formData - Contains the file and client info
 */
export async function uploadFiles(formData) {
    try {
        const file = formData.get('file');
        const recipients = JSON.parse(formData.get('recipients') || formData.get('clients') || '[]'); // Array of {id, name, role}
        const uploadedBy = formData.get('uploadedBy') || 'Admin';

        if (!file || recipients.length === 0) {
            throw new Error("File or recipients missing");
        }

        // 1. Upload to Vercel Blob
        const { put } = await import('@vercel/blob');
        const token = process.env.BLOB_READ_WRITE_TOKEN || "vercel_blob_rw_SZFDjh9KdeU1EfbI_Z3lvVic5ELojJ2b8yE3xnnemAQl6Oe";

        const blob = await put(file.name, file, {
            access: 'public',
            token: token,
            addRandomSuffix: true,
        });

        // 2. Create File records for each recipient
        await connectDB();
        const FileModel = (await import('@/models/File')).default;
        const fileType = file.name.split('.').pop().toLowerCase();
        let categorizedType = 'file';
        if (['jpg', 'jpeg', 'png', 'svg', 'webp'].includes(fileType)) categorizedType = 'image';
        else if (['pdf'].includes(fileType)) categorizedType = 'pdf';
        else if (['xls', 'xlsx', 'csv'].includes(fileType)) categorizedType = 'excel';

        const createdFiles = [];

        for (const recipient of recipients) {
            const role = recipient.role || 'client';
            const newFile = await FileModel.create({
                name: file.name,
                clientId: recipient.id,
                clientName: recipient.name,
                recipientId: recipient.id,
                recipientName: recipient.name,
                recipientRole: role,
                type: categorizedType,
                size: (file.size / 1024 / 1024).toFixed(2) >= 0.1
                    ? (file.size / 1024 / 1024).toFixed(2) + ' MB'
                    : (file.size / 1024).toFixed(2) + ' KB',
                version: '1.0',
                uploadedBy: uploadedBy,
                url: blob.url,
                date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
            });

            // 3. Notify Recipients

            // 3.1 Notify Recipient directly
            await createNotification({
                recipientId: recipient.id,
                title: 'New File Received',
                message: `${uploadedBy} has shared a new file with you: "${file.name}"`,
                type: 'info',
                link: role === 'client' ? '#Files' : '/admin/dashboard?tab=Files',
                skipEmail: true
            });

            // Send email to recipient
            const user = await User.findById(recipient.id).select('email');
            if (user?.email) {
                const dashboardLink = role === 'client'
                    ? `${getBaseUrl()}/client/dashboard#Files`
                    : `${getBaseUrl()}/admin/dashboard?tab=Files`;

                await sendEmail({
                    to: user.email,
                    ...emailTemplates.notification({
                        title: 'New File Received',
                        message: `A new file "${file.name}" has been shared with you and is available for download in your dashboard.`,
                        link: dashboardLink
                    })
                });
            }

            // 3.2 Notify Managers ONLY if recipient is a client
            if (role === 'client') {
                const fullClientDoc = await User.findById(recipient.id).select('managerId salesManager listingManager');
                if (fullClientDoc) {
                    const managerNames = [fullClientDoc.salesManager, fullClientDoc.listingManager].filter(Boolean);
                    const explicitManagers = await User.find({ name: { $in: managerNames }, role: 'admin' }).select('_id email');
                    const managersToNotify = [];
                    if (fullClientDoc.managerId) {
                        const manager = await User.findById(fullClientDoc.managerId).select('_id email');
                        if (manager) managersToNotify.push(manager);
                    }
                    explicitManagers.forEach(m => {
                        if (!managersToNotify.some(existing => existing._id.toString() === m._id.toString())) {
                            managersToNotify.push(m);
                        }
                    });

                    for (const manager of managersToNotify) {
                        // Skip if manager is the one who uploaded OR is the recipient
                        if (manager._id.toString() === recipient.id.toString()) continue;

                        await createNotification({
                            recipientId: manager._id,
                            title: 'File Uploaded to Client',
                            message: `A new file "${file.name}" was uploaded to ${recipient.name}'s account.`,
                            type: 'info',
                            link: '#Clients',
                            skipEmail: true
                        });
                        if (manager.email) {
                            await sendEmail({
                                to: manager.email,
                                ...emailTemplates.notification({
                                    title: 'File Uploaded to Client',
                                    message: `A new file "${file.name}" was uploaded by an administrator to ${recipient.name}'s account.`,
                                    link: `${getBaseUrl()}/admin/dashboard?tab=Clients`
                                })
                            });
                        }
                    }
                }
            }


            // 3.3 Notify Super Admins
            await notifySuperAdmins({
                title: 'New File Uploaded',
                message: `A file "${file.name}" was uploaded by ${uploadedBy} and shared with ${recipient.name}.`,
                type: 'file',
                link: '#Files',
                skipEmail: true
            });
            const superAdmins = await User.find({ role: 'super-admin' }).select('email');
            for (const sa of superAdmins) {
                await sendEmail({
                    to: sa.email,
                    ...emailTemplates.notification({
                        title: 'New File Uploaded',
                        message: `A file "${file.name}" was uploaded by ${uploadedBy} and shared with ${recipient.name}.`,
                        link: `${getBaseUrl()}/super-admin/dashboard?tab=Files`
                    })
                });
            }

            createdFiles.push(newFile);
        }

        await logActivity({
            action: 'Files Uploaded',
            target: file.name,
            details: `Shared with ${recipients.length} clients`,
            type: 'file'
        });

        return { success: true, files: JSON.parse(JSON.stringify(createdFiles)) };
    } catch (error) {
        console.error('Error uploading files:', error);
        return { success: false, error: error.message };
    }
}

export async function deleteFile(id) {
    await connectDB();
    try {
        const FileModel = (await import('@/models/File')).default;
        await FileModel.findByIdAndDelete(id);
        return { success: true };
    } catch (error) {
        console.error('Error deleting file:', error);
        return { success: false, error: error.message };
    }
}
