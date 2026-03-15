"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";

export default function AnalyticsTracker() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { data: session, status } = useSession();

    const sessionIdRef = useRef();
    const startTimeRef = useRef(null);
    const intervalRef = useRef(null);

    useEffect(() => {
        if (!sessionIdRef.current) {
            sessionIdRef.current = Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
        }
    }, []);

    useEffect(() => {
        if (!pathname || status === "loading") return;

        const trackActivity = async (timeSpent) => {
            setTimeout(async () => {
                try {
                    const payload = {
                        sessionId: sessionIdRef.current,
                        path: pathname,
                        timeSpentSeconds: timeSpent,
                        userAgent: window.navigator.userAgent,
                        deviceType: /Mobile|Android|iP(ad|hone)/.test(window.navigator.userAgent) ? "mobile" : "desktop",
                        browser: window.navigator.userAgent,
                        os: window.navigator.platform,
                    };

                    if (session?.user) {
                        payload.userId = session.user.id || null;
                        payload.userEmail = session.user.email;
                        payload.userName = session.user.name;
                    }

                    await fetch("/api/analytics/track", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(payload),
                    });
                } catch (error) {
                    // Silent fail - don't disrupt user experience
                }
            }, 50);
        };

        trackActivity(0);
        startTimeRef.current = Date.now();

        intervalRef.current = setInterval(() => {
            if (startTimeRef.current === null) return;
            const timeSpent = Math.floor((Date.now() - startTimeRef.current) / 1000);
            startTimeRef.current = Date.now();
            trackActivity(timeSpent);
        }, 30000);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            if (startTimeRef.current !== null) {
                const timeSpent = Math.floor((Date.now() - startTimeRef.current) / 1000);
                if (timeSpent > 0 && timeSpent < 3600) {
                    trackActivity(timeSpent);
                }
            }
        };
    }, [pathname, searchParams, session, status]);

    return null;
}
