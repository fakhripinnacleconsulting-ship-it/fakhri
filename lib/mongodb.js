import mongoose from 'mongoose';
import { logger } from './logger';

const log = logger('MongoDB');

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

// Add connection event listeners for better observability
mongoose.connection.on('connected', () => log.info('Mongoose connected to DB'));
mongoose.connection.on('error', (err) => log.error('Mongoose connection error', { error: err.message }));
mongoose.connection.on('disconnected', () => log.warn('Mongoose disconnected'));

async function connectDB() {
    if (cached.conn) {
        return cached.conn;
    }

    if (!cached.promise) {
        const opts = {
            bufferCommands: false,
            maxPoolSize: 10, // Maintain up to 10 socket connections
            minPoolSize: 2,  // Keep at least 2 connections open
            serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
            socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
        };

        log.debug('Initializing new MongoDB connection pool');
        cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
            return mongoose;
        });
    }

    try {
        cached.conn = await cached.promise;
        return cached.conn;
    } catch (e) {
        cached.promise = null;
        log.error('Failed to establish MongoDB connection', { error: e.message });
        throw e;
    }
}

export default connectDB;
