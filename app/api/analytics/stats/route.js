import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Analytics } from '@/models/Analytics';
import { validateRole } from '@/lib/auth-utils';

export async function GET(req) {
    try {
        await validateRole(['super-admin']);
        await connectDB();

        const { searchParams } = new URL(req.url);
        const emailFilter = searchParams.get('email');
        const periodFilter = searchParams.get('period') || '7d';
        const fromDateStr = searchParams.get('from');
        const toDateStr = searchParams.get('to');

        // Calculate date filter based on period
        let startDate = new Date();
        let endDate = new Date();

        if (periodFilter === 'custom' && fromDateStr && toDateStr) {
            startDate = new Date(fromDateStr);
            endDate = new Date(toDateStr);
            endDate.setHours(23, 59, 59, 999);
        } else if (periodFilter === '24h') {
            startDate.setHours(startDate.getHours() - 24);
        } else if (periodFilter === '7d') {
            startDate.setDate(startDate.getDate() - 7);
        } else if (periodFilter === '30d') {
            startDate.setDate(startDate.getDate() - 30);
        } else if (periodFilter === 'all') {
            startDate = new Date(0); // Beginning of time
        } else {
            startDate.setDate(startDate.getDate() - 7); // Default 7d
        }

        // Base match condition
        const matchCondition = {
            createdAt: { $gte: startDate, $lte: endDate }
        };

        if (emailFilter) {
            // Case-insensitive regex match for email
            matchCondition.userEmail = { $regex: emailFilter, $options: 'i' };
        }

        const totalVisits = await Analytics.countDocuments(matchCondition);

        // Aggregate time spent
        const timeStats = await Analytics.aggregate([
            { $match: matchCondition },
            { $group: { _id: null, avgTime: { $avg: '$timeSpentSeconds' }, totalTime: { $sum: '$timeSpentSeconds' } } }
        ]);

        // Unique registered active users
        const activeUsersData = await Analytics.aggregate([
            { $match: { ...matchCondition, userEmail: { $exists: true, $ne: null } } },
            { $group: { _id: "$userEmail" } },
            { $count: "total" }
        ]);
        const activeUsersCount = activeUsersData[0]?.total || 0;

        // Unique Paths (for filters)
        const uniquePaths = await Analytics.distinct('path', matchCondition);

        // Device split
        const deviceStats = await Analytics.aggregate([
            { $match: matchCondition },
            { $group: { _id: '$deviceType', count: { $sum: 1 } } }
        ]);

        // Top paths
        const topPaths = await Analytics.aggregate([
            { $match: matchCondition },
            { $group: { _id: '$path', views: { $sum: 1 }, avgTime: { $avg: '$timeSpentSeconds' } } },
            { $sort: { views: -1 } },
            { $limit: 10 }
        ]);

        // Recent specific users - Apply user filter if provided, otherwise show anyone with an email
        let recentUsersQuery = { createdAt: { $gte: startDate, $lte: endDate } };
        if (emailFilter) {
            recentUsersQuery.userEmail = { $regex: emailFilter, $options: 'i' };
        } else {
            recentUsersQuery.userEmail = { $exists: true, $ne: null };
        }

        const recentUsers = await Analytics.find(recentUsersQuery)
            .sort({ updatedAt: -1 })
            .limit(emailFilter ? 100 : 20) // Show more results when filtering specific user
            .select('userEmail path timeSpentSeconds updatedAt sessionId deviceType browser os')
            .lean();

        // Chart data
        const dailyVisits = await Analytics.aggregate([
            { $match: matchCondition },
            {
                $group: {
                    _id: periodFilter === '24h'
                        ? { $dateToString: { format: "%Y-%m-%d %H:00", date: "$createdAt" } } // Hourly for 24h
                        : { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, // Daily for others
                    visits: { $sum: 1 },
                    avgTime: { $avg: '$timeSpentSeconds' }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        return NextResponse.json({
            success: true,
            stats: {
                totalVisits,
                activeUsersCount,
                uniquePaths: uniquePaths.sort(),
                timeStats: timeStats[0] || { avgTime: 0, totalTime: 0 },
                deviceStats,
                topPaths,
                recentUsers,
                dailyVisits
            }
        });

    } catch (error) {
        console.error("Analytics stats error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
