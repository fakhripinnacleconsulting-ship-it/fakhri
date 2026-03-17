import mongoose from 'mongoose';

const hsnSchema = new mongoose.Schema({
    serviceName: {
        type: String,
        required: [true, 'Service name is required'],
        trim: true
    },
    hsnCode: {
        type: String,
        required: [true, 'HSN/SAC code is required'],
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    order: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

const HSN = mongoose.models.HSN || mongoose.model('HSN', hsnSchema);
export default HSN;
