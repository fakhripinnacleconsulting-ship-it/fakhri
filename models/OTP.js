import mongoose from "mongoose";

const OTPSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        index: true,
    },
    otp: {
        type: String,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    verified: {
        type: Boolean,
        default: false,
    },
    expiresAt: {
        type: Date,
        required: true,
        index: { expires: '10m' }, // Automatically delete after 10 minutes
    },
}, { timestamps: true });

// Check if model already exists before defining it
export default mongoose.models.OTP || mongoose.model("OTP", OTPSchema);
