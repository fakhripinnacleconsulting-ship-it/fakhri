import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Analytics } from "@/models/Analytics";

export async function POST(request) {
    try {
        await connectDB();
        const body = await request.json();

        const { sessionId, path, timeSpentSeconds, userAgent, deviceType, browser, os, userId, userEmail, userName } = body;

        if (!path) {
            return NextResponse.json({ success: false, error: "Path is required" }, { status: 400 });
        }

        // Upsert: update existing session+path record or create new one
        const filter = { sessionId, path };
        const update = {
            $set: {
                userAgent,
                deviceType: deviceType || "unknown",
                browser,
                os,
                ...(userId && { userId }),
                ...(userEmail && { userEmail }),
                ...(userName && { userName }),
            },
            $inc: { timeSpentSeconds: timeSpentSeconds || 0 },
        };

        await Analytics.findOneAndUpdate(filter, update, { upsert: true, new: true });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Analytics track error:", error);
        return NextResponse.json({ success: false, error: "Failed to track" }, { status: 500 });
    }
}
