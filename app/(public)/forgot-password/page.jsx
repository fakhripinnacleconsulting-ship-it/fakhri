"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { requestPasswordReset } from "@/lib/actions/auth";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [adminError, setAdminError] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setAdminError(false);

        try {
            const result = await requestPasswordReset(email);
            if (result.success) {
                setSubmitted(true);
                toast.success("Reset link sent!");
            } else {
                if (result.isAdmin) {
                    setAdminError(true);
                } else {
                    toast.error(result.error || "Failed to send reset link");
                }
            }
        } catch (error) {
            toast.error("An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md w-full bg-white p-10 rounded-2xl shadow-xl text-center">
                    <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
                        <CheckCircle2 className="h-10 w-10 text-green-600" />
                    </div>
                    <h2 className="text-3xl font-bold font-heading text-gray-900 mb-2">Check your email</h2>
                    <p className="text-gray-600 mb-10">
                        We&apos;ve sent a password reset link to <span className="font-semibold text-gray-900">{email}</span>.
                        Please check your inbox and click the link to reset your password.
                    </p>
                    <Link href="/login">
                        <Button className="w-full h-12 text-lg font-bold">
                            Return to Login
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-10 px-6 shadow-xl rounded-2xl sm:px-10 border border-gray-100">
                    <div className="mb-8">
                        <Link href="/login" className="inline-flex items-center text-sm font-medium text-primary hover:underline group">
                            <ArrowLeft className="h-4 w-4 mr-2 transition-transform group-hover:-translate-x-1" />
                            Back to Login
                        </Link>
                        <h2 className="mt-6 text-3xl font-bold font-heading text-gray-900 tracking-tight">Forgot Password?</h2>
                        <p className="mt-2 text-sm text-gray-600">
                            No worries! Enter your email address and we&apos;ll send you a link to reset your password.
                        </p>
                    </div>

                    {adminError ? (
                        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-8 rounded-r-lg animate-in fade-in slide-in-from-top-4 duration-300">
                            <div className="flex items-start">
                                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
                                <div className="ml-3">
                                    <h3 className="text-sm font-bold text-red-800">Admin Account Detected</h3>
                                    <p className="mt-1 text-sm text-red-700">
                                        You can contact to super-admin for update password. Password reset via email is only available for client accounts.
                                    </p>
                                    <div className="mt-4">
                                        <Link href="/contact">
                                            <Button variant="outline" size="sm" className="border-red-200 text-red-800 hover:bg-red-100">
                                                Contact Super Admin
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-1">
                                <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
                                    Email Address
                                </Label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Mail className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        autoComplete="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="pl-10 h-12 rounded-lg border-gray-200 focus:ring-primary focus:border-primary"
                                        placeholder="name@company.com"
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className={`w-full h-12 text-lg font-bold shadow-lg shadow-primary/20 transition-all ${loading ? 'opacity-80 cursor-default' : 'hover:scale-[1.02]'
                                    }`}
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        Sending Link...
                                    </>
                                ) : (
                                    "Send Reset Link"
                                )}
                            </Button>
                        </form>
                    )}

                    <div className="mt-10 pt-6 border-t border-gray-100 text-center">
                        <p className="text-sm text-gray-500">
                            Remembered your password?{" "}
                            <Link href="/login" className="font-semibold text-primary hover:underline">
                                Log in
                            </Link>
                        </p>
                    </div>
                </div>

                <div className="mt-8 text-center">
                    <p className="text-xs text-gray-400">
                        &copy; {new Date().getFullYear()} Fakhri IT Services. All rights reserved.
                    </p>
                </div>
            </div>
        </div>
    );
}
