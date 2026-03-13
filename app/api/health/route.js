import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb';

export async function GET(req) {
    const startTime = performance.now();
    let dbStatus = 'disconnected';

    try {
        await connectDB();

        // 0: disconnected, 1: connected, 2: connecting, 3: disconnecting
        if (mongoose.connection.readyState === 1) {
            dbStatus = 'connected';
            // Optional: Ping the database to be absolutely sure
            await mongoose.connection.db.admin().ping();
        } else {
            dbStatus = 'connecting or disconnected';
        }
    } catch (error) {
        dbStatus = 'error';
    }

    const duration = Math.round(performance.now() - startTime);

    const isHealthy = dbStatus === 'connected';

    return NextResponse.json(
        {
            status: isHealthy ? 'healthy' : 'unhealthy',
            timestamp: new Date().toISOString(),
            uptime: Math.round(process.uptime()),
            memory: process.memoryUsage(),
            database: {
                status: dbStatus
            },
            durationMs: duration
        },
        { status: isHealthy ? 200 : 503 }
    );
}
