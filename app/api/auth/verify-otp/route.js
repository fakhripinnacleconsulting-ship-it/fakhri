import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import OTP from "@/models/OTP";
import { authLimiter } from "@/lib/rate-limit";

export async function POST(req) {
    try {
        const { email, otp } = await req.json();

        // Rate limiting verification attempts
        const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
        const rateLimit = authLimiter.check(`verify_otp_${ip}_${email}`);

        if (!rateLimit.allowed) {
            return NextResponse.json(
                { message: "Too many attempts. Please try again later." },
                { status: 429 }
            );
        }

        if (!email || !otp) {
            return NextResponse.json(
                { message: "Email and OTP are required" },
                { status: 400 }
            );
        }

        await connectDB();

        const storedData = await OTP.findOne({ email });

        if (!storedData) {
            return NextResponse.json(
                { message: "No verification code found. Please request a new one." },
                { status: 400 }
            );
        }

        // Check if correct OTP
        if (storedData.otp !== otp.toString()) {
            return NextResponse.json(
                { message: "Invalid verification code. Please try again." },
                { status: 400 }
            );
        }

        // OTP is valid - mark it as verified
        storedData.verified = true;
        await storedData.save();

        return NextResponse.json(
            { message: "Email verified successfully!", verified: true },
            { status: 200 }
        );
    } catch (error) {
        console.error("Verify OTP error:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}
