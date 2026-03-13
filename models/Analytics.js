import mongoose from 'mongoose';

const analyticsSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false // can be null for anonymous
    },
    userEmail: {
        type: String,
        required: false
    },
    path: {
        type: String,
        required: true
    },
    timeSpentSeconds: {
        type: Number,
        default: 0
    },
    userAgent: {
        type: String
    },
    deviceType: {
        type: String,
        enum: ['mobile', 'tablet', 'desktop', 'unknown'],
        default: 'unknown'
    },
    browser: {
        type: String
    },
    os: {
        type: String
    },
    sessionId: {
        type: String
    },
    events: [{
        eventName: String,
        eventData: mongoose.Schema.Types.Mixed,
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],
}, { timestamps: true });

export const Analytics = mongoose.models.Analytics || mongoose.model('Analytics', analyticsSchema);
