import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import OTP from "@/models/OTP";
import { getBaseUrl } from "@/lib/server-utils";

export async function POST(req) {
    try {
        const { name, email, password } = await req.json();

        if (!name || !email || !password) {
            return NextResponse.json(
                { message: "Missing required fields" },
                { status: 400 }
            );
        }

        await connectDB();

        // Verify that OTP was validated for this email
        const otpData = await OTP.findOne({ email });
        if (!otpData || !otpData.verified) {
            return NextResponse.json(
                { message: "Email not verified. Please verify your email first." },
                { status: 400 }
            );
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return NextResponse.json(
                { message: "User already exists with this email" },
                { status: 400 }
            );
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user as client
        const newUser = await User.create({
            name,
            email,
            password: hashedPassword,
            role: "client",
            status: "active",
        });

        // Send Welcome Email
        try {
            const { sendEmail, emailTemplates } = await import("@/lib/mail");
            const dashboardUrl = `${await getBaseUrl()}/login`;

            await sendEmail({
                to: email,
                ...emailTemplates.welcomeAccount({
                    name,
                    email,
                    password,
                    role: 'Client',
                    company: 'Personal',
                    dashboardUrl,
                    showSecurityTip: false
                })
            });
            console.log(`Welcome Account email sent to ${email}`);
        } catch (mailError) {
            console.error("Failed to send welcome email:", mailError);
            // Don't block registration if email fails
        }

        // Create Welcome Notification in Dashboard
        try {
            const { createNotification } = await import("@/lib/actions/notification");
            await createNotification({
                recipientId: newUser._id,
                title: "Welcome to Fakhri IT Services!",
                message: "We're excited to have you on board. Please check out our pricing plans to get started with our premium services.",
                type: "info",
                link: "#Plan", // Direct link to Plan tab
                icon: "Star",
                skipEmail: true
            });
        } catch (notifError) {
            console.error("Failed to create welcome notification:", notifError);
        }

        // Clean up OTP after successful signup
        await OTP.deleteOne({ email });

        return NextResponse.json(
            { message: "User created successfully", user: { id: newUser._id, email: newUser.email } },
            { status: 201 }
        );
    } catch (error) {
        console.error("Signup error:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}
