import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import OTP from "@/models/OTP";
import { authLimiter } from "@/lib/rate-limit";

function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req) {
    try {
        const { name, email } = await req.json();

        if (!name || !email) {
            return NextResponse.json(
                { message: "Name and email are required" },
                { status: 400 }
            );
        }

        // Rate limiting
        const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
        const rateLimit = authLimiter.check(`otp_${ip}_${email}`);

        if (!rateLimit.allowed) {
            return NextResponse.json(
                { message: "Too many requests. Please try again later." },
                { status: 429 }
            );
        }

        await connectDB();

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return NextResponse.json(
                { message: "User already exists with this email" },
                { status: 400 }
            );
        }

        // Generate 6-digit OTP
        const otp = generateOTP();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Store OTP in database
        // Delete any existing OTP for this email first
        await OTP.deleteMany({ email });

        await OTP.create({
            email,
            otp,
            name,
            expiresAt
        });

        // Send OTP via email
        try {
            const { sendEmail, emailTemplates } = await import("@/lib/mail");
            await sendEmail({
                to: email,
                ...emailTemplates.otpVerification({ name, otp })
            });
            console.log(`OTP email sent to ${email}`);
        } catch (mailError) {
            console.error("Failed to send OTP email:", mailError);
            return NextResponse.json(
                { message: "Failed to send verification email. Please try again." },
                { status: 500 }
            );
        }

        return NextResponse.json(
            { message: "Verification code sent successfully!" },
            { status: 200 }
        );
    } catch (error) {
        console.error("Send OTP error:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}
