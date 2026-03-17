'use client';

import { useState, useEffect } from 'react';
import { saveSubscription, removeSubscription } from '@/lib/actions/push-subscription';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

export function usePushNotifications(userId) {
    const [subscription, setSubscription] = useState(null);
    const [isSupported, setIsSupported] = useState(false);
    const [permission, setPermission] = useState('default');

    useEffect(() => {
        const initPush = async () => {
            if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
                setIsSupported(true);
                setPermission(Notification.permission);

                try {
                    const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
                    setPermission(Notification.permission);
                    const sub = await registration.pushManager.getSubscription();
                    setSubscription(sub);
                } catch (error) {
                    console.error('Service Worker registration failed:', error);
                }
            }
        };

        initPush();
    }, []);

    const subscribeUser = async () => {
        if (!isSupported) return { success: false, error: 'Push notifications not supported by browser' };

        try {
            const registration = await navigator.serviceWorker.ready;

            // Check if permission is already granted or ask for it
            const currentPermission = await Notification.requestPermission();
            setPermission(currentPermission);

            if (currentPermission !== 'granted') {
                console.warn('Notification permission not granted');
                return { success: false, error: 'Notification permission not granted' };
            }

            const sub = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
            });

            const subData = JSON.parse(JSON.stringify(sub));
            console.log('Sending subscription to server:', { userId, subData });

            const result = await saveSubscription(userId, subData);
            if (result.success) {
                setSubscription(sub);
                return { success: true };
            } else {
                console.error('Failed to save subscription on server:', result.error || 'Unknown error');
                return { success: false, error: 'Failed to save subscription' };
            }
        } catch (error) {
            console.error('Error subscribing to push notifications:', error);
            return { success: false, error: error.message };
        }
    };

    const unsubscribeUser = async () => {
        if (!subscription) return;

        try {
            await subscription.unsubscribe();
            await removeSubscription(userId, subscription.endpoint);
            setSubscription(null);
        } catch (error) {
            console.error('Error unsubscribing from push notifications:', error);
        }
    };

    return {
        subscription,
        isSupported,
        permission,
        subscribeUser,
        unsubscribeUser
    };
}

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}
