import mongoose from 'mongoose';

const PricingFeatureSchema = new mongoose.Schema({
    text: { type: String, required: true, unique: true },
    description: { type: String },
    order: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.models.PricingFeature || mongoose.model('PricingFeature', PricingFeatureSchema);
