"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Users, Clock, MonitorSmartphone, MousePointerClick, RefreshCw, Search, Calendar, FilterX, ChevronLeft, ChevronRight, ArrowUpDown, ChevronUp, ChevronDown, Filter } from "lucide-react";
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Legend
} from "recharts";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export default function AnalyticsTab({ fixedEmail = null }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [emailFilter, setEmailFilter] = useState(fixedEmail || "");
    const [searchTerm, setSearchTerm] = useState("");
    const [period, setPeriod] = useState("7d");
    const [dateRange, setDateRange] = useState({
        from: new Date(new Date().setDate(new Date().getDate() - 7)),
        to: new Date()
    });

    // Table specific state
    const [tableData, setTableData] = useState([]);
    const [tableLoading, setTableLoading] = useState(false);
    const [tablePage, setTablePage] = useState(1);
    const [tableTotalPages, setTableTotalPages] = useState(1);
    const [tableSearch, setTableSearch] = useState("");
    const [tableSearchInput, setTableSearchInput] = useState("");
    const [selectedPaths, setSelectedPaths] = useState([]);
    const [sortField, setSortField] = useState("updatedAt");
    const [sortOrder, setSortOrder] = useState("desc");

    const fetchStats = async () => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams();
            if (emailFilter) queryParams.append("email", emailFilter);

            if (period === 'custom') {
                queryParams.append("period", "custom");
                if (dateRange?.from) queryParams.append("from", dateRange.from.toISOString());
                if (dateRange?.to) queryParams.append("to", dateRange.to.toISOString());
            } else if (period) {
                queryParams.append("period", period);
            }

            const res = await fetch(`/api/analytics/stats?${queryParams.toString()}`);
            const result = await res.json();
            if (result.success) {
                setData(result.stats);
            }
        } catch (error) {
            console.error("Failed to fetch analytics stats:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchSessions = async () => {
        setTableLoading(true);
        try {
            const queryParams = new URLSearchParams();
            if (emailFilter) queryParams.append("email", emailFilter);

            if (period === 'custom') {
                queryParams.append("period", "custom");
                if (dateRange?.from) queryParams.append("from", dateRange.from.toISOString());
                if (dateRange?.to) queryParams.append("to", dateRange.to.toISOString());
            } else if (period) {
                queryParams.append("period", period);
            }

            queryParams.append("page", tablePage);
            queryParams.append("limit", 10);
            if (tableSearch) queryParams.append("search", tableSearch);
            if (selectedPaths.length > 0) queryParams.append("paths", selectedPaths.join(','));
            queryParams.append("sortField", sortField);
            queryParams.append("sortOrder", sortOrder);

            const res = await fetch(`/api/analytics/sessions?${queryParams.toString()}`);
            const result = await res.json();
            if (result.success) {
                setTableData(result.sessions);
                setTableTotalPages(result.pagination.totalPages || 1);
            }
        } catch (error) {
            console.error("Failed to fetch sessions:", error);
        } finally {
            setTableLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, [emailFilter, period, dateRange]);

    useEffect(() => {
        fetchSessions();
    }, [emailFilter, period, dateRange, tablePage, tableSearch, sortField, sortOrder, selectedPaths]);

    const handleSearchSubmit = (e) => {
        if (e) e.preventDefault();
        setEmailFilter(searchTerm);
    };

    const clearFilters = () => {
        setSearchTerm("");
        setEmailFilter(fixedEmail || "");
        setPeriod("7d");
        setDateRange({
            from: new Date(new Date().setDate(new Date().getDate() - 7)),
            to: new Date()
        });
        setTableSearch("");
        setTableSearchInput("");
        setSelectedPaths([]);
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
        setTablePage(1); // Reset to page 1 on sort
    };

    const handleTableSearch = (e) => {
        if (e) e.preventDefault();
        setTableSearch(tableSearchInput);
        setTablePage(1);
    };

    const handlePathToggle = (path) => {
        setSelectedPaths(prev =>
            prev.includes(path) ? prev.filter(p => p !== path) : [...prev, path]
        );
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

    if (loading && !data) {
        return (
            <div className="flex bg-white items-center justify-center p-12 h-96 rounded-2xl shadow-sm border border-border">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!data) {
        return <div className="p-8 text-center bg-white rounded-2xl border border-border">No analytics data available.</div>;
    }

    const getChartTitle = () => {
        switch (period) {
            case "24h": return "Hourly Traffic (Last 24 Hours)";
            case "7d": return "Daily Traffic (Last 7 Days)";
            case "30d": return "Daily Traffic (Last 30 Days)";
            case "all": return "Traffic Overview (All Time)";
            case "custom": return "Traffic Overview (Custom Range)";
            default: return "Traffic Overview";
        }
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold font-heading text-slate-800">Analytics Overview</h2>
                    <p className="text-muted-foreground text-sm">Monitor user interactions, session times, and traffic sources.</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {!fixedEmail && (
                        <form onSubmit={handleSearchSubmit} className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Filter by user email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 pr-4 py-2 bg-white border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 w-[200px]"
                            />
                            {/* Hidden submit so Enter works */}
                            <button type="submit" className="hidden" />
                        </form>
                    )}

                    <div className="bg-white border border-border rounded-xl flex p-1">
                        {[
                            { id: "24h", label: "24h" },
                            { id: "7d", label: "7d" },
                            { id: "30d", label: "30d" },
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
                                <Button
                                    id="date"
                                    variant={"outline"}
                                    size="sm"
                                    className={cn(
                                        "h-9 rounded-xl border-border justify-start text-left font-normal",
                                        !dateRange && "text-muted-foreground"
                                    )}
                                >
                                    <Calendar className="mr-2 h-4 w-4" />
                                    {dateRange?.from ? (
                                        dateRange.to ? (
                                            <>
                                                {format(dateRange.from, "LLL dd, y")} -{" "}
                                                {format(dateRange.to, "LLL dd, y")}
                                            </>
                                        ) : (
                                            format(dateRange.from, "LLL dd, y")
                                        )
                                    ) : (
                                        <span>Pick a date</span>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="end" sideOffset={8}>
                                <CalendarPicker
                                    initialFocus
                                    mode="range"
                                    defaultMonth={dateRange?.from}
                                    selected={dateRange}
                                    onSelect={setDateRange}
                                    numberOfMonths={2}
                                />
                            </PopoverContent>
                        </Popover>
                    )}

                    {(emailFilter && !fixedEmail) || (period !== '7d') ? (
                        <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 text-muted-foreground hover:text-red-600 h-9 rounded-xl">
                            <FilterX className="h-4 w-4" />
                            Clear
                        </Button>
                    ) : null}

                    <Button variant="outline" size="sm" onClick={fetchStats} disabled={loading} className="gap-2 h-9 rounded-xl">
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-6">
                <Card className="rounded-2xl shadow-sm border-border">
                    <CardContent className="p-6">
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-indigo-100 text-indigo-600 rounded-2xl">
                                <Users className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                                <h3 className="text-2xl font-bold">{data.activeUsersCount?.toLocaleString() || 0}</h3>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="rounded-2xl shadow-sm border-border">
                    <CardContent className="p-6">
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl">
                                <Users className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Total Visits</p>
                                <h3 className="text-2xl font-bold">{data.totalVisits.toLocaleString()}</h3>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-2xl shadow-sm border-border">
                    <CardContent className="p-6">
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-green-100 text-green-600 rounded-2xl">
                                <Clock className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Avg Time on Site</p>
                                <h3 className="text-2xl font-bold">{formatTime(data.timeStats?.avgTime)}</h3>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-2xl shadow-sm border-border">
                    <CardContent className="p-6">
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-purple-100 text-purple-600 rounded-2xl">
                                <MonitorSmartphone className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Top Device</p>
                                <h3 className="text-2xl font-bold capitalize">
                                    {data.deviceStats?.sort((a, b) => b.count - a.count)[0]?._id || "N/A"}
                                </h3>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-2xl shadow-sm border-border">
                    <CardContent className="p-6">
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-orange-100 text-orange-600 rounded-2xl">
                                <MousePointerClick className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Top Page</p>
                                <h3 className="text-lg font-bold truncate max-w-[150px]" title={data.topPaths?.[0]?._id}>
                                    {data.topPaths?.[0]?._id || "N/A"}
                                </h3>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 rounded-2xl shadow-sm border-border">
                    <CardHeader>
                        <CardTitle>{getChartTitle()}</CardTitle>
                        <CardDescription>Number of views recorded over time</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            {data.dailyVisits?.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={data.dailyVisits} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                        <XAxis
                                            dataKey="_id"
                                            tickLine={false}
                                            axisLine={false}
                                            tick={{ fontSize: 12 }}
                                            tickFormatter={(val) => {
                                                if (period === "24h") return `${val}:00`;
                                                return val;
                                            }}
                                        />
                                        <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                                        <Tooltip
                                            contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)" }}
                                            labelFormatter={(label) => period === "24h" ? `Time: ${label}:00` : `Date: ${label}`}
                                        />
                                        <Line type="monotone" name="Views" dataKey="visits" stroke="#ef4444" strokeWidth={3} dot={{ r: 4, fill: "#ef4444", strokeWidth: 0 }} activeDot={{ r: 6 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-full text-muted-foreground">No recent data</div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-2xl shadow-sm border-border overflow-hidden">
                    <CardHeader className="bg-slate-50 border-b border-border/50">
                        <CardTitle>Top Pages Viewed</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-border/50 max-h-[300px] overflow-y-auto">
                            {data.topPaths?.map((path, idx) => (
                                <div key={idx} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                    <div className="truncate pr-4">
                                        <p className="text-sm font-medium truncate" title={path._id}>{path._id}</p>
                                        <p className="text-xs text-muted-foreground">Avg Time: {formatTime(path.avgTime)}</p>
                                    </div>
                                    <div className="bg-primary/10 text-primary font-bold px-2.5 py-1 rounded-full text-xs shrink-0">
                                        {path.views} views
                                    </div>
                                </div>
                            ))}
                            {data.topPaths?.length === 0 && (
                                <div className="p-8 text-center text-muted-foreground text-sm">No page data yet.</div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="rounded-2xl shadow-sm border-border overflow-hidden">
                <CardHeader className="bg-slate-50 border-b border-border/50 p-4">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div>
                            <CardTitle>Tracked User Sessions</CardTitle>
                            <CardDescription className="mt-1">
                                {emailFilter
                                    ? <span>Showing comprehensive activity log for <b>{emailFilter}</b></span>
                                    : <span>Latest tracked sessions from logged-in users</span>
                                }
                            </CardDescription>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm" className="h-9 px-3 rounded-xl border-dashed">
                                        <Filter className="h-4 w-4 mr-2" />
                                        Paths
                                        {selectedPaths.length > 0 && (
                                            <span className="ml-2 bg-primary text-primary-foreground font-bold rounded-full text-[10px] w-4 h-4 flex items-center justify-center">
                                                {selectedPaths.length}
                                            </span>
                                        )}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-[240px]">
                                    <DropdownMenuLabel>Filter by Path</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    {data?.uniquePaths?.length > 0 ? (
                                        <div className="max-h-[280px] overflow-y-auto">
                                            {data.uniquePaths.map((path) => (
                                                <DropdownMenuCheckboxItem
                                                    key={path}
                                                    checked={selectedPaths.includes(path)}
                                                    onCheckedChange={() => handlePathToggle(path)}
                                                    className="text-xs truncate font-mono"
                                                >
                                                    {path}
                                                </DropdownMenuCheckboxItem>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-2 text-xs text-muted-foreground text-center">No paths available</div>
                                    )}
                                    {selectedPaths.length > 0 && (
                                        <>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setSelectedPaths([]); setTablePage(1); }} className="justify-center text-xs font-semibold text-red-600">
                                                Clear Selected
                                            </DropdownMenuItem>
                                        </>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <form onSubmit={handleTableSearch} className="relative w-full sm:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Search paths or emails..."
                                    value={tableSearchInput}
                                    onChange={(e) => setTableSearchInput(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 bg-white border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                />
                                <button type="submit" className="hidden" />
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
                                    <th className="px-6 py-4 font-semibold cursor-pointer select-none hover:bg-slate-100 transition-colors" onClick={() => handleSort('userEmail')}>
                                        <div className="flex items-center gap-2">
                                            User {sortField === 'userEmail' ? (sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />) : <ArrowUpDown className="h-4 w-4 opacity-50" />}
                                        </div>
                                    </th>
                                    <th className="px-6 py-4 font-semibold cursor-pointer select-none hover:bg-slate-100 transition-colors" onClick={() => handleSort('path')}>
                                        <div className="flex items-center gap-2">
                                            Path Visited {sortField === 'path' ? (sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />) : <ArrowUpDown className="h-4 w-4 opacity-50" />}
                                        </div>
                                    </th>
                                    <th className="px-6 py-4 font-semibold cursor-pointer select-none hover:bg-slate-100 transition-colors" onClick={() => handleSort('timeSpentSeconds')}>
                                        <div className="flex items-center gap-2">
                                            Time Spent {sortField === 'timeSpentSeconds' ? (sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />) : <ArrowUpDown className="h-4 w-4 opacity-50" />}
                                        </div>
                                    </th>
                                    <th className="px-6 py-4 font-semibold cursor-pointer select-none hover:bg-slate-100 transition-colors" onClick={() => handleSort('os')}>
                                        <div className="flex items-center gap-2">
                                            System {sortField === 'os' ? (sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />) : <ArrowUpDown className="h-4 w-4 opacity-50" />}
                                        </div>
                                    </th>
                                    <th className="px-6 py-4 font-semibold text-right cursor-pointer select-none hover:bg-slate-100 transition-colors" onClick={() => handleSort('updatedAt')}>
                                        <div className="flex items-center justify-end gap-2">
                                            Last Active {sortField === 'updatedAt' ? (sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />) : <ArrowUpDown className="h-4 w-4 opacity-50" />}
                                        </div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50 relative">
                                {tableLoading && (
                                    <tr>
                                        <td colSpan={5} className="h-full w-full absolute inset-0 bg-white/50 backdrop-blur-[2px] z-10">
                                            <div className="flex items-center justify-center h-full">
                                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                            </div>
                                        </td>
                                    </tr>
                                )}
                                {tableData?.map((user, idx) => (
                                    <tr key={user._id || idx} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-slate-900">
                                            <div className="flex items-center gap-2">
                                                <span>{user.userEmail}</span>
                                                {user.deviceType && (
                                                    <span className="text-[10px] uppercase font-bold text-slate-400 border border-slate-200 px-1.5 py-0.5 rounded-md">
                                                        {user.deviceType}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-muted-foreground truncate max-w-[300px]" title={user.path}>{user.path}</td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-medium">
                                                <Clock className="h-3 w-3" />
                                                {formatTime(user.timeSpentSeconds)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm text-slate-700 font-medium">
                                                    {(user.browser && !user.browser.includes("Mozilla")) ? user.browser : "Browser"}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground uppercase">{user.os || "Unknown OS"}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right text-muted-foreground whitespace-nowrap">
                                            {new Date(user.updatedAt).toLocaleString(undefined, {
                                                month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
                                            })}
                                        </td>
                                    </tr>
                                ))}
                                {!tableLoading && tableData?.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground text-sm">
                                            No tracked users yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
                {/* Pagination Controls */}
                <div className="border-t border-border p-4 bg-slate-50/50 flex items-center justify-between">
                    <span className="text-sm border text-muted-foreground bg-white px-3 py-1.5 rounded-lg shadow-sm">
                        Page <span className="font-semibold text-foreground">{tablePage}</span> of <span className="font-semibold text-foreground">{tableTotalPages}</span>
                    </span>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={tablePage <= 1 || tableLoading}
                            onClick={() => setTablePage(p => Math.max(1, p - 1))}
                            className="rounded-xl h-9"
                        >
                            <ChevronLeft className="h-4 w-4 mr-1" /> Prev
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={tablePage >= tableTotalPages || tableLoading}
                            onClick={() => setTablePage(p => p + 1)}
                            className="rounded-xl h-9"
                        >
                            Next <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                    </div>
                </div>
            </Card>

            {/* Disclaimer / GA Info */}
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                    <MonitorSmartphone className="h-6 w-6 text-blue-600" />
                </div>
                <h4 className="text-lg font-bold text-blue-900 mb-2">Google Analytics GA4 Active</h4>
                <p className="text-blue-700 max-w-2xl text-sm">
                    This system is natively integrated with Google Analytics. For complete in-depth behavioral tracking (like bounce rates, acquisition sources, and conversion funnels), please log in to your <a href="https://analytics.google.com/" target="_blank" className="font-semibold underline">Google Analytics account</a>. The dashboard above is a complementary real-time view of your authenticated user traffic.
                </p>
            </div>
        </div>
    );
}
