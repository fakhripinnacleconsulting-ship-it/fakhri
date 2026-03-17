'use server';

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Task from '@/models/Task';
import { createNotification } from '@/lib/actions/notification';
import { sendEmail, emailTemplates } from '@/lib/mail';
import { logActivity } from '@/lib/actions/dashboard';
import { notifySuperAdmins } from './admin.service';
import { validateRole } from "@/lib/auth-utils";

export async function getTasks(filter = {}, projection = null) {
    await validateRole(['super-admin', 'admin', 'client']);
    await connectDB();
    try {
        const { limit, ...actualFilter } = filter;
        const query = Task.find(actualFilter).sort({ createdAt: -1 });
        if (projection) query.select(projection);
        if (limit) query.limit(limit);
        const tasks = await query.lean();
        return JSON.parse(JSON.stringify(tasks));
    } catch (error) {
        console.error('Error fetching tasks:', error);
        return [];
    }
}

export async function upsertTask(taskData) {
    const initiator = await validateRole(['super-admin', 'admin', 'client']);
    await connectDB();

    try {
        const id = taskData._id || taskData.id;
        let task;
        const isNew = !(id && id.toString().length >= 12);

        const { _id, ...updateData } = taskData;

        // Clean up empty strings for ObjectId fields
        if (updateData.client && updateData.client.id === "") {
            updateData.client.id = null;
        }
        if (updateData.assignee && updateData.assignee.id === "") {
            updateData.assignee.id = null;
        }

        if (!isNew) {
            task = await Task.findByIdAndUpdate(id, updateData, { new: true }).lean();
        } else {
            // Generate taskId if creating new
            if (!updateData.taskId) {
                const lastTask = await Task.findOne().sort({ taskId: -1 }).select('taskId').lean();
                let nextId = 1;
                if (lastTask && lastTask.taskId) {
                    const lastIdMatch = lastTask.taskId.match(/TSK-(\d+)/);
                    if (lastIdMatch) {
                        nextId = parseInt(lastIdMatch[1]) + 1;
                    }
                }
                updateData.taskId = `TSK-${String(nextId).padStart(3, '0')}`;
            }
            task = await Task.create(updateData);
        }

        if (task) {
            console.log(`Task ${isNew ? 'created' : 'updated'} successfully:`, task.taskId);
            const isNewAssignment = isNew;
            const eventTitle = isNewAssignment ? 'A new task has been created' : 'A task update has been recorded';
            const notifTitle = isNewAssignment ? 'New Task Assigned' : 'Task Updated';
            const notifMessage = isNewAssignment ? `You have a new task: "${task.title}"` : `Task "${task.title}" has been updated.`;

            // Fetch extra data for the unified template
            let fullClient = null;
            if (task.client?.id) {
                fullClient = await User.findById(task.client.id)
                    .populate('managerId', 'name email phone')
                    .populate({
                        path: 'teams',
                        populate: {
                            path: 'leadId',
                            select: 'name email phone'
                        }
                    })
                    .lean();

                if (fullClient?.managerId) {
                    fullClient.managerDetails = fullClient.managerId;
                }

                if (fullClient?.teams && fullClient.teams.length > 0) {
                    const primaryTeamWithLead = fullClient.teams.find(t => t.leadId);
                    if (primaryTeamWithLead?.leadId) {
                        fullClient.supervisorDetails = primaryTeamWithLead.leadId;
                    }
                }
            }

            const emailRecipients = new Set();
            const pushRecipients = new Set();

            // 1. Prepare Client Notification
            if (task.client?.id) {
                await createNotification({
                    recipientId: task.client.id,
                    title: notifTitle,
                    message: notifMessage,
                    type: 'task',
                    link: '#Tasks',
                    skipEmail: true
                });
                if (fullClient?.email) {
                    emailRecipients.add(fullClient.email);
                }
            }

            // 2. Prepare Assignee Notification
            if (task.assignee?.id) {
                await createNotification({
                    recipientId: task.assignee.id,
                    title: notifTitle,
                    message: notifMessage,
                    type: 'task',
                    link: '#Tasks',
                    skipEmail: true
                });
                const admin = await User.findById(task.assignee.id).select('email');
                if (admin?.email) {
                    emailRecipients.add(admin.email);
                }
            }

            // 3. Prepare Super-Admin Notifications
            const saMessage = isNew
                ? `New task "${task.title}" assigned to ${task.assignee?.name || 'Unassigned'} for ${task.client?.name || 'Unknown Client'}.`
                : `Task "${task.title}" has been updated.`;

            await notifySuperAdmins({
                title: notifTitle,
                message: saMessage,
                type: 'task',
                link: '#Tasks',
                skipEmail: true
            });

            const superAdmins = await User.find({ role: 'super-admin' }).select('email');
            for (const sa of superAdmins) {
                if (sa.email) {
                    emailRecipients.add(sa.email);
                }
            }

            // 4. Send the detailed email to all unique recipients
            for (const email of emailRecipients) {
                await sendEmail({
                    to: email,
                    ...emailTemplates.taskEventNotification({
                        eventTitle,
                        task,
                        client: fullClient,
                        initiator
                    })
                });
            }
        }

        await logActivity({
            action: isNew ? 'Task Created' : 'Task Updated',
            target: task.title,
            details: isNew ? `New task assigned to ${task.assignee?.name || 'Unassigned'}` : `Status/Details changed for task ${task.taskId}`,
            type: 'task'
        });

        return JSON.parse(JSON.stringify(task));
    } catch (error) {
        console.error('Error upserting task:', error);
        return null;
    }
}

export async function deleteTask(id) {
    await validateRole(['super-admin', 'admin']);
    await connectDB();
    try {
        const task = await Task.findById(id).lean();
        if (task) {
            await Task.findByIdAndDelete(id);

            // Notify Assignee
            if (task.assignee?.id) {
                await createNotification({
                    recipientId: task.assignee.id,
                    title: 'Task Removed',
                    message: `Task "${task.title}" has been removed.`,
                    type: 'task',
                    link: '#Tasks'
                });
            }

            // Notify super-admins
            await notifySuperAdmins({
                title: 'Task Deleted',
                message: `Task "${task.title}" has been deleted.`,
                type: 'warning',
                link: '#Tasks',
                icon: 'Trash2'
            });

            await logActivity({
                action: 'Task Deleted',
                target: task.title,
                details: `Task ${task.taskId} was removed by an administrator`,
                type: 'task'
            });
        }
        return { success: true };
    } catch (error) {
        console.error('Error deleting task:', error);
        return { success: false };
    }
}

export async function bulkDeleteTasks(ids) {
    await validateRole(['super-admin', 'admin']);
    await connectDB();
    try {
        const CHUNK_SIZE = 500;
        let deletedCount = 0;

        for (let i = 0; i < ids.length; i += CHUNK_SIZE) {
            const chunk = ids.slice(i, i + CHUNK_SIZE);
            const result = await Task.deleteMany({ _id: { $in: chunk } });
            deletedCount += result.deletedCount || 0;
        }

        await logActivity({
            action: 'Bulk Tasks Deleted',
            target: `${ids.length} Tasks`,
            details: `A bulk deletion of ${ids.length} tasks was performed. Actually deleted: ${deletedCount}`,
            type: 'task'
        });
        return { success: true };
    } catch (error) {
        console.error('Error bulk deleting tasks:', error);
        return { success: false, error: error.message };
    }
}

export async function uploadTaskAttachment(formData) {
    await validateRole(['super-admin', 'admin', 'client']);
    try {
        const file = formData.get('file');
        if (!file) {
            throw new Error("File missing");
        }

        const { put } = await import('@vercel/blob');
        const token = process.env.BLOB_READ_WRITE_TOKEN || "vercel_blob_rw_SZFDjh9KdeU1EfbI_Z3lvVic5ELojJ2b8yE3xnnemAQl6Oe";

        const blob = await put(file.name, file, {
            access: 'public',
            token: token,
            addRandomSuffix: true,
        });

        return { success: true, url: blob.url, name: file.name };
    } catch (error) {
        console.error('Error uploading task attachment:', error);
        return { success: false, error: error.message };
    }
}

export async function updateTaskStatus(taskId, status) {
    const initiator = await validateRole(['super-admin', 'admin', 'client']);
    await connectDB();
    try {
        const task = await Task.findByIdAndUpdate(taskId, { status }, { new: true }).lean();

        if (task) {
            const subject = `Task Status Updated: ${task.title}`;
            const message = `Task "${task.title}" is now ${status}`;

            // Fetch full client details for email
            const fullClient = await User.findById(task.client.id)
                .populate('managerId', 'name email phone')
                .populate({
                    path: 'teams',
                    populate: {
                        path: 'leadId',
                        select: 'name email phone'
                    }
                })
                .lean();

            if (fullClient?.managerId) {
                fullClient.managerDetails = fullClient.managerId;
            }

            // Get supervisor (lead of the first team client is in)
            if (fullClient?.teams && fullClient.teams.length > 0) {
                const primaryTeamWithLead = fullClient.teams.find(t => t.leadId);
                if (primaryTeamWithLead?.leadId) {
                    fullClient.supervisorDetails = primaryTeamWithLead.leadId;
                }
            }
            // const session = await getServerSession(authOptions);
            // const initiator = session?.user;

            const eventTitle = status === 'Completed' ? 'A task has been completed' : 'A task status has been updated';

            // Colors
            const statusColor = status === 'Completed' ? '#81c784' : (status === 'On Hold' ? '#e5e5e5' : '#fff176');

            const emailRecipients = new Set();

            if (task.client?.id) {
                await createNotification({
                    recipientId: task.client.id,
                    title: 'Task Status Updated',
                    message,
                    type: 'task',
                    link: '#Tasks',
                    skipEmail: true
                });
                if (fullClient?.email) {
                    emailRecipients.add(fullClient.email);
                }
            }

            if (task.assignee?.id) {
                await createNotification({
                    recipientId: task.assignee.id,
                    title: 'Task Status Updated',
                    message,
                    type: 'task',
                    link: '#Tasks',
                    skipEmail: true
                });
                const admin = await User.findById(task.assignee.id).select('email');
                if (admin?.email) {
                    emailRecipients.add(admin.email);
                }
            }

            await notifySuperAdmins({
                title: 'Task Status Updated',
                message: `${message} (${task.client?.name || 'Unknown Client'}).`,
                type: 'task',
                link: '#Tasks',
                skipEmail: true
            });

            const superAdmins = await User.find({ role: 'super-admin' }).select('email');
            for (const sa of superAdmins) {
                if (sa.email) {
                    emailRecipients.add(sa.email);
                }
            }

            for (const email of emailRecipients) {
                await sendEmail({
                    to: email,
                    ...emailTemplates.taskEventNotification({
                        eventTitle,
                        task,
                        client: fullClient,
                        initiator,
                        statusColor
                    })
                });
            }
        }

        return JSON.parse(JSON.stringify(task));
    } catch (error) {
        console.error('Error updating task status:', error);
        return null;
    }
}

export async function addTaskUpdate(taskId, update) {
    const initiator = await validateRole(['super-admin', 'admin', 'client']);
    await connectDB();
    try {
        const task = await Task.findByIdAndUpdate(taskId, {
            $push: { updates: { ...update, date: new Date() } }
        }, { new: true }).lean();

        if (task) {
            const message = `New update on task "${task.title}"`;

            const fullClient = await User.findById(task.client.id)
                .populate('managerId', 'name email phone')
                .populate({
                    path: 'teams',
                    populate: {
                        path: 'leadId',
                        select: 'name email phone'
                    }
                })
                .lean();

            if (fullClient?.managerId) {
                fullClient.managerDetails = fullClient.managerId;
            }

            if (fullClient?.teams && fullClient.teams.length > 0) {
                const primaryTeamWithLead = fullClient.teams.find(t => t.leadId);
                if (primaryTeamWithLead?.leadId) {
                    fullClient.supervisorDetails = primaryTeamWithLead.leadId;
                }
            }
            // const session = await getServerSession(authOptions);
            // const initiator = session?.user;

            const eventTitle = 'A task update has been recorded';
            const emailRecipients = new Set();

            if (task.client?.id) {
                await createNotification({
                    recipientId: task.client.id,
                    title: 'New Task Update',
                    message,
                    type: 'task',
                    link: '#Tasks',
                    skipEmail: true
                });
                if (fullClient?.email) {
                    emailRecipients.add(fullClient.email);
                }
            }

            if (task.assignee?.id) {
                await createNotification({
                    recipientId: task.assignee.id,
                    title: 'New Task Update',
                    message,
                    type: 'task',
                    link: '#Tasks',
                    skipEmail: true
                });
                const admin = await User.findById(task.assignee.id).select('email');
                if (admin?.email) {
                    emailRecipients.add(admin.email);
                }
            }

            await notifySuperAdmins({
                title: 'New Task Update',
                message: `Update posted on task "${task.title}" for ${task.client?.name || 'Unknown Client'}.`,
                type: 'task',
                link: '#Tasks',
                skipEmail: true
            });

            const superAdmins = await User.find({ role: 'super-admin' }).select('email');
            for (const sa of superAdmins) {
                if (sa.email) {
                    emailRecipients.add(sa.email);
                }
            }

            for (const email of emailRecipients) {
                await sendEmail({
                    to: email,
                    ...emailTemplates.taskEventNotification({
                        eventTitle,
                        task: { ...task, description: `Update: ${update.message}` },
                        client: fullClient,
                        initiator
                    })
                });
            }
        }

        return JSON.parse(JSON.stringify(task));
    } catch (error) {
        console.error('Error adding task update:', error);
        return null;
    }
}

export async function notifyOverdueTasks() {
    await connectDB();
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const overdueTasks = await Task.find({
            status: { $ne: 'Completed' },
            dueDate: { $exists: true, $ne: '' }
        }).lean();

        const filteredOverdue = overdueTasks.filter(task => {
            const d = new Date(task.dueDate);
            return !isNaN(d.getTime()) && d < today;
        });

        if (filteredOverdue.length === 0) return { success: true, count: 0 };

        for (const task of filteredOverdue) {
            const title = `Task Overdue: ${task.taskId}`;
            const message = `Task "${task.title}" for ${task.client?.name || 'Unknown Client'} is overdue (Due: ${task.dueDate}).`;

            const fullClient = await User.findById(task.client.id)
                .populate('managerId', 'name email phone')
                .populate({
                    path: 'teams',
                    populate: {
                        path: 'leadId',
                        select: 'name email phone'
                    }
                })
                .lean();

            if (fullClient?.managerId) {
                fullClient.managerDetails = fullClient.managerId;
            }

            if (fullClient?.teams && fullClient.teams.length > 0) {
                const primaryTeamWithLead = fullClient.teams.find(t => t.leadId);
                if (primaryTeamWithLead?.leadId) {
                    fullClient.supervisorDetails = primaryTeamWithLead.leadId;
                }
            }
            const initiator = { name: 'System Monitor', email: 'support@fakhriitservices.com' };
            const eventTitle = 'A task has become overdue';

            const emailRecipients = new Set();

            if (task.assignee?.id) {
                await createNotification({
                    recipientId: task.assignee.id,
                    title,
                    message,
                    type: 'warning',
                    link: '#Tasks',
                    skipEmail: true
                });
                const admin = await User.findById(task.assignee.id).select('email');
                if (admin?.email) {
                    emailRecipients.add(admin.email);
                }
            }

            await notifySuperAdmins({
                title,
                message,
                type: 'warning',
                link: '#Tasks',
                icon: 'AlertTriangle',
                skipEmail: true
            });
            const superAdmins = await User.find({ role: 'super-admin' }).select('email');
            for (const sa of superAdmins) {
                if (sa.email) {
                    emailRecipients.add(sa.email);
                }
            }

            if (task.client?.id) {
                const client = await User.findById(task.client.id).select('managerId salesManager listingManager');
                const managerNames = [client?.salesManager, client?.listingManager].filter(Boolean);
                const explicitManagers = await User.find({ name: { $in: managerNames }, role: 'admin' }).select('email phone name _id');
                const managersToNotify = [];
                if (client?.managerId) {
                    const manager = await User.findById(client.managerId).select('email phone name _id');
                    if (manager) managersToNotify.push(manager);
                }
                explicitManagers.forEach(m => {
                    if (!managersToNotify.some(existing => existing._id.toString() === m._id.toString())) {
                        managersToNotify.push(m);
                    }
                });

                for (const manager of managersToNotify) {
                    if (manager._id.toString() !== task.assignee?.id?.toString()) {
                        await createNotification({
                            recipientId: manager._id,
                            title,
                            message,
                            type: 'warning',
                            link: '#Tasks',
                            skipEmail: true
                        });
                        if (manager.email) {
                            emailRecipients.add(manager.email);
                        }
                    }
                }
            }

            for (const email of emailRecipients) {
                await sendEmail({
                    to: email,
                    ...emailTemplates.taskEventNotification({
                        eventTitle,
                        task,
                        client: fullClient,
                        initiator,
                        dueDateColor: '#ff5252'
                    })
                });
            }
        }

        return { success: true, count: filteredOverdue.length };
    } catch (error) {
        console.error('Error notifying overdue tasks:', error);
        return { success: false, error: error.message };
    }
}

export async function getActiveTaskCounts() {
    await connectDB();
    try {
        const counts = await Task.aggregate([
            {
                $match: {
                    status: { $nin: ['Completed', 'Cancelled'] }
                }
            },
            {
                $group: {
                    _id: '$client.id',
                    count: { $sum: 1 }
                }
            }
        ]);

        const countMap = {};
        counts.forEach(item => {
            if (item._id) {
                countMap[item._id.toString()] = item.count;
            }
        });

        return countMap;
    } catch (error) {
        console.error('Error fetching active task counts:', error);
        return {};
    }
}
