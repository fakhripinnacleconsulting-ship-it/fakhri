"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { User, Mail, Lock, Loader2, ArrowRight, ShieldCheck, RefreshCw } from "lucide-react";
import Logo from "@/components/ui/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Suspense } from "react";


function SignupContent() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const searchParams = useSearchParams();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    // OTP verification states
    const [step, setStep] = useState(1); // 1 = form, 2 = OTP verification
    const [otp, setOtp] = useState("");
    const [sendingOtp, setSendingOtp] = useState(false);
    const [verifyingOtp, setVerifyingOtp] = useState(false);
    const [isEmailVerified, setIsEmailVerified] = useState(false);
    const [resendTimer, setResendTimer] = useState(0);

    useEffect(() => {
        if (status === "authenticated" && session?.user) {
            const paramCallbackUrl = searchParams.get("callbackUrl");
            if (paramCallbackUrl) {
                router.push(paramCallbackUrl);
                return;
            }

            const dashboardUrl = session.user.role === "super-admin"
                ? "/super-admin/dashboard"
                : session.user.role === "admin"
                    ? "/admin/dashboard"
                    : "/client/dashboard";
            router.push(dashboardUrl);
        }
    }, [status, session, router, searchParams]);

    // Resend timer countdown
    useEffect(() => {
        if (resendTimer > 0) {
            const interval = setInterval(() => {
                setResendTimer((prev) => prev - 1);
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [resendTimer]);


    if (status === "loading") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F4F4F5]">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }

    // Step 1: Send OTP
    const handleContinue = async (e) => {
        e.preventDefault();

        if (!name || !email || !password) {
            toast.error("Please fill in all fields");
            return;
        }

        if (password.length < 6) {
            toast.error("Password must be at least 6 characters");
            return;
        }

        setSendingOtp(true);

        try {
            const response = await fetch("/api/auth/send-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to send verification code");
            }

            toast.success("Verification code sent to your email!");
            setStep(2);
            setResendTimer(60); // 60 seconds cooldown
        } catch (error) {
            toast.error(error.message);
        } finally {
            setSendingOtp(false);
        }
    };

    // Verify OTP
    const handleVerifyOtp = async () => {
        if (otp.length !== 6) {
            toast.error("Please enter the complete 6-digit code");
            return;
        }

        setVerifyingOtp(true);

        try {
            const response = await fetch("/api/auth/verify-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, otp }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Invalid verification code");
            }

            toast.success("Email verified successfully!");
            setIsEmailVerified(true);
        } catch (error) {
            toast.error(error.message);
            setOtp(""); // Clear OTP on error
        } finally {
            setVerifyingOtp(false);
        }
    };

    // Step 2: Create account (after OTP verified)
    const handleCreateAccount = async () => {
        setLoading(true);

        try {
            const response = await fetch("/api/auth/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Something went wrong");
            }

            toast.success("Account created successfully! Redirecting to login...");
            setTimeout(() => {
                router.push("/login?role=client");
            }, 1500);
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    // Resend OTP
    const handleResendOtp = async () => {
        if (resendTimer > 0) return;

        setSendingOtp(true);
        try {
            const response = await fetch("/api/auth/send-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to resend verification code");
            }

            toast.success("New verification code sent!");
            setOtp("");
            setIsEmailVerified(false);
            setResendTimer(60);
        } catch (error) {
            toast.error(error.message);
        } finally {
            setSendingOtp(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#F4F4F5] p-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
                <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-3xl opacity-50 animate-pulse" />
                <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-3xl opacity-50 animate-pulse" style={{ animationDelay: '2s' }} />
            </div>

            <div className="mb-8 flex flex-col items-center">
                <Logo className="h-12 w-auto mb-4" />
                <h1 className="text-2xl font-bold font-heading text-foreground">
                    Create Client Account
                </h1>
            </div>

            <Card className="w-full max-w-md shadow-xl border-none ring-1 ring-black/5 bg-white/80 backdrop-blur-sm">
                <CardHeader className="space-y-1 text-center">
                    <CardTitle className="text-2xl flex items-center justify-center gap-2">
                        {step === 1 ? (
                            <>
                                <User className="h-6 w-6 text-primary" />
                                Sign Up
                            </>
                        ) : (
                            <>
                                <ShieldCheck className="h-6 w-6 text-primary" />
                                Verify Email
                            </>
                        )}
                    </CardTitle>
                    <CardDescription>
                        {step === 1
                            ? "Fill in your details to get started"
                            : `Enter the 6-digit code sent to ${email}`
                        }
                    </CardDescription>

                    {/* Step indicator */}
                    <div className="flex items-center justify-center gap-2 pt-3">
                        <div className={`h-2 w-12 rounded-full transition-colors ${step >= 1 ? 'bg-primary' : 'bg-muted'}`} />
                        <div className={`h-2 w-12 rounded-full transition-colors ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
                    </div>
                </CardHeader>

                <CardContent className="space-y-4">
                    {step === 1 ? (
                        /* Step 1: User Details Form */
                        <form onSubmit={handleContinue} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name</Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="name"
                                        placeholder="John Doe"
                                        className="pl-10"
                                        required
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="name@example.com"
                                        className="pl-10"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="••••••••"
                                        className="pl-10"
                                        required
                                        minLength={6}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">Minimum 6 characters</p>
                            </div>
                            <Button type="submit" className="w-full" disabled={sendingOtp}>
                                {sendingOtp ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <ArrowRight className="mr-2 h-4 w-4" />
                                )}
                                {sendingOtp ? "Sending Code..." : "Continue"}
                            </Button>
                        </form>
                    ) : (
                        /* Step 2: OTP Verification */
                        <div className="space-y-6">
                            {/* Email display */}
                            <div className="bg-muted/50 rounded-lg p-3 flex items-center gap-2">
                                <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                                <span className="text-sm text-muted-foreground truncate">{email}</span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="ml-auto h-7 text-xs text-primary"
                                    onClick={() => {
                                        setStep(1);
                                        setOtp("");
                                        setIsEmailVerified(false);
                                    }}
                                >
                                    Change
                                </Button>
                            </div>

                            {/* OTP Input */}
                            <div className="flex flex-col items-center gap-4">
                                <Label className="text-sm font-medium">Enter Verification Code</Label>
                                <InputOTP
                                    maxLength={6}
                                    value={otp}
                                    onChange={(value) => setOtp(value)}
                                    disabled={isEmailVerified}
                                >
                                    <InputOTPGroup>
                                        <InputOTPSlot index={0} />
                                        <InputOTPSlot index={1} />
                                        <InputOTPSlot index={2} />
                                    </InputOTPGroup>
                                    <span className="text-muted-foreground">—</span>
                                    <InputOTPGroup>
                                        <InputOTPSlot index={3} />
                                        <InputOTPSlot index={4} />
                                        <InputOTPSlot index={5} />
                                    </InputOTPGroup>
                                </InputOTP>

                                {/* Verified badge */}
                                {isEmailVerified && (
                                    <div className="flex items-center gap-1.5 text-green-600 bg-green-50 px-3 py-1.5 rounded-full text-sm font-medium">
                                        <ShieldCheck className="h-4 w-4" />
                                        Email Verified
                                    </div>
                                )}
                            </div>

                            {/* Verify button */}
                            {!isEmailVerified && (
                                <Button
                                    className="w-full"
                                    onClick={handleVerifyOtp}
                                    disabled={otp.length !== 6 || verifyingOtp}
                                >
                                    {verifyingOtp ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <ShieldCheck className="mr-2 h-4 w-4" />
                                    )}
                                    {verifyingOtp ? "Verifying..." : "Verify Code"}
                                </Button>
                            )}

                            {/* Create Account button - only enabled after verification */}
                            {isEmailVerified && (
                                <Button
                                    className="w-full bg-green-600 hover:bg-green-700"
                                    onClick={handleCreateAccount}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <ArrowRight className="mr-2 h-4 w-4" />
                                    )}
                                    {loading ? "Creating Account..." : "Create Account"}
                                </Button>
                            )}

                            {/* Resend OTP */}
                            {!isEmailVerified && (
                                <div className="text-center">
                                    <p className="text-sm text-muted-foreground mb-1">
                                        Didn't receive the code?
                                    </p>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleResendOtp}
                                        disabled={resendTimer > 0 || sendingOtp}
                                        className="text-primary"
                                    >
                                        <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${sendingOtp ? 'animate-spin' : ''}`} />
                                        {resendTimer > 0
                                            ? `Resend in ${resendTimer}s`
                                            : "Resend Code"
                                        }
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>

                <CardFooter className="flex flex-col space-y-4">
                    <div className="text-center text-sm text-muted-foreground">
                        Already have an account?{" "}
                        <Link href="/login" className="text-primary hover:underline font-semibold">
                            Log in
                        </Link>
                    </div>
                </CardFooter>
            </Card>

            <Link href="/" className="mt-8 text-sm text-muted-foreground hover:text-primary transition-colors">
                ← Back to public website
            </Link>
        </div>
    );
}

export default function SignupPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-[#F4F4F5]">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        }>
            <SignupContent />
        </Suspense>
    );
}
