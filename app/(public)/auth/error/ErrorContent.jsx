"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function ErrorContent() {
    const searchParams = useSearchParams();
    const error = searchParams.get("error");

    const errorMessages = {
        Configuration: "There is a problem with the server configuration. Please contact support.",
        AccessDenied: "You do not have permission to access this resource. Google login is only allowed for Clients.",
        Verification: "The verification link has expired or has already been used.",
        Default: "An unexpected authentication error occurred. Please try again.",
    };

    const message = errorMessages[error] || errorMessages.Default;

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md shadow-xl border-destructive/20 ring-1 ring-destructive/10">
                <CardHeader className="space-y-1 text-center">
                    <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                        <AlertCircle className="h-6 w-6 text-destructive" />
                    </div>
                    <CardTitle className="text-2xl font-bold">Authentication Error</CardTitle>
                    <CardDescription>
                        {error ? `Error Code: ${error}` : "Something went wrong"}
                    </CardDescription>
                </CardHeader>
                <CardContent className="text-center py-6">
                    <p className="text-muted-foreground leading-relaxed">
                        {message}
                    </p>
                </CardContent>
                <CardFooter className="flex flex-col gap-3">
                    <Button asChild className="w-full">
                        <Link href="/login">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Login
                        </Link>
                    </Button>
                    <Button variant="ghost" asChild className="w-full">
                        <Link href="/">
                            Go to Homepage
                        </Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
