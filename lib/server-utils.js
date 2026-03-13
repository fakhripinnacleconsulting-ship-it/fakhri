import { headers } from "next/headers";

export async function getBaseUrl() {
    try {
        const headersList = await headers();
        const host = headersList.get("host");
        if (!host) throw new Error("No host header");
        const protocol = host.includes("localhost") || host.includes("127.0.0.1") ? "http" : "https";
        return `${protocol}://${host}`;
    } catch (e) {
        // Fallback for non-request contexts or static generation
        const envUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        return envUrl.replace(/\/$/, ""); // Remove trailing slash if any
    }
}
