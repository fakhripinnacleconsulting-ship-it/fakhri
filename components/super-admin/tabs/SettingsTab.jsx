"use client";
import { useState, useEffect } from "react";
import { Save, Clock, Bell, Loader2, RefreshCw, AlertCircle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSettings, updateSettings } from "@/lib/actions/settings";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const SuperAdminSettingsTab = () => {
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        async function loadSettings() {
            setLoading(true);
            try {
                const data = await getSettings();
                if (data) {
                    setSettings(data);
                }
            } catch (error) {
                console.error("Failed to load settings:", error);
                toast.error("Failed to load settings");
            } finally {
                setLoading(false);
            }
        }
        loadSettings();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        const toastId = toast.loading("Saving settings...");
        try {
            const result = await updateSettings(settings);
            if (result.success) {
                toast.success("Settings saved successfully", { id: toastId });
                setSettings(result.settings);
            } else {
                toast.error(result.error || "Failed to save settings", { id: toastId });
            }
        } catch (error) {
            console.error("Error saving settings:", error);
            toast.error("An error occurred while saving", { id: toastId });
        } finally {
            setSaving(false);
        }
    };

    const updateNestedField = (section, field, value) => {
        setSettings(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [field]: value
            }
        }));
    };

    if (loading) {
        return (
            <div className="h-96 flex flex-col items-center justify-center space-y-4">
                <Loader2 className="h-10 w-10 text-primary animate-spin" />
                <p className="text-muted-foreground animate-pulse font-medium">Fetching global configuration...</p>
            </div>
        );
    }

    if (!settings) return (
        <div className="p-12 text-center bg-card rounded-xl border border-dashed">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold">Configuration Error</h3>
            <p className="text-muted-foreground">We couldn't initialize the system settings. Please check your database connection.</p>
            <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>Retry</Button>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in transition-all duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight">System Configuration</h1>
                    <p className="text-muted-foreground max-w-2xl text-sm md:text-base">
                        Global control center for platform logic, SLA compliance, security policies, and automated system behaviors.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" size="lg" onClick={() => window.location.reload()} disabled={saving}>
                        <RefreshCw className={cn("h-4 w-4 mr-2", saving && "animate-spin")} />
                        Discard
                    </Button>
                    <Button size="lg" onClick={handleSave} disabled={saving} className="shadow-lg shadow-primary/20">
                        {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                        Apply Changes
                    </Button>
                </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
                {/* SLA Settings */}
                <Card className="border-none shadow-sm bg-gradient-to-br from-white to-blue-50/30">
                    <CardHeader>
                        <div className="flex items-center gap-3 mb-1">
                            <div className="p-2 rounded-xl bg-blue-500 text-white shadow-md shadow-blue-500/20">
                                <Clock className="h-5 w-5" />
                            </div>
                            <CardTitle className="text-xl">Service Level Agreements</CardTitle>
                        </div>
                        <CardDescription>Define response and resolution timelines for different system events.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-blue-600/70 ml-1">Task Response Time</Label>
                            <div className="relative">
                                <Input
                                    type="number"
                                    className="bg-white/70 border-blue-100 pr-10"
                                    value={settings.sla?.taskResponseTime}
                                    onChange={(e) => updateNestedField('sla', 'taskResponseTime', parseInt(e.target.value) || 0)}
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold opacity-30">HRS</span>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-blue-600/70 ml-1">Unassigned Alert</Label>
                            <div className="relative">
                                <Input
                                    type="number"
                                    className="bg-white/70 border-blue-100 pr-10"
                                    value={settings.sla?.unassignedClientAlert}
                                    onChange={(e) => updateNestedField('sla', 'unassignedClientAlert', parseInt(e.target.value) || 0)}
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold opacity-30">HRS</span>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-blue-600/70 ml-1">Emergency Response</Label>
                            <div className="relative">
                                <Input
                                    type="number"
                                    className="bg-white/70 border-blue-100 pr-10"
                                    value={settings.sla?.emergencyResponseTime}
                                    onChange={(e) => updateNestedField('sla', 'emergencyResponseTime', parseInt(e.target.value) || 0)}
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold opacity-30">HRS</span>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-blue-600/70 ml-1">Escalation Threshold</Label>
                            <div className="relative">
                                <Input
                                    type="number"
                                    className="bg-white/70 border-blue-100 pr-10"
                                    value={settings.sla?.taskEscalationThreshold}
                                    onChange={(e) => updateNestedField('sla', 'taskEscalationThreshold', parseInt(e.target.value) || 0)}
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold opacity-30">DAYS</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Default Preferences */}
                <Card className="border-none shadow-sm bg-gradient-to-br from-white to-purple-50/30">
                    <CardHeader>
                        <div className="flex items-center gap-3 mb-1">
                            <div className="p-2 rounded-xl bg-purple-500 text-white shadow-md shadow-purple-500/20">
                                <Bell className="h-5 w-5" />
                            </div>
                            <CardTitle className="text-xl">Platform Defaults</CardTitle>
                        </div>
                        <CardDescription>Core presets used when creating new tasks or initializing managers.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-purple-600/70 ml-1">Default Task Priority</Label>
                            <Select
                                value={settings.defaults?.taskPriority}
                                onValueChange={(v) => updateNestedField('defaults', 'taskPriority', v)}
                            >
                                <SelectTrigger className="bg-white/70 border-purple-100">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="High">🔴 High</SelectItem>
                                    <SelectItem value="Medium">🟠 Medium</SelectItem>
                                    <SelectItem value="Low">🟢 Low</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-purple-600/70 ml-1">Default Task ETA</Label>
                            <div className="relative">
                                <Input
                                    type="number"
                                    className="bg-white/70 border-purple-100 pr-10"
                                    value={settings.defaults?.taskETADays}
                                    onChange={(e) => updateNestedField('defaults', 'taskETADays', parseInt(e.target.value) || 0)}
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold opacity-30">DAYS</span>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-purple-600/70 ml-1">Max Clients / Manager</Label>
                            <div className="relative">
                                <Input
                                    type="number"
                                    className="bg-white/70 border-purple-100 pr-10"
                                    value={settings.defaults?.maxClientsPerManager}
                                    onChange={(e) => updateNestedField('defaults', 'maxClientsPerManager', parseInt(e.target.value) || 0)}
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold opacity-30">COUNT</span>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-purple-600/70 ml-1">Session Timeout</Label>
                            <div className="relative">
                                <Input
                                    type="number"
                                    className="bg-white/70 border-purple-100 pr-10"
                                    value={settings.defaults?.sessionTimeout}
                                    onChange={(e) => updateNestedField('defaults', 'sessionTimeout', parseInt(e.target.value) || 0)}
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold opacity-30">MIN</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>


            {/* Bottom Actions Banner */}
            <div className="flex items-center justify-between p-6 bg-accent/30 rounded-2xl border border-dashed border-accent">
                <div className="flex items-center gap-4 text-muted-foreground">
                    <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
                        <Info className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-foreground">Pending Changes</p>
                        <p className="text-xs">Changes will be applied globally and cached for performance.</p>
                    </div>
                </div>
                {/* <div className="flex gap-4">
                    <Button size="lg" onClick={handleSave} disabled={saving} className="bg-primary hover:bg-primary/90 px-8">
                        {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                        Apply Global Config
                    </Button>
                </div> */}
            </div>
        </div>
    );
};

export default SuperAdminSettingsTab;
