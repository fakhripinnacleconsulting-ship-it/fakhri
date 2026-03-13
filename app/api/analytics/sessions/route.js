import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Analytics } from '@/models/Analytics';

export async function GET(req) {
    try {
        await connectDB();

        const { searchParams } = new URL(req.url);

        // Filters
        const globalEmail = searchParams.get('email');
        const periodFilter = searchParams.get('period') || '7d';
        const fromDateStr = searchParams.get('from');
        const toDateStr = searchParams.get('to');

        // Table specific params
        const page = parseInt(searchParams.get('page')) || 1;
        const limit = parseInt(searchParams.get('limit')) || 10;
        const tableSearch = searchParams.get('search') || '';
        const pathsParam = searchParams.get('paths'); // Comma-separated paths
        const sortField = searchParams.get('sortField') || 'updatedAt';
        const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1;

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
            createdAt: { $gte: startDate, $lte: endDate },
            userEmail: { $exists: true, $ne: null }
        };

        if (globalEmail) {
            matchCondition.userEmail = { $regex: globalEmail, $options: 'i' };
        }

        // Apply distinct paths filter
        if (pathsParam) {
            const pathsArray = pathsParam.split(',').filter(Boolean);
            if (pathsArray.length > 0) {
                matchCondition.path = { $in: pathsArray };
            }
        }

        // Apply table search on top of global email (can search path or email)
        if (tableSearch) {
            const searchRegex = { $regex: tableSearch, $options: 'i' };
            if (globalEmail && !pathsParam) {
                // If global email is set without rigid path, search only in path
                matchCondition.path = searchRegex;
            } else if (pathsParam && !globalEmail) {
                // If rigid paths set, search only in email
                matchCondition.userEmail = searchRegex;
            } else if (!pathsParam && !globalEmail) {
                // Otherwise search in either email or path
                matchCondition.$or = [
                    { userEmail: searchRegex },
                    { path: searchRegex }
                ];
            }
        }

        const skip = (page - 1) * limit;

        const [sessions, total] = await Promise.all([
            Analytics.find(matchCondition)
                .sort({ [sortField]: sortOrder })
                .skip(skip)
                .limit(limit)
                .select('userEmail path timeSpentSeconds updatedAt sessionId deviceType browser os')
                .lean(),
            Analytics.countDocuments(matchCondition)
        ]);

        return NextResponse.json({
            success: true,
            sessions,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error("Analytics sessions error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
