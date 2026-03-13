'use server';

import connectDB from '@/lib/mongodb';
import { validateRole } from "@/lib/auth-utils";
import User from '@/models/User';
import Task from '@/models/Task';
import Invoice from '@/models/Invoice';
import ActivityLog from '@/models/ActivityLog';

/**
 * Helper: get previous period range for comparison
 */
function getPreviousPeriodRange(startDate, endDate) {
    if (!startDate || !endDate) return { prevStart: null, prevEnd: null };
    const start = new Date(startDate);
    const end = new Date(endDate);
    const duration = end.getTime() - start.getTime();
    const prevEnd = new Date(start.getTime() - 1); // 1ms before current start
    const prevStart = new Date(prevEnd.getTime() - duration);
    return { prevStart, prevEnd };
}

import { cache } from '@/lib/cache';

export async function getDashboardStats({ startDate, endDate } = {}) {
    await validateRole(['super-admin', 'admin']);
    const cacheKey = `dashboard_stats_${startDate || 'all'}_${endDate || 'all'}`;

    return await cache.wrap(cacheKey, async () => {
        await connectDB();
        try {
            const start = startDate ? new Date(startDate) : null;
            const end = endDate ? new Date(endDate) : null;

            // Perform main queries in parallel
            const [
                totalClients,
                totalAdmins,
                activeClients,
                activeTasks,
                totalTasksStats,
                recentActivities
            ] = await Promise.all([
                User.countDocuments({ role: 'client' }),
                User.countDocuments({ role: 'admin' }),
                User.countDocuments({ role: 'client', status: 'active' }),
                Task.countDocuments({ status: { $in: [/^in progress$/i, /^under review$/i] } }),
                Task.countDocuments({}),
                ActivityLog.find({}).sort({ timestamp: -1 }).limit(10).lean()
            ]);

            // Period-specific: new clients joined in this period
            let newClientsInPeriod = 0;
            let prevNewClients = 0;

            // Tasks completed in the period
            let completedInPeriod = 0;
            let prevCompletedInPeriod = 0;
            let tasksCreatedInPeriod = 0;

            if (start && end) {
                const { prevStart, prevEnd } = getPreviousPeriodRange(start, end);

                const [
                    currClients, prevClients,
                    currCompleted, currCreated,
                    prevCompleted
                ] = await Promise.all([
                    User.countDocuments({ role: 'client', createdAt: { $gte: start, $lte: end } }),
                    prevStart ? User.countDocuments({ role: 'client', createdAt: { $gte: prevStart, $lte: prevEnd } }) : 0,
                    Task.countDocuments({ status: 'Completed', updatedAt: { $gte: start, $lte: end } }),
                    Task.countDocuments({ createdAt: { $gte: start, $lte: end } }),
                    prevStart ? Task.countDocuments({ status: 'Completed', updatedAt: { $gte: prevStart, $lte: prevEnd } }) : 0
                ]);

                newClientsInPeriod = currClients;
                prevNewClients = prevClients;
                completedInPeriod = currCompleted;
                tasksCreatedInPeriod = currCreated;
                prevCompletedInPeriod = prevCompleted;
            } else {
                completedInPeriod = await Task.countDocuments({ status: 'Completed' });
            }

            let totalRevenue = 0;
            let prevRevenue = 0;

            // Pipeline helper
            const getRevenuePipeline = (periodStart, periodEnd) => {
                const matchQuery = { status: 'Paid' };

                if (periodStart || periodEnd) {
                    const dateQuery = {};
                    if (periodStart) dateQuery.$gte = periodStart;
                    if (periodEnd) dateQuery.$lte = periodEnd;

                    matchQuery.$or = [
                        { date: dateQuery },
                        { createdAt: dateQuery }
                    ];
                }

                return [
                    { $match: matchQuery },
                    {
                        $group: {
                            _id: null,
                            totalAmount: {
                                $sum: {
                                    $cond: {
                                        if: { $isNumber: "$amount" },
                                        then: "$amount",
                                        else: {
                                            $convert: { input: "$amount", to: "double", onError: 0, onNull: 0 }
                                        }
                                    }
                                }
                            }
                        }
                    }
                ];
            };

            const [currRevenueResult, pendingInvoicesCount] = await Promise.all([
                Invoice.aggregate(getRevenuePipeline(start, end)),
                Invoice.countDocuments({ status: 'Pending' })
            ]);

            totalRevenue = currRevenueResult.length > 0 ? currRevenueResult[0].totalAmount : 0;

            if (start && end) {
                const { prevStart, prevEnd } = getPreviousPeriodRange(start, end);
                const prevRevenueResult = await Invoice.aggregate(getRevenuePipeline(prevStart, prevEnd));
                prevRevenue = prevRevenueResult.length > 0 ? prevRevenueResult[0].totalAmount : 0;
            }

            const pendingInvoices = pendingInvoicesCount;

            // Calculate percentage changes
            const revenueChange = prevRevenue > 0
                ? Math.round(((totalRevenue - prevRevenue) / prevRevenue) * 100)
                : (totalRevenue > 0 ? 100 : 0);

            const clientsChange = prevNewClients > 0
                ? Math.round(((newClientsInPeriod - prevNewClients) / prevNewClients) * 100)
                : (newClientsInPeriod > 0 ? 100 : 0);

            const completedChange = prevCompletedInPeriod > 0
                ? Math.round(((completedInPeriod - prevCompletedInPeriod) / prevCompletedInPeriod) * 100)
                : (completedInPeriod > 0 ? 100 : 0);

            return {
                totalClients,
                totalAdmins,
                activeClients,
                totalRevenue,
                pendingInvoices,
                activeTasks,
                completedTasks: completedInPeriod,
                tasksCreated: tasksCreatedInPeriod,
                newClients: newClientsInPeriod,
                totalTasksStats,
                revenueChange,
                clientsChange,
                completedChange,
                recentActivities: JSON.parse(JSON.stringify(recentActivities))
            };
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
            throw new Error('Failed to fetch dashboard statistics');
        }
    }, 300); // 5 minute TTL
}

export async function logActivity(data) {
    if (!data.action) return;
    try {
        await connectDB();

        // Define the user object for the model
        const logUser = {
            id: data.userId || data.user?.id || null, // Handle both formats
            name: data.userName || data.user?.name || 'System',
            role: data.userRole || data.user?.role || 'system'
        };

        // Ensure type matches enum: ['system', 'user', 'client', 'task', 'file', 'note']
        const validTypes = ['system', 'user', 'client', 'task', 'file', 'note'];
        const logType = validTypes.includes(data.type) ? data.type : (data.userRole === 'client' ? 'client' : 'user');

        await ActivityLog.create({
            user: logUser,
            action: data.action,
            target: data.target || '',
            details: data.details || '',
            type: logType,
            timestamp: new Date()
        });
    } catch (error) {
        console.error('Failed to log activity:', error);
    }
}

export async function getActivityLogs(options = { limit: 50, skip: 0 }) {
    await validateRole(['super-admin', 'admin']);
    await connectDB();
    try {
        const logs = await ActivityLog.find()
            .sort({ timestamp: -1 })
            .limit(options.limit)
            .skip(options.skip)
            .populate('user.id', 'name email role')
            .lean();

        return JSON.parse(JSON.stringify(logs));
    } catch (error) {
        console.error('Error fetching logs:', error);
        return [];
    }
}
