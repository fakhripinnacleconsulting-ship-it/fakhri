"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BarChart3, ExternalLink, Settings2, Info, CheckCircle2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

export default function AnalyticsTab() {
    const [embedUrl, setEmbedUrl] = useState("");
    const [savedUrl, setSavedUrl] = useState("");
    const [isEditing, setIsEditing] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    // Load saved config on mount
    useEffect(() => {
        setIsMounted(true);
        const stored = localStorage.getItem("ga4_looker_studio_url");
        if (stored) {
            setSavedUrl(stored);
            setEmbedUrl(stored);
        }
    }, []);

    const handleSaveConfig = () => {
        if (!embedUrl) {
            toast.error("Please enter a valid Looker Studio embed URL.");
            return;
        }

        // Validate if it's an iframe snippet, extract the URL
        let finalUrl = embedUrl;
        if (embedUrl.includes("<iframe") && embedUrl.includes("src=")) {
            const match = embedUrl.match(/src="([^"]+)"/);
            if (match && match[1]) {
                finalUrl = match[1];
            } else {
                toast.error("Could not extract URL from iframe snippet. Please try pasting just the direct link.");
                return;
            }
        }

        if (!finalUrl.includes("lookerstudio.google.com")) {
            toast.error("URL must be a valid Google Looker Studio link.");
            return;
        }

        localStorage.setItem("ga4_looker_studio_url", finalUrl);
        setSavedUrl(finalUrl);
        setIsEditing(false);
        toast.success("Analytics dashboard connected successfully!");
    };

    const handleClearConfig = () => {
        localStorage.removeItem("ga4_looker_studio_url");
        setSavedUrl("");
        setEmbedUrl("");
        setIsEditing(true);
        toast.info("Dashboard configuration cleared.");
    };

    if (!isMounted) return null;

    if (savedUrl && !isEditing) {
        return (
            <div className="space-y-6 max-w-7xl mx-auto pb-10 h-[calc(100vh-120px)] flex flex-col">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold font-heading text-slate-800 flex items-center gap-2">
                            <BarChart3 className="h-6 w-6 text-primary" />
                            Google Analytics 4
                        </h2>
                        <p className="text-muted-foreground text-sm">Real-time traffic and user behavior dashboard.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => window.open("https://analytics.google.com/", "_blank")}
                            className="rounded-xl border-dashed h-9"
                        >
                            Open GA4
                            <ExternalLink className="h-4 w-4 ml-2 max-sm:hidden" />
                        </Button>
                        <Button 
                            variant="secondary" 
                            size="sm" 
                            onClick={() => setIsEditing(true)}
                            className="rounded-xl h-9"
                        >
                            <Settings2 className="h-4 w-4 mr-2 max-sm:hidden" />
                            Change Dashboard
                        </Button>
                    </div>
                </div>

                <div className="flex-grow rounded-2xl overflow-hidden border border-border bg-white shadow-sm flex items-center justify-center">
                    <iframe
                        src={savedUrl}
                        width="100%"
                        height="100%"
                        frameBorder="0"
                        style={{ border: 0 }}
                        allowFullScreen
                        sandbox="allow-storage-access-by-user-activation allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
                    ></iframe>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto pb-10 space-y-6">
            <div>
                <h2 className="text-2xl font-bold font-heading text-slate-800 flex items-center gap-2">
                    <BarChart3 className="h-6 w-6 text-primary" />
                    Google Analytics 4 Configuration
                </h2>
                <p className="text-muted-foreground text-sm mt-1">
                    Connect your GA4 data natively to this dashboard securely.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Active Status Card */}
                <Card className="rounded-2xl border-green-200 bg-green-50 shadow-sm md:col-span-2">
                    <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-full bg-white flex items-center justify-center shadow-sm shrink-0">
                                <CheckCircle2 className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-green-900">GA4 Tracking is Active!</h3>
                                <p className="text-sm text-green-700 mt-1 max-w-xl">
                                    Your website is currently sending live traffic data to Google Analytics (Measurement ID: {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "Configured"}). Data is securely stored on Google's servers.
                                </p>
                            </div>
                        </div>
                        <Button 
                            className="shrink-0 bg-green-600 hover:bg-green-700 rounded-xl"
                            onClick={() => window.open("https://analytics.google.com/", "_blank")}
                        >
                            Go to Analytics
                            <ExternalLink className="ml-2 h-4 w-4" />
                        </Button>
                    </CardContent>
                </Card>

                {/* Integration Explanation */}
                <Card className="rounded-2xl border-border shadow-sm md:col-span-2">
                    <CardHeader className="border-b border-border bg-slate-50/50">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <ShieldAlert className="h-5 w-5 text-amber-500" />
                            Why an external dashboard?
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 text-sm text-slate-600 space-y-4">
                        <p>
                            A Google Analytics <b>Measurement ID</b> (which you provided) only allows applications to <i>send</i> event data to Google. It does not grant programmatic permission for the application to <i>read</i> that data back.
                        </p>
                        <p>
                            To display complex analytics visually inside our custom application without requiring extensive external server keys, the industry standard is to create a free, interactive dashboard in <b>Google Looker Studio</b> and embed it directly onto this page.
                        </p>
                    </CardContent>
                </Card>

                {/* Step by step guide */}
                <Card className="rounded-2xl border-border shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg">How to connect:</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm text-slate-600">
                        <ol className="list-decimal pl-5 space-y-3">
                            <li>
                                Go to <a href="https://lookerstudio.google.com/" target="_blank" className="text-primary font-medium hover:underline">Google Looker Studio</a>.
                            </li>
                            <li>
                                Create a <b>Blank Report</b> and select <b>Google Analytics</b> as your data source.
                            </li>
                            <li>
                                Select your GA4 property and click <b>Add</b>.
                            </li>
                            <li>
                                Add your favorite charts (Traffic, Users, Source).
                            </li>
                            <li>
                                Click <b>File &gt; Embed report</b> at the top.
                            </li>
                            <li>
                                Select <b>Enable embedding</b>, copy the <b>Embed URL</b> (or the iframe snippet), and paste it here.
                            </li>
                        </ol>
                    </CardContent>
                </Card>

                {/* Configuration Form */}
                <Card className="rounded-2xl border-primary/20 bg-primary/5 shadow-sm min-h-[300px] flex flex-col justify-center">
                    <CardHeader>
                        <CardTitle className="text-lg text-primary flex items-center gap-2">
                            <Settings2 className="h-5 w-5" />
                            Connect Looker Studio
                        </CardTitle>
                        <CardDescription>
                            Paste your embed URL or iframe code below.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Embed Link / iFrame</label>
                            <Input 
                                placeholder="https://lookerstudio.google.com/embed/reporting/..." 
                                value={embedUrl}
                                onChange={(e) => setEmbedUrl(e.target.value)}
                                className="bg-white rounded-xl"
                            />
                        </div>
                        
                        <div className="flex flex-col sm:flex-row gap-3">
                            <Button className="w-full rounded-xl" onClick={handleSaveConfig}>
                                Connect Dashboard
                            </Button>
                            {savedUrl && (
                                <Button variant="outline" className="w-full rounded-xl text-red-600 hover:text-red-700 hover:bg-red-50" onClick={handleClearConfig}>
                                    Clear & Disconnect
                                </Button>
                            )}
                        </div>

                        <div className="bg-white p-3 rounded-lg border border-primary/10 flex gap-2 items-start mt-4">
                            <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                            <p className="text-xs text-slate-600">
                                This configuration is saved locally to your device. Any super-admin looking at this page will need to input the link once.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
