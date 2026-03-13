import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('Please define the MONGODB_URI environment variable inside .env.local');
    process.exit(1);
}

const PricingPlanSchema = new mongoose.Schema({
    planId: { type: String, unique: true, required: true },
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
    period: { type: String }, // For display purposes
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

const PricingPlan = mongoose.models.PricingPlan || mongoose.model('PricingPlan', PricingPlanSchema);

const PricingFeatureSchema = new mongoose.Schema({
    text: { type: String, required: true, unique: true },
    description: { type: String },
    order: { type: Number, default: 0 }
}, { timestamps: true });

const PricingFeature = mongoose.models.PricingFeature || mongoose.model('PricingFeature', PricingFeatureSchema);

const professionalFeatures = [
    { text: 'Account Health Monitoring', order: 1, description: 'Continuous monitoring of account performance and health metrics.' },
    { text: 'Listing Optimization', order: 2, description: 'Optimizing titles, bullet points, and descriptions for SEO.' },
    { text: 'Keyword Research', order: 3, description: 'In-depth research to find high-converting keywords.' },
    { text: 'Competitor Analysis', order: 4, description: 'Tracking and analyzing competitor strategies.' },
    { text: 'PPC Management', order: 5, description: 'Creation and optimization of advertising campaigns.' },
    { text: 'A+ Content / EBC', order: 6, description: 'Designing enhanced marketing content for product pages.' },
    { text: 'Enhanced Brand Story', order: 7, description: 'Creating a compelling brand narrative on Amazon.' },
    { text: 'Inventory Management', order: 8, description: 'Forecasting and managing stock levels to avoid stockouts.' },
    { text: 'Seasonal Strategy', order: 9, description: 'Specialized strategies for peak seasons like BFCM.' },
    { text: 'Global Expansion', order: 10, description: 'Scaling your brand to international marketplaces.' },
    { text: 'Dedicated Account Manager', order: 11, description: 'A single point of contact for all your needs.' },
    { text: 'Reporting Frequency', order: 12, description: 'Regular performance reports and strategic meetings.' }
];

const professionalPlans = [
    {
        planId: 'elite',
        name: 'Elite',
        subtitle: 'Optimal for Startups',
        prices: { monthly: '₹20,000', monthlyUSD: '₹20,000' },
        durationValue: 1,
        durationUnit: 'month',
        period: 'per month',
        description: 'Essential account management to help your brand build a solid foundation on marketplaces.',
        highlighted: false,
        cta: 'Get Started',
        order: 1,
        features: [
            { text: 'Account Health Monitoring', value: '', included: true },
            { text: 'Listing Optimization', value: '', included: true },
            { text: 'Keyword Research', value: '', included: true },
            { text: 'Competitor Analysis', value: '', included: true },
            { text: 'PPC Management', value: '', included: true },
            { text: 'A+ Content / EBC', value: '', included: false },
            { text: 'Enhanced Brand Story', value: '', included: false },
            { text: 'Inventory Management', value: '', included: false },
            { text: 'Seasonal Strategy', value: '', included: false },
            { text: 'Global Expansion', value: '', included: false },
            { text: 'Dedicated Account Manager', value: '', included: true },
            { text: 'Reporting Frequency', value: '', included: true }
        ]
    },
    {
        planId: 'premium',
        name: 'Premium',
        subtitle: 'Most Popular for Growth',
        prices: { monthly: '₹45,000', monthlyUSD: '₹45,000' },
        durationValue: 1,
        durationUnit: 'month',
        period: 'per month',
        description: 'Advanced strategies designed for brands ready to scale rapidly and dominate their category.',
        highlighted: true,
        cta: 'Scale Now',
        order: 2,
        features: [
            { text: 'Account Health Monitoring', value: '', included: true },
            { text: 'Listing Optimization', value: '', included: true },
            { text: 'Keyword Research', value: '', included: true },
            { text: 'Competitor Analysis', value: '', included: true },
            { text: 'PPC Management', value: '', included: true },
            { text: 'A+ Content / EBC', value: '', included: true },
            { text: 'Enhanced Brand Story', value: '', included: true },
            { text: 'Inventory Management', value: '', included: true },
            { text: 'Seasonal Strategy', value: '', included: true },
            { text: 'Global Expansion', value: '', included: false },
            { text: 'Dedicated Account Manager', value: '', included: true },
            { text: 'Reporting Frequency', value: '', included: true }
        ]
    },
    {
        planId: 'platinum',
        name: 'Platinum',
        subtitle: 'Enterprise Full Suite',
        prices: { monthly: '₹1,00,000', monthlyUSD: '₹1,00,000' },
        durationValue: 1,
        durationUnit: 'month',
        period: 'per month',
        description: 'Our most comprehensive plan for high-volume sellers requiring top-tier strategic consulting.',
        highlighted: false,
        cta: 'Go Platinum',
        order: 3,
        features: [
            { text: 'Account Health Monitoring', value: '', included: true },
            { text: 'Listing Optimization', value: '', included: true },
            { text: 'Keyword Research', value: '', included: true },
            { text: 'Competitor Analysis', value: '', included: true },
            { text: 'PPC Management', value: '', included: true },
            { text: 'A+ Content / EBC', value: '', included: true },
            { text: 'Enhanced Brand Story', value: '', included: true },
            { text: 'Inventory Management', value: '', included: true },
            { text: 'Seasonal Strategy', value: '', included: true },
            { text: 'Global Expansion', value: '', included: true },
            { text: 'Dedicated Account Manager', value: '', included: true },
            { text: 'Reporting Frequency', value: '', included: true }
        ]
    }
];

async function seed() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // Delete existing plans and features
        await PricingPlan.deleteMany({});
        await PricingFeature.deleteMany({});
        console.log('Cleared existing plans and features');

        // Insert professional features
        await PricingFeature.insertMany(professionalFeatures);
        console.log('Successfully seeded global feature library');

        // Insert professional plans
        await PricingPlan.insertMany(professionalPlans);
        console.log('Successfully seeded professional plans');

        process.exit(0);
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
}

seed();
