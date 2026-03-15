"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Loader2, Users, Clock, MonitorSmartphone, MousePointerClick, RefreshCw,
    Calendar, FilterX, Globe, Laptop, Smartphone, Tablet, Eye, UserPlus,
    TrendingUp, BarChart3, ArrowDownRight, Search, ChevronLeft, ChevronRight,
    ArrowUpDown, ChevronUp, ChevronDown, Filter, X
} from "lucide-react";
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Legend, PieChart, Pie, Cell, AreaChart, Area
} from "recharts";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899", "#14b8a6"];

export default function AnalyticsTab() {
    // GA4 stats state
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [period, setPeriod] = useState("7d");
    const [dateRange, setDateRange] = useState({
        from: new Date(new Date().setDate(new Date().getDate() - 7)),
        to: new Date()
    });

    // Sessions table state
    const [tableData, setTableData] = useState([]);
    const [tableLoading, setTableLoading] = useState(false);
    const [tablePage, setTablePage] = useState(1);
    const [tableTotalPages, setTableTotalPages] = useState(1);
    const [tableTotal, setTableTotal] = useState(0);
    const [tableSearchInput, setTableSearchInput] = useState("");
    const [tableSearch, setTableSearch] = useState("");
    const [selectedPaths, setSelectedPaths] = useState([]);
    const [selectedDevice, setSelectedDevice] = useState("");
    const [sortField, setSortField] = useState("updatedAt");
    const [sortOrder, setSortOrder] = useState("desc");
    const [uniquePaths, setUniquePaths] = useState([]);

    // Fetch GA4 stats
    const fetchStats = async () => {
        setLoading(true);
        setError(null);
        try {
            const queryParams = new URLSearchParams();
            if (period === 'custom') {
                queryParams.append("period", "custom");
                if (dateRange?.from) queryParams.append("from", dateRange.from.toISOString().split("T")[0]);
                if (dateRange?.to) queryParams.append("to", dateRange.to.toISOString().split("T")[0]);
            } else {
                queryParams.append("period", period);
            }
            const res = await fetch(`/api/analytics/stats?${queryParams.toString()}`);
            const result = await res.json();
            if (result.success) {
                setData(result.stats);
            } else {
                setError(result.error || "Failed to fetch analytics.");
            }
        } catch (err) {
            console.error("Failed to fetch GA4 stats:", err);
            setError("Failed to connect to analytics service.");
        } finally {
            setLoading(false);
        }
    };

    // Fetch MongoDB sessions for table
    const fetchSessions = async () => {
        setTableLoading(true);
        try {
            const queryParams = new URLSearchParams();
            if (period === 'custom') {
                queryParams.append("period", "custom");
                if (dateRange?.from) queryParams.append("from", dateRange.from.toISOString());
                if (dateRange?.to) queryParams.append("to", dateRange.to.toISOString());
            } else {
                queryParams.append("period", period);
            }
            queryParams.append("page", tablePage);
            queryParams.append("limit", 15);
            if (tableSearch) queryParams.append("search", tableSearch);
            if (selectedPaths.length > 0) queryParams.append("paths", selectedPaths.join(","));
            if (selectedDevice) queryParams.append("device", selectedDevice);
            queryParams.append("sortField", sortField);
            queryParams.append("sortOrder", sortOrder);

            const res = await fetch(`/api/analytics/sessions?${queryParams.toString()}`);
            const result = await res.json();
            if (result.success) {
                setTableData(result.sessions);
                setTableTotalPages(result.pagination.totalPages || 1);
                setTableTotal(result.pagination.total || 0);
                if (result.uniquePaths) setUniquePaths(result.uniquePaths);
            }
        } catch (err) {
            console.error("Failed to fetch sessions:", err);
        } finally {
            setTableLoading(false);
        }
    };

    useEffect(() => { fetchStats(); }, [period, dateRange]);
    useEffect(() => { fetchSessions(); }, [period, dateRange, tablePage, tableSearch, sortField, sortOrder, selectedPaths, selectedDevice]);

    const clearFilters = () => {
        setPeriod("7d");
        setDateRange({ from: new Date(new Date().setDate(new Date().getDate() - 7)), to: new Date() });
        setTableSearch("");
        setTableSearchInput("");
        setSelectedPaths([]);
        setSelectedDevice("");
        setTablePage(1);
        setSortField("updatedAt");
        setSortOrder("desc");
    };

    const handleSort = (field) => {
        if (sortField === field) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
        } else {
            setSortField(field);
            setSortOrder("desc");
        }
        setTablePage(1);
    };

    const handleTableSearch = (e) => {
        if (e) e.preventDefault();
        setTableSearch(tableSearchInput);
        setTablePage(1);
    };

    const handlePathToggle = (path) => {
        setSelectedPaths(prev => prev.includes(path) ? prev.filter(p => p !== path) : [...prev, path]);
        setTablePage(1);
    };

    const formatTime = (seconds) => {
        if (!seconds) return "0s";
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        if (h > 0) return `${h}h ${m}m ${s}s`;
        if (m > 0) return `${m}m ${s}s`;
        return `${s}s`;
    };

    const parseBrowserName = (ua) => {
        if (!ua) return "Unknown";
        if (ua.includes("Edg/")) return "Edge";
        if (ua.includes("Chrome/") && !ua.includes("Edg/")) return "Chrome";
        if (ua.includes("Firefox/")) return "Firefox";
        if (ua.includes("Safari/") && !ua.includes("Chrome/")) return "Safari";
        if (ua.includes("Opera") || ua.includes("OPR/")) return "Opera";
        return "Other";
    };

    const parseOS = (platform) => {
        if (!platform) return "Unknown";
        if (platform.includes("Win")) return "Windows";
        if (platform.includes("Mac")) return "macOS";
        if (platform.includes("Linux")) return "Linux";
        if (platform.includes("iPhone") || platform.includes("iPad")) return "iOS";
        return platform;
    };

    const getChartTitle = () => {
        switch (period) {
            case "24h": return "Hourly Traffic (Last 24 Hours)";
            case "7d": return "Daily Traffic (Last 7 Days)";
            case "30d": return "Daily Traffic (Last 30 Days)";
            case "90d": return "Daily Traffic (Last 90 Days)";
            case "all": return "Traffic Overview (Last 365 Days)";
            case "custom": return "Traffic Overview (Custom Range)";
            default: return "Traffic Overview";
        }
    };

    const getDeviceIcon = (device) => {
        switch (device?.toLowerCase()) {
            case "desktop": return <Laptop className="h-4 w-4" />;
            case "mobile": return <Smartphone className="h-4 w-4" />;
            case "tablet": return <Tablet className="h-4 w-4" />;
            default: return <MonitorSmartphone className="h-4 w-4" />;
        }
    };

    const SortIcon = ({ field }) => {
        if (sortField === field) {
            return sortOrder === "asc" ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />;
        }
        return <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />;
    };

    if (loading && !data) {
        return (
            <div className="flex bg-white items-center justify-center p-12 h-96 rounded-2xl shadow-sm border border-border">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error && !data) {
        return (
            <div className="p-8 text-center bg-white rounded-2xl border border-border space-y-3">
                <p className="text-red-600 font-medium">⚠️ {error}</p>
                <p className="text-sm text-muted-foreground">Please verify your GA4 credentials and property access.</p>
                <Button variant="outline" size="sm" onClick={fetchStats} className="rounded-xl">
                    <RefreshCw className="h-4 w-4 mr-2" /> Retry
                </Button>
            </div>
        );
    }

    const overview = data?.overview || {};
    const dailyVisits = data?.dailyVisits || [];
    const topPaths = data?.topPaths || [];
    const deviceStats = data?.deviceStats || [];
    const browserStats = data?.browserStats || [];
    const countryStats = data?.countryStats || [];
    const trafficSources = data?.trafficSources || [];
    const realtimeUsers = data?.realtimeUsers || 0;

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold font-heading text-slate-800 flex items-center gap-2">
                        <BarChart3 className="h-6 w-6 text-primary" />
                        Analytics Overview
                        <span className="text-xs font-normal text-muted-foreground ml-2 bg-green-100 text-green-700 px-2 py-0.5 rounded-full">GA4 Live</span>
                    </h2>
                    <p className="text-muted-foreground text-sm">Real-time data powered by Google Analytics 4 + User Tracking.</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="bg-white border border-border rounded-xl flex p-1">
                        {[
                            { id: "24h", label: "24h" },
                            { id: "7d", label: "7d" },
                            { id: "30d", label: "30d" },
                            { id: "90d", label: "90d" },
                            { id: "all", label: "All" },
                            { id: "custom", label: "Custom" }
                        ].map((p) => (
                            <button
                                key={p.id}
                                onClick={() => setPeriod(p.id)}
                                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${period === p.id
                                    ? "bg-primary text-primary-foreground shadow-sm"
                                    : "text-muted-foreground hover:bg-slate-50 hover:text-slate-900"
                                    }`}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>

                    {period === "custom" && (
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant={"outline"} size="sm" className={cn("h-9 rounded-xl border-border justify-start text-left font-normal", !dateRange && "text-muted-foreground")}>
                                    <Calendar className="mr-2 h-4 w-4" />
                                    {dateRange?.from ? (dateRange.to ? (<>{format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}</>) : format(dateRange.from, "LLL dd, y")) : (<span>Pick a date</span>)}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="end" sideOffset={8}>
                                <CalendarPicker initialFocus mode="range" defaultMonth={dateRange?.from} selected={dateRange} onSelect={setDateRange} numberOfMonths={2} />
                            </PopoverContent>
                        </Popover>
                    )}

                    {period !== '7d' && (
                        <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 text-muted-foreground hover:text-red-600 h-9 rounded-xl">
                            <FilterX className="h-4 w-4" /> Clear
                        </Button>
                    )}

                    <Button variant="outline" size="sm" onClick={() => { fetchStats(); fetchSessions(); }} disabled={loading} className="gap-2 h-9 rounded-xl">
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
                <Card className="rounded-2xl shadow-sm border-border">
                    <CardContent className="p-5">
                        <div className="flex items-center space-x-3">
                            <div className="p-2.5 bg-green-100 text-green-600 rounded-xl"><Users className="h-5 w-5" /></div>
                            <div><p className="text-xs font-medium text-muted-foreground">Realtime</p><h3 className="text-xl font-bold">{realtimeUsers}</h3></div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="rounded-2xl shadow-sm border-border">
                    <CardContent className="p-5">
                        <div className="flex items-center space-x-3">
                            <div className="p-2.5 bg-indigo-100 text-indigo-600 rounded-xl"><Users className="h-5 w-5" /></div>
                            <div><p className="text-xs font-medium text-muted-foreground">Active Users</p><h3 className="text-xl font-bold">{overview.activeUsers?.toLocaleString() || 0}</h3></div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="rounded-2xl shadow-sm border-border">
                    <CardContent className="p-5">
                        <div className="flex items-center space-x-3">
                            <div className="p-2.5 bg-blue-100 text-blue-600 rounded-xl"><Eye className="h-5 w-5" /></div>
                            <div><p className="text-xs font-medium text-muted-foreground">Page Views</p><h3 className="text-xl font-bold">{overview.pageViews?.toLocaleString() || 0}</h3></div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="rounded-2xl shadow-sm border-border">
                    <CardContent className="p-5">
                        <div className="flex items-center space-x-3">
                            <div className="p-2.5 bg-green-100 text-green-600 rounded-xl"><Clock className="h-5 w-5" /></div>
                            <div><p className="text-xs font-medium text-muted-foreground">Avg Session</p><h3 className="text-xl font-bold">{formatTime(overview.avgSessionDuration)}</h3></div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="rounded-2xl shadow-sm border-border">
                    <CardContent className="p-5">
                        <div className="flex items-center space-x-3">
                            <div className="p-2.5 bg-orange-100 text-orange-600 rounded-xl"><ArrowDownRight className="h-5 w-5" /></div>
                            <div><p className="text-xs font-medium text-muted-foreground">Bounce Rate</p><h3 className="text-xl font-bold">{((overview.bounceRate || 0) * 100).toFixed(1)}%</h3></div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="rounded-2xl shadow-sm border-border">
                    <CardContent className="p-5">
                        <div className="flex items-center space-x-3">
                            <div className="p-2.5 bg-purple-100 text-purple-600 rounded-xl"><UserPlus className="h-5 w-5" /></div>
                            <div><p className="text-xs font-medium text-muted-foreground">New Users</p><h3 className="text-xl font-bold">{overview.newUsers?.toLocaleString() || 0}</h3></div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Traffic Chart + Top Pages */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 rounded-2xl shadow-sm border-border">
                    <CardHeader>
                        <CardTitle>{getChartTitle()}</CardTitle>
                        <CardDescription>Page views and active users over time</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            {dailyVisits?.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={dailyVisits} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                        <defs>
                                            <linearGradient id="fillViews" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
                                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="fillUsers" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                        <XAxis dataKey="_id" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                                        <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                                        <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)" }} />
                                        <Legend />
                                        <Area type="monotone" name="Page Views" dataKey="views" stroke="#ef4444" strokeWidth={2.5} fill="url(#fillViews)" dot={{ r: 3, fill: "#ef4444", strokeWidth: 0 }} activeDot={{ r: 5 }} />
                                        <Area type="monotone" name="Users" dataKey="users" stroke="#6366f1" strokeWidth={2.5} fill="url(#fillUsers)" dot={{ r: 3, fill: "#6366f1", strokeWidth: 0 }} activeDot={{ r: 5 }} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-full text-muted-foreground">No traffic data for this period</div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-2xl shadow-sm border-border overflow-hidden">
                    <CardHeader className="bg-slate-50 border-b border-border/50">
                        <CardTitle>Top Pages Viewed</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-border/50 max-h-[330px] overflow-y-auto">
                            {topPaths?.map((path, idx) => (
                                <div key={idx} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                    <div className="truncate pr-4">
                                        <p className="text-sm font-medium truncate" title={path._id}>{path._id}</p>
                                        <p className="text-xs text-muted-foreground">{path.users} users · Avg: {formatTime(path.avgTime)}</p>
                                    </div>
                                    <div className="bg-primary/10 text-primary font-bold px-2.5 py-1 rounded-full text-xs shrink-0">{path.views} views</div>
                                </div>
                            ))}
                            {topPaths?.length === 0 && <div className="p-8 text-center text-muted-foreground text-sm">No page data yet.</div>}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Device, Browser, Country, Sources */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Devices */}
                <Card className="rounded-2xl shadow-sm border-border overflow-hidden">
                    <CardHeader className="bg-slate-50 border-b border-border/50 py-4">
                        <CardTitle className="text-base flex items-center gap-2"><MonitorSmartphone className="h-4 w-4 text-purple-500" />Devices</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {deviceStats.length > 0 && (
                            <div className="p-4 h-[160px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart><Pie data={deviceStats} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="count" nameKey="_id">{deviceStats.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}</Pie><Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }} /></PieChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                        <div className="divide-y divide-border/50">
                            {deviceStats.map((d, idx) => (
                                <div key={idx} className="px-4 py-3 flex items-center justify-between">
                                    <div className="flex items-center gap-2.5"><div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} /><span className="text-sm capitalize flex items-center gap-1.5">{getDeviceIcon(d._id)} {d._id}</span></div>
                                    <span className="text-sm font-semibold">{d.count}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
                {/* Browsers */}
                <Card className="rounded-2xl shadow-sm border-border overflow-hidden">
                    <CardHeader className="bg-slate-50 border-b border-border/50 py-4"><CardTitle className="text-base flex items-center gap-2"><Globe className="h-4 w-4 text-blue-500" />Browsers</CardTitle></CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-border/50 max-h-[340px] overflow-y-auto">
                            {browserStats.map((b, idx) => { const pct = (b.count / (browserStats[0]?.count || 1)) * 100; return (
                                <div key={idx} className="px-4 py-3"><div className="flex items-center justify-between mb-1.5"><span className="text-sm font-medium">{b._id}</span><span className="text-xs font-semibold text-muted-foreground">{b.count} users</span></div><div className="w-full bg-slate-100 rounded-full h-1.5"><div className="bg-blue-500 h-1.5 rounded-full transition-all" style={{ width: `${pct}%` }} /></div></div>
                            ); })}
                            {browserStats.length === 0 && <div className="p-6 text-center text-muted-foreground text-sm">No data</div>}
                        </div>
                    </CardContent>
                </Card>
                {/* Countries */}
                <Card className="rounded-2xl shadow-sm border-border overflow-hidden">
                    <CardHeader className="bg-slate-50 border-b border-border/50 py-4"><CardTitle className="text-base flex items-center gap-2"><Globe className="h-4 w-4 text-emerald-500" />Countries</CardTitle></CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-border/50 max-h-[340px] overflow-y-auto">
                            {countryStats.map((c, idx) => (
                                <div key={idx} className="px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors"><div className="flex items-center gap-2"><span className="text-lg">🌍</span><span className="text-sm font-medium">{c._id}</span></div><div className="text-right"><span className="text-sm font-semibold">{c.users}</span><span className="text-xs text-muted-foreground ml-1">users</span></div></div>
                            ))}
                            {countryStats.length === 0 && <div className="p-6 text-center text-muted-foreground text-sm">No data</div>}
                        </div>
                    </CardContent>
                </Card>
                {/* Traffic Sources */}
                <Card className="rounded-2xl shadow-sm border-border overflow-hidden">
                    <CardHeader className="bg-slate-50 border-b border-border/50 py-4"><CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-4 w-4 text-orange-500" />Traffic Sources</CardTitle></CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-border/50 max-h-[340px] overflow-y-auto">
                            {trafficSources.map((s, idx) => { const pct = (s.sessions / (trafficSources[0]?.sessions || 1)) * 100; return (
                                <div key={idx} className="px-4 py-3"><div className="flex items-center justify-between mb-1.5"><span className="text-sm font-medium">{s._id}</span><span className="text-xs font-semibold text-muted-foreground">{s.sessions} sessions</span></div><div className="w-full bg-slate-100 rounded-full h-1.5"><div className="bg-orange-500 h-1.5 rounded-full transition-all" style={{ width: `${pct}%` }} /></div></div>
                            ); })}
                            {trafficSources.length === 0 && <div className="p-6 text-center text-muted-foreground text-sm">No data</div>}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Sessions Bar Chart */}
            {dailyVisits.length > 0 && (
                <Card className="rounded-2xl shadow-sm border-border">
                    <CardHeader><CardTitle>Sessions Over Time</CardTitle><CardDescription>Number of sessions recorded per day</CardDescription></CardHeader>
                    <CardContent>
                        <div className="h-[250px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={dailyVisits} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" /><XAxis dataKey="_id" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} /><YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} /><Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)" }} /><Bar name="Sessions" dataKey="sessions" fill="#6366f1" radius={[6, 6, 0, 0]} /></BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* ==================== USER SESSIONS TABLE ==================== */}
            <Card className="rounded-2xl shadow-sm border-border overflow-hidden">
                <CardHeader className="bg-slate-50 border-b border-border/50 p-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5 text-indigo-500" />
                                Tracked User Sessions
                            </CardTitle>
                            <CardDescription className="mt-1">
                                <span className="font-medium text-slate-700">{tableTotal}</span> records found · Per-user tracking via MongoDB
                            </CardDescription>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                            {/* Path Filter */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm" className="h-9 px-3 rounded-xl border-dashed">
                                        <Filter className="h-4 w-4 mr-2" /> Paths
                                        {selectedPaths.length > 0 && <span className="ml-2 bg-primary text-primary-foreground font-bold rounded-full text-[10px] w-4 h-4 flex items-center justify-center">{selectedPaths.length}</span>}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-[260px]">
                                    <DropdownMenuLabel>Filter by Path</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <div className="max-h-[280px] overflow-y-auto">
                                        {uniquePaths.length > 0 ? uniquePaths.map((path) => (
                                            <DropdownMenuCheckboxItem key={path} checked={selectedPaths.includes(path)} onCheckedChange={() => handlePathToggle(path)} className="text-xs truncate font-mono">{path}</DropdownMenuCheckboxItem>
                                        )) : <div className="p-2 text-xs text-muted-foreground text-center">No paths available</div>}
                                    </div>
                                    {selectedPaths.length > 0 && (<><DropdownMenuSeparator /><DropdownMenuItem onSelect={(e) => { e.preventDefault(); setSelectedPaths([]); setTablePage(1); }} className="justify-center text-xs font-semibold text-red-600">Clear Selected</DropdownMenuItem></>)}
                                </DropdownMenuContent>
                            </DropdownMenu>

                            {/* Device Filter */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm" className="h-9 px-3 rounded-xl border-dashed">
                                        <MonitorSmartphone className="h-4 w-4 mr-2" /> Device
                                        {selectedDevice && <span className="ml-2 bg-primary text-primary-foreground font-bold rounded-full text-[10px] px-1.5 py-0.5">{selectedDevice}</span>}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-[180px]">
                                    <DropdownMenuLabel>Filter by Device</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    {["desktop", "mobile", "tablet"].map((d) => (
                                        <DropdownMenuCheckboxItem key={d} checked={selectedDevice === d} onCheckedChange={() => { setSelectedDevice(selectedDevice === d ? "" : d); setTablePage(1); }} className="capitalize">{d}</DropdownMenuCheckboxItem>
                                    ))}
                                    {selectedDevice && (<><DropdownMenuSeparator /><DropdownMenuItem onSelect={(e) => { e.preventDefault(); setSelectedDevice(""); setTablePage(1); }} className="justify-center text-xs font-semibold text-red-600">Clear</DropdownMenuItem></>)}
                                </DropdownMenuContent>
                            </DropdownMenu>

                            {/* Search */}
                            <form onSubmit={handleTableSearch} className="relative w-full sm:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <input type="text" placeholder="Search name, email, path..." value={tableSearchInput} onChange={(e) => setTableSearchInput(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-white border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                                {tableSearch && <button type="button" onClick={() => { setTableSearchInput(""); setTableSearch(""); setTablePage(1); }} className="absolute right-3 top-1/2 -translate-y-1/2"><X className="h-3.5 w-3.5 text-muted-foreground hover:text-red-500" /></button>}
                            </form>
                            <Button variant="outline" size="icon" onClick={fetchSessions} disabled={tableLoading} className="rounded-xl shrink-0 h-9 w-9">
                                <RefreshCw className={`h-4 w-4 ${tableLoading ? 'animate-spin' : ''}`} />
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-muted-foreground uppercase bg-slate-50/50">
                                <tr>
                                    <th className="px-5 py-3.5 font-semibold cursor-pointer select-none hover:bg-slate-100 transition-colors" onClick={() => handleSort('userName')}>
                                        <div className="flex items-center gap-1.5">User <SortIcon field="userName" /></div>
                                    </th>
                                    <th className="px-5 py-3.5 font-semibold cursor-pointer select-none hover:bg-slate-100 transition-colors" onClick={() => handleSort('userEmail')}>
                                        <div className="flex items-center gap-1.5">Email <SortIcon field="userEmail" /></div>
                                    </th>
                                    <th className="px-5 py-3.5 font-semibold cursor-pointer select-none hover:bg-slate-100 transition-colors" onClick={() => handleSort('path')}>
                                        <div className="flex items-center gap-1.5">Route <SortIcon field="path" /></div>
                                    </th>
                                    <th className="px-5 py-3.5 font-semibold cursor-pointer select-none hover:bg-slate-100 transition-colors" onClick={() => handleSort('timeSpentSeconds')}>
                                        <div className="flex items-center gap-1.5">Duration <SortIcon field="timeSpentSeconds" /></div>
                                    </th>
                                    <th className="px-5 py-3.5 font-semibold">Device</th>
                                    <th className="px-5 py-3.5 font-semibold">Browser / OS</th>
                                    <th className="px-5 py-3.5 font-semibold text-right cursor-pointer select-none hover:bg-slate-100 transition-colors" onClick={() => handleSort('updatedAt')}>
                                        <div className="flex items-center justify-end gap-1.5">Visit Time <SortIcon field="updatedAt" /></div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50 relative">
                                {tableLoading && (
                                    <tr><td colSpan={7} className="h-full w-full absolute inset-0 bg-white/50 backdrop-blur-[2px] z-10"><div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></td></tr>
                                )}
                                {tableData.map((row, idx) => (
                                    <tr key={row._id || idx} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-5 py-3.5 font-medium text-slate-900 whitespace-nowrap">
                                            {row.userName || <span className="text-muted-foreground italic">Anonymous</span>}
                                        </td>
                                        <td className="px-5 py-3.5 text-muted-foreground">
                                            {row.userEmail || <span className="italic">—</span>}
                                        </td>
                                        <td className="px-5 py-3.5 text-muted-foreground truncate max-w-[220px]" title={row.path}>
                                            <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">{row.path}</code>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-medium">
                                                <Clock className="h-3 w-3" /> {formatTime(row.timeSpentSeconds)}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <span className="text-[10px] uppercase font-bold text-slate-500 border border-slate-200 px-1.5 py-0.5 rounded-md inline-flex items-center gap-1">
                                                {getDeviceIcon(row.deviceType)} {row.deviceType || "unknown"}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <div className="flex flex-col">
                                                <span className="text-sm text-slate-700 font-medium">{parseBrowserName(row.browser)}</span>
                                                <span className="text-[10px] text-muted-foreground uppercase">{parseOS(row.os)}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5 text-right text-muted-foreground whitespace-nowrap text-xs">
                                            {new Date(row.updatedAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                                        </td>
                                    </tr>
                                ))}
                                {!tableLoading && tableData.length === 0 && (
                                    <tr><td colSpan={7} className="px-6 py-12 text-center text-muted-foreground text-sm">No tracked user sessions found for this period.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
                {/* Pagination */}
                <div className="border-t border-border p-4 bg-slate-50/50 flex items-center justify-between">
                    <span className="text-sm border text-muted-foreground bg-white px-3 py-1.5 rounded-lg shadow-sm">
                        Page <span className="font-semibold text-foreground">{tablePage}</span> of <span className="font-semibold text-foreground">{tableTotalPages}</span>
                        <span className="ml-2 text-xs">({tableTotal} total)</span>
                    </span>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" disabled={tablePage <= 1 || tableLoading} onClick={() => setTablePage(p => Math.max(1, p - 1))} className="rounded-xl h-9">
                            <ChevronLeft className="h-4 w-4 mr-1" /> Prev
                        </Button>
                        <Button variant="outline" size="sm" disabled={tablePage >= tableTotalPages || tableLoading} onClick={() => setTablePage(p => p + 1)} className="rounded-xl h-9">
                            Next <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                    </div>
                </div>
            </Card>

            {/* GA4 Info Banner */}
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-4"><BarChart3 className="h-6 w-6 text-blue-600" /></div>
                <h4 className="text-lg font-bold text-blue-900 mb-2">Google Analytics 4 — Live Data</h4>
                <p className="text-blue-700 max-w-2xl text-sm">Overview stats are fetched from GA4. The user sessions table tracks individual visitors via MongoDB for detailed per-user analytics. Visit your <a href="https://analytics.google.com/" target="_blank" className="font-semibold underline">Google Analytics dashboard</a> for more insights.</p>
            </div>
        </div>
    );
}
