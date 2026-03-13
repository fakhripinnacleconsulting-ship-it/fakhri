"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { getNotifications } from "@/lib/actions/notification";
import { toast } from "sonner";

/**
 * Modern real-time notification hook using SSE (Server-Sent Events).
 * Falls back to single fetch if SSE fails or is unsupported.
 */
export default function useNotifications(recipientId) {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [status, setStatus] = useState('connecting'); // connecting, connected, error
    const eventSourceRef = useRef(null);

    const fetchInitial = useCallback(async () => {
        if (!recipientId) return;
        try {
            const data = await getNotifications({ recipientId, limit: 30 });
            setNotifications(data || []);
            setUnreadCount((data || []).filter(n => !n.read).length);
        } catch (error) {
            console.error("Failed to fetch initial notifications:", error);
        }
    }, [recipientId]);

    useEffect(() => {
        if (!recipientId) return;

        let isMounted = true;

        const init = async () => {
            if (isMounted) {
                await fetchInitial();
            }
        };

        init();

        // Initialize SSE
        const connectSSE = () => {
            if (eventSourceRef.current) eventSourceRef.current.close();

            const es = new EventSource('/api/notifications/stream');
            eventSourceRef.current = es;

            es.onopen = () => {
                setStatus('connected');
                console.log("[SSE] Notification stream connected");
            };

            es.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === 'notification') {
                        const newNotif = data.payload;

                        setNotifications(prev => {
                            // Avoid duplicates
                            if (prev.find(n => n._id === newNotif._id)) return prev;
                            const updated = [newNotif, ...prev].slice(0, 50);
                            setUnreadCount(updated.filter(n => !n.read).length);
                            return updated;
                        });

                        // Show desktop/app toast
                        toast.info(newNotif.title, {
                            description: newNotif.message,
                            action: newNotif.link ? {
                                label: 'View',
                                onClick: () => window.location.hash = newNotif.link
                            } : null
                        });
                    }
                } catch (e) {
                    console.error("[SSE] Error parsing event:", e);
                }
            };

            es.onerror = (err) => {
                console.warn("[SSE] Stream error, retrying in 5s...", err);
                setStatus('error');
                es.close();
                // Simple retry logic
                setTimeout(connectSSE, 5000);
            };
        };

        connectSSE();

        return () => {
            isMounted = false;
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
            }
        };
    }, [recipientId, fetchInitial]);

    return {
        notifications,
        setNotifications,
        unreadCount,
        status,
        refresh: fetchInitial
    };
}
