import mongoose from 'mongoose';

const PricingPlanSchema = new mongoose.Schema({
    planId: { type: String, unique: true, required: true }, // e.g., 'elite'
    name: { type: String, required: true },
    subtitle: { type: String },
    prices: {
        monthly: { type: String },
        monthlyUSD: { type: String },
    },
    durationValue: { type: Number, default: 1 },
    durationUnit: { 
        type: String, 
        enum: ['day', 'month', 'year'], 
        default: 'month' 
    },
    period: { type: String }, // For display purposes, e.g., "/ month" or "30 Days"
    description: { type: String },
    highlighted: { type: Boolean, default: false },
    cta: { type: String },
    features: [{
        text: { type: String },
        value: { type: mongoose.Schema.Types.Mixed },
        included: { type: Boolean }
    }],
    order: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.models.PricingPlan || mongoose.model('PricingPlan', PricingPlanSchema);
