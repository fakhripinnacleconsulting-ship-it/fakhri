import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";

export async function middleware(req) {
    const path = req.nextUrl.pathname;

    // Early return for static assets, public paths, and API routes to save execution time
    if (
        path.startsWith("/_next") ||
        path.startsWith("/api") ||
        path.match(/\.(png|jpg|jpeg|svg|ico)$/)
    ) {
        return NextResponse.next();
    }

    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    // Path to role mapping
    const protectedRoutes = [
        { prefix: '/super-admin', role: 'super-admin' },
        { prefix: '/admin', role: 'admin' },
        { prefix: '/client', role: 'client' },
    ];

    for (const route of protectedRoutes) {
        if (path.startsWith(route.prefix)) {
            if (!token || token.role !== route.role) {
                return NextResponse.redirect(new URL(`/login?role=${route.role}`, req.url));
            }
            break; // Stop checking once matched
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/super-admin/:path*",
        "/admin/:path*",
        "/client/:path*",
    ],
};
