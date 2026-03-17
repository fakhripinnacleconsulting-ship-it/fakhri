import mongoose from 'mongoose';

const FileSchema = new mongoose.Schema({
    name: { type: String, required: true },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Kept for backward compatibility
    clientName: { type: String }, // Kept for backward compatibility
    recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    recipientName: { type: String, required: true },
    recipientRole: { type: String, enum: ['client', 'admin', 'super-admin'], default: 'client' },
    type: { type: String },
    size: { type: String },
    version: { type: String },
    uploadedBy: { type: String },
    url: { type: String }, // URL from Vercel Blob
    date: { type: String }
}, { timestamps: true });

export default mongoose.models.File || mongoose.model('File', FileSchema);
