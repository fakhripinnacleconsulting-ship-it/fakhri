"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, BellRing, Mail, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { updateUser } from "@/lib/actions/user";
import { usePushNotifications } from "@/hooks/usePushNotifications";

export default function NotificationSetupDialog({ user, open, onComplete, onSettingsChange }) {
    const [loading, setLoading] = useState(false);

    // We want the default state to be disabled for everything to match user request
    const DEFAULT_SETTINGS = {
        soundEnabled: false,
        emailNotifications: false,
        pushNotifications: false,
        taskUpdates: false,
        paymentAlerts: false,
        marketingNews: false,
        weeklyDigest: false
    };

    const [settings, setSettings] = useState(DEFAULT_SETTINGS);
    const { subscribeUser, isSupported, permission } = usePushNotifications(user?._id);

    useEffect(() => {
        if (user && user.notificationSettingsConfigured && user.notificationSettings) {
            setSettings({
                ...DEFAULT_SETTINGS,
                ...user.notificationSettings
            });
        }
    }, [user]);

    const handleToggle = (key) => {
        setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleEnableAll = () => {
        setSettings({
            soundEnabled: true,
            emailNotifications: true,
            pushNotifications: true,
            taskUpdates: true,
            paymentAlerts: true,
            marketingNews: true,
            weeklyDigest: true
        });
        toast.info("All notifications enabled");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            let finalSettings = { ...settings };

            if (finalSettings.pushNotifications && isSupported && permission !== 'granted') {
                try {
                    const result = await Notification.requestPermission();
                    if (result !== 'granted') {
                        toast.warning("Browser notifications blocked. Please enable them in browser settings.");
                        finalSettings.pushNotifications = false;
                    }
                    // Note: We don't auto-subscribe here. The parent's onSettingsChange will call subscribeUser.
                } catch (error) {
                    console.error("Error asking permission", error);
                }
            }

            // Mark the flag that they have configured it directly in DB
            const updatedUserResponse = await updateUser(user._id, {
                notificationSettings: finalSettings,
                notificationSettingsConfigured: true
            });

            // Call the local settings sync (doesn't overwrite the configured flag because we aren't passing it)
            if (onSettingsChange) {
                // We do NOT await this because if subscribeUser hangs, it freezes the modal on "Saving..."
                // The parent will handle the push subscription in the background.
                onSettingsChange(finalSettings).catch(e => console.error("onSettingsChange error", e));
            }

            toast.success("Notification preferences saved.");
            onComplete(updatedUserResponse || { ...user, notificationSettings: finalSettings, notificationSettingsConfigured: true });
        } catch (error) {
            console.error("Error saving notification settings:", error);
            toast.error("An error occurred while saving your settings.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={() => { }}>
            <DialogContent className="sm:max-w-[450px] [&>button]:hidden interactive-none" onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
                <DialogHeader>
                    <DialogTitle className="text-xl">Set up your notifications</DialogTitle>
                    <DialogDescription>
                        Stay informed about your projects and account. Enable what&apos;s important to you.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 pt-2">
                    <div className="flex justify-end p-2 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-4">
                            <Label className="text-sm font-medium text-muted-foreground mr-2">Quick Setup:</Label>
                            <Button type="button" variant="outline" size="sm" onClick={handleEnableAll}>
                                Accept All
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {/* Email */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-full text-primary">
                                    <Mail className="h-4 w-4" />
                                </div>
                                <div className="flex flex-col">
                                    <Label className="text-sm font-medium">Email Notifications</Label>
                                    <p className="text-xs text-muted-foreground leading-tight mt-1">Receive important updates directly via email</p>
                                </div>
                            </div>
                            <Switch checked={settings.emailNotifications} onCheckedChange={() => handleToggle('emailNotifications')} />
                        </div>

                        {/* Push Notifications */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-full text-primary">
                                    <Smartphone className="h-4 w-4" />
                                </div>
                                <div className="flex flex-col">
                                    <Label className="text-sm font-medium">Browser Push Notifications</Label>
                                    <p className="text-xs text-muted-foreground leading-tight mt-1">Get real-time alerts right in your browser</p>
                                </div>
                            </div>
                            <Switch checked={settings.pushNotifications} onCheckedChange={() => handleToggle('pushNotifications')} />
                        </div>

                        {/* Sound Alerts */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-full text-primary">
                                    <BellRing className="h-4 w-4" />
                                </div>
                                <div className="flex flex-col">
                                    <Label className="text-sm font-medium">Sound Alerts</Label>
                                    <p className="text-xs text-muted-foreground leading-tight mt-1">Play a sound when a new notification arrives</p>
                                </div>
                            </div>
                            <Switch checked={settings.soundEnabled} onCheckedChange={() => handleToggle('soundEnabled')} />
                        </div>
                    </div>

                    <DialogFooter className="mt-6">
                        <Button type="submit" disabled={loading} className="w-full">
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {loading ? "Saving..." : "Save Preferences"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
