import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Analytics } from "@/models/Analytics";

export async function GET(request) {
    try {
        await connectDB();
        const { searchParams } = new URL(request.url);

        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "15");
        const search = searchParams.get("search") || "";
        const period = searchParams.get("period") || "7d";
        const from = searchParams.get("from");
        const to = searchParams.get("to");
        const paths = searchParams.get("paths");
        const sortField = searchParams.get("sortField") || "updatedAt";
        const sortOrder = searchParams.get("sortOrder") || "desc";
        const deviceFilter = searchParams.get("device") || "";
        const email = searchParams.get("email") || "";

        // Build date filter
        let dateFilter = {};
        const now = new Date();
        switch (period) {
            case "24h":
                dateFilter = { updatedAt: { $gte: new Date(now - 24 * 60 * 60 * 1000) } };
                break;
            case "7d":
                dateFilter = { updatedAt: { $gte: new Date(now - 7 * 24 * 60 * 60 * 1000) } };
                break;
            case "30d":
                dateFilter = { updatedAt: { $gte: new Date(now - 30 * 24 * 60 * 60 * 1000) } };
                break;
            case "90d":
                dateFilter = { updatedAt: { $gte: new Date(now - 90 * 24 * 60 * 60 * 1000) } };
                break;
            case "custom":
                if (from || to) {
                    dateFilter.updatedAt = {};
                    if (from) dateFilter.updatedAt.$gte = new Date(from);
                    if (to) dateFilter.updatedAt.$lte = new Date(to);
                }
                break;
            case "all":
            default:
                break;
        }

        // Build match conditions
        let matchCondition = { ...dateFilter };

        // Search filter (search in email, path, browser, os, userName)
        if (search) {
            matchCondition.$or = [
                { userEmail: { $regex: search, $options: "i" } },
                { userName: { $regex: search, $options: "i" } },
                { path: { $regex: search, $options: "i" } },
                { browser: { $regex: search, $options: "i" } },
                { os: { $regex: search, $options: "i" } },
            ];
        }

        // Email filter
        if (email) {
            matchCondition.userEmail = { $regex: email, $options: "i" };
        }

        // Path filter
        if (paths) {
            const pathsArray = paths.split(",").filter(Boolean);
            if (pathsArray.length > 0) {
                matchCondition.path = { $in: pathsArray };
            }
        }

        // Device filter
        if (deviceFilter) {
            matchCondition.deviceType = deviceFilter;
        }

        // Sort
        const sortObj = {};
        sortObj[sortField] = sortOrder === "asc" ? 1 : -1;

        const skip = (page - 1) * limit;
        const total = await Analytics.countDocuments(matchCondition);
        const sessions = await Analytics.find(matchCondition)
            .sort(sortObj)
            .skip(skip)
            .limit(limit)
            .lean();

        // Get unique paths for the filter dropdown
        const uniquePaths = await Analytics.distinct("path", dateFilter);

        return NextResponse.json({
            success: true,
            sessions,
            uniquePaths: uniquePaths.sort(),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("Sessions fetch error:", error);
        return NextResponse.json({ success: false, error: "Failed to fetch sessions" }, { status: 500 });
    }
}
