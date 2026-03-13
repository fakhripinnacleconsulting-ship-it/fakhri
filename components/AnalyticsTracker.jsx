"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
const sendGAEvent = (...args) => {
    if (typeof window !== "undefined") {
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push(args[0]);
    }
};

export default function AnalyticsTracker() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { data: session, status } = useSession();

    const sessionIdRef = useRef();
    const startTimeRef = useRef(null);
    const intervalRef = useRef(null);

    // Generate a rudimentary session ID if none exists
    useEffect(() => {
        if (!sessionIdRef.current) {
            sessionIdRef.current = Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
        }
    }, []);

    // Track page view in GA and our API
    useEffect(() => {
        if (!pathname || status === "loading") return;

        // GA Event
        sendGAEvent({ event: "page_view", value: { page_path: pathname } });

        // Function to ping custom API
        const trackActivity = async (timeSpent) => {
            // Perform fetch in next tick to avoid blocking main content rendering
            setTimeout(async () => {
                try {
                    const payload = {
                        sessionId: sessionIdRef.current,
                        path: pathname,
                        timeSpentSeconds: timeSpent, // Add time if applicable
                        userAgent: window.navigator.userAgent,
                        deviceType: /Mobile|Android|iP(ad|hone)/.test(window.navigator.userAgent) ? "mobile" : "desktop",
                        browser: window.navigator.userAgent,
                        os: window.navigator.platform,
                    };

                    if (session?.user) {
                        payload.userId = session.user.id || null;
                        payload.userEmail = session.user.email;
                        // identify user in GA
                        sendGAEvent({ event: "login", value: { method: session.user.email } });
                    }

                    await fetch("/api/analytics/track", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(payload),
                    });
                } catch (error) {
                    console.error("Failed to track analytics:", error);
                }
            }, 50); // slight delay to prioritize page interactivity
        };

        // Initial page load ping (0 time spent)
        trackActivity(0);

        // Reset start time for new page
        startTimeRef.current = Date.now();

        // Ping every 30 seconds to update time spent
        intervalRef.current = setInterval(() => {
            if (startTimeRef.current === null) return;
            const timeSpent = Math.floor((Date.now() - startTimeRef.current) / 1000);
            startTimeRef.current = Date.now(); // Reset after tracking so we only send deltas
            trackActivity(timeSpent);
        }, 30000); // 30s heartbeat

        return () => {
            // Clear interval on path change or unmount
            if (intervalRef.current) clearInterval(intervalRef.current);

            // Send remaining time on unmount
            if (startTimeRef.current !== null) {
                const timeSpent = Math.floor((Date.now() - startTimeRef.current) / 1000);
                if (timeSpent > 0 && timeSpent < 3600) { // arbitrary cap to avoid massive spikes from sleep
                    trackActivity(timeSpent);
                }
            }
        };
    }, [pathname, searchParams, session, status]);

    return null;
}
