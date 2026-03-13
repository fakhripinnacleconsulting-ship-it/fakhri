import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import ErrorContent from "./ErrorContent";

export const dynamic = "force-dynamic";

export default function AuthErrorPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
                <p>Loading error details...</p>
            </div>
        }>
            <ErrorContent />
        </Suspense>
    );
}
