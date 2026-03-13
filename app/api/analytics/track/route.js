import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Analytics } from '@/models/Analytics';
import { apiLimiter } from '@/lib/rate-limit';

export async function POST(req) {
    try {
        // Rate limiting tracking
        const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
        const rateLimit = apiLimiter.check(`track_${ip}`);

        if (!rateLimit.allowed) {
            return NextResponse.json({ success: false, error: 'Too many tracking requests' }, { status: 429 });
        }

        await connectDB();
        const data = await req.json();

        const {
            userId,
            userEmail,
            path,
            timeSpentSeconds,
            userAgent,
            deviceType,
            browser,
            os,
            sessionId,
            events
        } = data;

        if (!sessionId || !path) {
            return NextResponse.json({ success: false, error: 'Session ID and Path are required' }, { status: 400 });
        }

        // Try to find an existing record for this session and path today
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        let doc = await Analytics.findOne({
            sessionId,
            path,
            createdAt: { $gte: startOfDay }
        });

        if (doc) {
            // Update existing record
            doc.timeSpentSeconds = (doc.timeSpentSeconds || 0) + (timeSpentSeconds || 0);
            if (events && events.length > 0) {
                doc.events.push(...events);
            }
            if (userId && !doc.userId) {
                doc.userId = userId;
            }
            if (userEmail && !doc.userEmail) {
                doc.userEmail = userEmail;
            }
            await doc.save();
        } else {
            // Create new record
            doc = await Analytics.create({
                userId,
                userEmail,
                path,
                timeSpentSeconds: timeSpentSeconds || 0,
                userAgent,
                deviceType,
                browser,
                os,
                sessionId,
                events: events || []
            });
        }

        return NextResponse.json({ success: true, data: doc });

    } catch (error) {
        console.error("Analytics tracking error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
