"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Lock, Eye, EyeOff, CheckCircle2, Loader2, ShieldCheck, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { resetPassword, validateResetToken } from "@/lib/actions/auth";

function ResetPasswordContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token");

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [validating, setValidating] = useState(true);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const verifyToken = async () => {
            if (!token) {
                setError("Invalid request. Missing reset token.");
                setValidating(false);
                return;
            }

            try {
                const result = await validateResetToken(token);
                if (!result.success) {
                    setError(result.error || "Invalid or expired reset token.");
                }
            } catch (err) {
                setError("Failed to validate reset link.");
            } finally {
                setValidating(false);
            }
        };

        verifyToken();
    }, [token]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        if (password.length < 6) {
            toast.error("Password must be at least 6 digits");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const result = await resetPassword(token, password);
            if (result.success) {
                setSuccess(true);
                toast.success("Password reset successful!");
                setTimeout(() => {
                    router.push("/login");
                }, 3000);
            } else {
                setError(result.error || "Failed to reset password");
                toast.error(result.error || "Failed to reset password");
            }
        } catch (error) {
            toast.error("An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };

    if (validating) {
        return (
            <div className="max-w-md w-full bg-white p-10 rounded-2xl shadow-xl text-center">
                <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary mb-4" />
                <p className="text-gray-600">Verifying secure link...</p>
            </div>
        );
    }

    if (success) {
        return (
            <div className="max-w-md w-full bg-white p-10 rounded-2xl shadow-xl text-center animate-in zoom-in-95 duration-300">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
                    <CheckCircle2 className="h-10 w-10 text-green-600" />
                </div>
                <h2 className="text-3xl font-bold font-heading text-gray-900 mb-2">Password Reset!</h2>
                <p className="text-gray-600 mb-8">
                    Your password has been successfully updated. You will be redirected to the login page in a few seconds.
                </p>
                <Link href="/login">
                    <Button className="w-full h-12 text-lg font-bold">
                        Go to Login
                    </Button>
                </Link>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-md w-full bg-white p-10 rounded-2xl shadow-xl text-center animate-in fade-in duration-300">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
                    <AlertCircle className="h-10 w-10 text-red-600" />
                </div>
                <h2 className="text-2xl font-bold font-heading text-gray-900 mb-2">
                    {!token ? "Missing Token" : "Link Expired"}
                </h2>
                <p className="text-gray-600 mb-8">
                    {error}
                </p>
                <Link href="/forgot-password">
                    <Button variant="outline" className="w-full h-12">
                        Request New Link
                    </Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-md w-full bg-white py-10 px-8 shadow-xl rounded-2xl border border-gray-100">
            <div className="text-center mb-8">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 mb-4">
                    <ShieldCheck className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-3xl font-bold font-heading text-gray-900 tracking-tight">Set New Password</h2>
                <p className="mt-2 text-sm text-gray-600">
                    Your new password must be different from previous passwords.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                    <div className="space-y-1">
                        <Label htmlFor="password">New Password</Label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-gray-400" />
                            </div>
                            <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="pl-10 h-11 border-gray-200"
                                placeholder="Min. 6 digits"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                            >
                                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor="confirmPassword">Confirm Password</Label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-gray-400" />
                            </div>
                            <Input
                                id="confirmPassword"
                                type={showPassword ? "text" : "password"}
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="pl-10 h-11 border-gray-200"
                                placeholder="Confirm new password"
                            />
                        </div>
                    </div>
                </div>

                <Button
                    type="submit"
                    className="w-full h-12 text-lg font-bold shadow-lg shadow-primary/20"
                    disabled={loading || !!error}
                >
                    {loading ? (
                        <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Updating Password...
                        </>
                    ) : (
                        "Reset Password"
                    )}
                </Button>
            </form>

            <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                <Link href="/login" className="text-sm font-medium text-gray-500 hover:text-primary transition-colors">
                    Back to Login
                </Link>
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md flex justify-center">
                <Suspense fallback={<Loader2 className="h-10 w-10 animate-spin text-primary" />}>
                    <ResetPasswordContent />
                </Suspense>
            </div>
        </div>
    );
}
