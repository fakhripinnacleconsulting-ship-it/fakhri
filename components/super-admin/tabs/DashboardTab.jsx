"use client";
import { useState, useEffect } from "react";
import {
    Users, CheckSquare, AlertTriangle, IndianRupee, Loader2,
    FileText, MessageSquare, Briefcase, UserPlus, Zap, Activity,
    TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Clock,
    BarChart3, CalendarDays, ListChecks, Filter
} from "lucide-react";
import StatCard from "@/components/dashboard/StatCard";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatINR, getWeekNumber } from "@/lib/utils";
import { getDashboardStats, getActivityLogs } from "@/lib/actions/dashboard";
import { getSalesAnalytics } from "@/lib/actions/invoice";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getUsers } from "@/lib/actions/user";
import { getAdmins } from "@/lib/actions/admin";
import { useSession } from "next-auth/react";

const getActivityIcon = (type) => {
    switch (type) {
        case 'client': return <UserPlus className="h-4 w-4 text-blue-500" />;
        case 'task': return <CheckSquare className="h-4 w-4 text-green-500" />;
        case 'file': return <FileText className="h-4 w-4 text-orange-500" />;
        case 'note': return <MessageSquare className="h-4 w-4 text-purple-500" />;
        case 'system': return <Activity className="h-4 w-4 text-red-500" />;
        default: return <Zap className="h-4 w-4 text-yellow-500" />;
    }
};

const getPeriodLabel = (filterPeriod, { customType, selectedYear, selectedMonth, dateRange }) => {
    switch (filterPeriod) {
        case 'weekly': return 'This Week';
        case 'monthly': return 'This Month';
        case 'yearly': return 'This Year';
        case 'custom':
            if (customType === 'year_month') {
                if (selectedMonth === -1) return `${selectedYear}`;
                return `${new Date(selectedYear, selectedMonth, 1).toLocaleString('default', { month: 'short' })} ${selectedYear}`;
            }
            if (dateRange?.from && dateRange?.to) {
                return `${new Date(dateRange.from).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} - ${new Date(dateRange.to).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`;
            }
            if (dateRange?.from) return `Since ${new Date(dateRange.from).toLocaleDateString()}`;
            return 'Custom Range';
        default: return 'This Month';
    }
};

const getPrevPeriodLabel = (filterPeriod) => {
    switch (filterPeriod) {
        case 'weekly': return 'vs last week';
        case 'monthly': return 'vs last month';
        case 'yearly': return 'vs last year';
        case 'custom': return 'vs previous period';
        default: return 'vs prev period';
    }
};

/** Renders a change badge with arrow icon */
const ChangeBadge = ({ value, suffix = "" }) => {
    if (value === 0 || value === undefined || value === null) {
        return <span className="text-[10px] text-muted-foreground font-medium">No change</span>;
    }
    const isPositive = value > 0;
    return (
        <span className={`inline-flex items-center gap-0.5 text-[11px] font-semibold ${isPositive ? 'text-emerald-600' : 'text-red-500'}`}>
            {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {isPositive ? '+' : ''}{value}%{suffix ? ` ${suffix}` : ''}
        </span>
    );
};

const DashboardTab = ({ setActiveTab, currentUser }) => {
    const { data: session } = useSession();
    const [stats, setStats] = useState(null);
    const [recentClients, setRecentClients] = useState([]);
    const [recentActivities, setRecentActivities] = useState([]);
    const [managers, setManagers] = useState([]);
    const [revenueByPlan, setRevenueByPlan] = useState([]);
    const [topClients, setTopClients] = useState([]);
    const [trendData, setTrendData] = useState([]);
    const [churnRate, setChurnRate] = useState(0);
    const [loading, setLoading] = useState(true);
    const [unassignedClientsCount, setUnassignedClientsCount] = useState(0);
    const [emptyManagersCount, setEmptyManagersCount] = useState(0);
    const [isLogsOpen, setIsLogsOpen] = useState(false);
    const [allLogs, setAllLogs] = useState([]);
    const [loadingLogs, setLoadingLogs] = useState(false);

    // Filter States
    const [filterPeriod, setFilterPeriod] = useState("monthly"); // weekly, monthly, yearly, custom
    const [customType, setCustomType] = useState("year_month"); // year_month, date_range
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [dateRange, setDateRange] = useState({ from: "", to: "" });
    const [availableYears, setAvailableYears] = useState([new Date().getFullYear()]);

    useEffect(() => {
        async function loadData() {
            setLoading(true);
            try {
                let startDate = null;
                let endDate = null;
                let groupBy = 'month';
                const now = new Date();

                if (filterPeriod === 'weekly') {
                    const d = new Date(now);
                    const day = d.getDay();
                    const diff = d.getDate() - day; // Start week on Sunday
                    startDate = new Date(d.setDate(diff));
                    startDate.setHours(0, 0, 0, 0);
                    endDate = new Date(startDate);
                    endDate.setDate(startDate.getDate() + 6);
                    endDate.setHours(23, 59, 59, 999);
                    groupBy = 'day';
                } else if (filterPeriod === 'monthly') {
                    // Logic to make "Monthly" button always show current month
                    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                    endDate.setHours(23, 59, 59, 999);
                    groupBy = 'week';
                } else if (filterPeriod === 'yearly') {
                    startDate = new Date(now.getFullYear(), 0, 1);
                    endDate = new Date(now.getFullYear(), 11, 31);
                    endDate.setHours(23, 59, 59, 999);
                    groupBy = 'month';
                } else if (filterPeriod === 'custom') {
                    if (customType === 'year_month') {
                        if (selectedMonth === -1) {
                            startDate = new Date(selectedYear, 0, 1);
                            endDate = new Date(selectedYear, 11, 31);
                            endDate.setHours(23, 59, 59, 999);
                            groupBy = 'month';
                        } else {
                            startDate = new Date(selectedYear, selectedMonth, 1);
                            endDate = new Date(selectedYear, selectedMonth + 1, 0);
                            endDate.setHours(23, 59, 59, 999);
                            groupBy = 'week';
                        }
                    } else { // date_range
                        if (dateRange.from) {
                            startDate = new Date(dateRange.from);
                            startDate.setHours(0, 0, 0, 0);
                            if (dateRange.to) {
                                endDate = new Date(dateRange.to);
                                endDate.setHours(23, 59, 59, 999);
                            } else {
                                endDate = new Date(startDate);
                                endDate.setHours(23, 59, 59, 999);
                            }
                            const diffDays = Math.ceil(Math.abs(endDate - startDate) / (1000 * 60 * 60 * 24));
                            if (diffDays <= 31) groupBy = 'day';
                            else if (diffDays <= 90) groupBy = 'week';
                            else groupBy = 'month';
                        } else {
                            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                            groupBy = 'week';
                        }
                    }
                }

                const [dashboardData, clientsData, allClientsData, adminsData, salesData] = await Promise.all([
                    getDashboardStats({ startDate, endDate }),
                    getUsers({ role: 'client', limit: 5 }),
                    getUsers({ role: 'client', limit: 2000 }),
                    getAdmins({ startDate, endDate }),
                    getSalesAnalytics({ startDate, endDate, groupBy })
                ]);

                if (dashboardData) {
                    // Sync revenue from salesData for consistency
                    if (salesData) {
                        const syncedStats = {
                            ...dashboardData,
                            totalRevenue: salesData.totalRevenue,
                            revenue: `₹${salesData.totalRevenue.toLocaleString('en-IN')}`
                        };
                        setStats(syncedStats);
                    } else {
                        setStats(dashboardData);
                    }
                    setRecentActivities(dashboardData.recentActivities || []);
                }

                if (clientsData) setRecentClients(clientsData.users);

                if (allClientsData && allClientsData.users) {
                    const unassigned = allClientsData.users.filter(c => !c.manager || c.manager === 'Unassigned' || c.manager === 'unassigned').length;
                    setUnassignedClientsCount(unassigned);
                }

                if (salesData) {
                    setRevenueByPlan(salesData.revenueByPlan || []);
                    setTopClients(salesData.topClients || []);
                    setChurnRate(salesData.churnRate || 0);

                    // Fill missing dates in trend data
                    let filledTrend = [];
                    const beTrend = salesData.trend || [];

                    if (groupBy === 'month') {
                        let cur = new Date((startDate || new Date(now.getFullYear(), 0, 1)).getTime());
                        let end = new Date((endDate || new Date(now.getFullYear(), 11, 31)).getTime());
                        while (cur <= end) {
                            const label = cur.toLocaleString('default', { month: 'short', year: 'numeric' });
                            const existing = beTrend.find(t => t.label === label);
                            filledTrend.push(existing || { label, revenue: 0, sortKey: cur.getTime() });
                            cur.setMonth(cur.getMonth() + 1);
                        }
                    } else if (groupBy === 'week') {
                        let cur = new Date((startDate || new Date(now.getFullYear(), now.getMonth(), 1)).getTime());
                        let end = new Date((endDate || new Date(now.getFullYear(), now.getMonth() + 1, 0)).getTime());
                        const day = cur.getDay();
                        const diff = cur.getDate() - day; // Start week on Sunday
                        cur.setDate(diff);
                        cur.setHours(0, 0, 0, 0);
                        while (cur <= end) {
                            const weekNo = getWeekNumber(cur);
                            const searchLabel = `Week ${cur.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}`;
                            const label = `Week ${weekNo} (${cur.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })})`;
                            const existing = beTrend.find(t => t.label === searchLabel || t.label === label);
                            filledTrend.push({ label, revenue: existing ? existing.revenue : 0, sortKey: cur.getTime() });
                            cur.setDate(cur.getDate() + 7);
                        }
                    } else if (groupBy === 'day') {
                        let cur = new Date((startDate || now).getTime());
                        let end = new Date((endDate || now).getTime());
                        cur.setHours(0, 0, 0, 0);
                        end.setHours(23, 59, 59, 999);
                        while (cur <= end) {
                            const label = cur.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
                            const existing = beTrend.find(t => t.label === label);
                            filledTrend.push(existing || { label, revenue: 0, sortKey: cur.getTime() });
                            cur.setDate(cur.getDate() + 1);
                        }
                    }

                    // For extremely large date ranges grouped by day, cap it to avoid UI freezes
                    if (filledTrend.length > 365) filledTrend = filledTrend.slice(0, 365);

                    setTrendData(filledTrend);

                    if (salesData.availableYears && salesData.availableYears.length > 0) {
                        setAvailableYears(salesData.availableYears);
                    }
                }

                if (adminsData) {
                    const adminsList = Array.isArray(adminsData) ? adminsData : (adminsData.users || []);
                    const emptyManagers = adminsList.filter(a => !a.clientsCount || a.clientsCount === 0).length;
                    setEmptyManagersCount(emptyManagers);

                    const managerStats = adminsList
                        .filter(admin => admin.adminRole && (admin.adminRole.includes("Manager") || admin.adminRole.includes("Lead")))
                        .map(admin => ({
                            name: admin.name,
                            clients: admin.clientsCount || 0,
                            activeTasks: admin.performance?.activeTasks || 0,
                            completed: admin.performance?.completedTasks || 0
                        }))
                        .sort((a, b) => b.clients - a.clients)
                        .slice(0, 3);
                    setManagers(managerStats);
                }

            } catch (error) {
                console.error("Error loading dashboard data:", error);
            } finally {
                setLoading(false);
            }
        }

        // Use timeout to debounce rapid date input changes
        const timeoutId = setTimeout(() => {
            loadData();
        }, 300);
        return () => clearTimeout(timeoutId);

    }, [filterPeriod, customType, selectedYear, selectedMonth, dateRange.from, dateRange.to]);

    const handleViewAllLogs = async () => {
        setIsLogsOpen(true);
        setLoadingLogs(true);
        try {
            const logs = await getActivityLogs('24h');
            setAllLogs(logs);
        } catch (error) {
            console.error("Error fetching activity logs:", error);
        } finally {
            setLoadingLogs(false);
        }
    };

    const periodLabel = getPeriodLabel(filterPeriod, { customType, selectedYear, selectedMonth, dateRange });
    const prevLabel = getPrevPeriodLabel(filterPeriod);

    return (
        <div className="space-y-6">
            {/* Welcome Banner */}
            <div className="bg-primary text-primary-foreground rounded-xl p-6 md:p-8 shadow-lg relative overflow-hidden">
                <div className="relative z-10">
                    <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-6 mb-6">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold mb-2 capitalize">Welcome back, {currentUser?.name || session?.user?.name || "Super Admin"}!</h1>
                            <p className="text-primary-foreground/90 font-medium text-sm">{currentUser?.email || session?.user?.email}</p>
                            <div className="flex flex-col gap-1 mt-4 mb-4">
                                <p className="text-primary-foreground/90 max-w-md text-sm md:text-base">The system is running smoothly. View your performance data below.</p>
                            </div>
                        </div>

                        {/* Filters Container */}
                        <div className="flex flex-col gap-3 self-start xl:self-end w-full xl:w-auto mt-2 xl:mt-0 relative z-20">
                            {/* Preset Buttons */}
                            <div className="flex flex-wrap items-center bg-white/10 p-1 rounded-lg backdrop-blur-sm self-start xl:self-end">
                                <button onClick={() => setFilterPeriod('weekly')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${filterPeriod === 'weekly' ? 'bg-white text-primary shadow-sm' : 'text-white/80 hover:text-white hover:bg-white/5'}`}>Weekly</button>
                                <button onClick={() => setFilterPeriod('monthly')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${filterPeriod === 'monthly' ? 'bg-white text-primary shadow-sm' : 'text-white/80 hover:text-white hover:bg-white/5'}`}>Monthly</button>
                                <button onClick={() => setFilterPeriod('yearly')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${filterPeriod === 'yearly' ? 'bg-white text-primary shadow-sm' : 'text-white/80 hover:text-white hover:bg-white/5'}`}>Yearly</button>
                                <button onClick={() => setFilterPeriod('custom')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-1.5 ${filterPeriod === 'custom' ? 'bg-white text-primary shadow-sm' : 'text-white/80 hover:text-white hover:bg-white/5'}`}>
                                    <Filter className="h-3.5 w-3.5" /> Custom
                                </button>
                            </div>

                            {/* Custom Options */}
                            {filterPeriod === 'custom' && (
                                <div className="flex flex-wrap items-center gap-3 bg-white/10 p-2 rounded-lg backdrop-blur-sm self-start xl:self-end animate-in fade-in slide-in-from-top-2">
                                    <select
                                        value={customType}
                                        onChange={e => setCustomType(e.target.value)}
                                        className="bg-primary hover:bg-primary/90 text-white border border-white/30 rounded-md px-3 py-1.5 text-sm outline-none cursor-pointer transition-colors"
                                    >
                                        <option value="year_month" className="text-black">Year / Month</option>
                                        <option value="date_range" className="text-black">Date Range</option>
                                    </select>

                                    {customType === 'year_month' ? (
                                        <div className="flex items-center gap-2">
                                            <select
                                                value={selectedYear}
                                                onChange={e => setSelectedYear(Number(e.target.value))}
                                                className="bg-primary hover:bg-primary/90 text-white border border-white/30 rounded-md px-3 py-1.5 text-sm outline-none cursor-pointer transition-colors"
                                            >
                                                {availableYears.map(y => <option key={y} value={y} className="text-black">{y}</option>)}
                                            </select>

                                            <select
                                                value={selectedMonth}
                                                onChange={e => setSelectedMonth(Number(e.target.value))}
                                                className="bg-primary hover:bg-primary/90 text-white border border-white/30 rounded-md px-3 py-1.5 text-sm outline-none cursor-pointer transition-colors"
                                            >
                                                <option value={-1} className="text-black font-semibold">ALL YEAR</option>
                                                {Array.from({ length: 12 }).map((_, i) => (
                                                    <option key={i} value={i} className="text-black">{new Date(2000, i, 1).toLocaleString('default', { month: 'long' })}</option>
                                                ))}
                                            </select>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="date"
                                                value={dateRange.from}
                                                onChange={e => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                                                className="bg-primary/50 text-white border border-white/30 rounded-md px-2 py-1.5 text-sm outline-none cursor-text [color-scheme:dark]"
                                            />
                                            <span className="text-white/70 text-xs font-medium">TO</span>
                                            <input
                                                type="date"
                                                value={dateRange.to}
                                                onChange={e => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                                                className="bg-primary/50 text-white border border-white/30 rounded-md px-2 py-1.5 text-sm outline-none cursor-text [color-scheme:dark]"
                                            />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-3 mt-4">
                        <Badge variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-none py-1.5 px-4 text-sm font-medium">
                            {unassignedClientsCount} Unassigned Clients
                        </Badge>
                        <Badge variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-none py-1.5 px-4 text-sm font-medium">
                            {emptyManagersCount} Managers with 0 Clients
                        </Badge>
                        {stats?.pendingInvoices > 0 && (
                            <Badge variant="secondary" className="bg-yellow-500/80 hover:bg-yellow-500 text-white border-none py-1.5 px-4 text-sm font-medium">
                                {stats.pendingInvoices} Pending Invoices
                            </Badge>
                        )}
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="h-64 flex flex-col items-center justify-center bg-card rounded-xl border">
                    <Loader2 className="h-8 w-8 text-primary animate-spin mb-3" />
                    <p className="text-muted-foreground font-medium">Fetching analytics...</p>
                </div>
            ) : (
                <>
                    {/* Primary Stats Cards */}
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Total Revenue */}
                        <div className="p-5 md:p-6 rounded-xl bg-card border shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">Revenue</p>
                                    <p className="text-2xl font-heading font-bold">{stats?.revenue || "₹0"}</p>
                                    <div className="flex items-center gap-2 mt-1.5">
                                        <ChangeBadge value={stats?.revenueChange} />
                                        <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">{prevLabel}</span>
                                    </div>
                                </div>
                                <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0 shadow-sm group-hover:scale-110 transition-transform">
                                    <IndianRupee className="h-6 w-6" />
                                </div>
                            </div>
                        </div>

                        {/* New Clients */}
                        <div className="p-5 md:p-6 rounded-xl bg-card border shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">New Clients</p>
                                    <p className="text-2xl font-heading font-bold">{stats?.newClients || 0}</p>
                                    <div className="flex items-center gap-2 mt-1.5">
                                        <ChangeBadge value={stats?.clientsChange} />
                                        <span className="text-[10px] text-muted-foreground truncate max-w-[100px]">{prevLabel}</span>
                                    </div>
                                </div>
                                <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                                    <UserPlus className="h-5 w-5" />
                                </div>
                            </div>
                        </div>

                        {/* Tasks Completed */}
                        <div className="p-5 md:p-6 rounded-xl bg-card border shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">Completed Tasks</p>
                                    <p className="text-2xl font-heading font-bold">{stats?.completedTasks || 0}</p>
                                    <div className="flex items-center gap-2 mt-1.5">
                                        <ChangeBadge value={stats?.completedChange} />
                                        <span className="text-[10px] text-muted-foreground truncate max-w-[100px]">{prevLabel}</span>
                                    </div>
                                </div>
                                <div className="w-10 h-10 rounded-lg bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-600 shrink-0">
                                    <ListChecks className="h-5 w-5" />
                                </div>
                            </div>
                        </div>

                        {/* Churn Rate */}
                        <div className="p-5 md:p-6 rounded-xl bg-card border shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">Churn Rate</p>
                                    <p className="text-2xl font-heading font-bold">{churnRate.toFixed(1)}%</p>
                                    <div className="flex items-center gap-2 mt-1.5">
                                        <span className={`text-[11px] font-semibold ${churnRate < 5 ? 'text-emerald-600' : churnRate < 15 ? 'text-amber-600' : 'text-red-500'}`}>
                                            {churnRate < 5 ? '● Healthy' : churnRate < 15 ? '● Moderate' : '● Critical'}
                                        </span>
                                    </div>
                                </div>
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border ${churnRate < 5 ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : churnRate < 15 ? 'bg-amber-50 border-amber-100 text-amber-600' : 'bg-red-50 border-red-100 text-red-600'}`}>
                                    <AlertTriangle className="h-5 w-5" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Secondary Stats Row */}
                    <div className="grid grid-cols-2  lg:grid-cols-4 gap-4">
                        <div className="p-4 rounded-xl bg-card border shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                                    <Users className="h-4 w-4" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Total Clients</p>
                                    <p className="text-lg font-bold">{stats?.totalClients || 0}</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-4 rounded-xl bg-card border shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center text-green-600">
                                    <Users className="h-4 w-4" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Active Clients</p>
                                    <p className="text-lg font-bold">{stats?.activeClients || 0}</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-4 rounded-xl bg-card border shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                                    <ListChecks className="h-4 w-4" />
                                </div>
                                <div className="flex flex-col">
                                    <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Total Tasks</p>
                                    <p className="text-lg font-bold">{stats?.totalTasksStats || 0}</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-4 rounded-xl bg-card border shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600">
                                    <Clock className="h-4 w-4" />
                                </div>
                                <div className="flex flex-col">
                                    <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Active Tasks</p>
                                    <p className="text-lg font-bold">{stats?.activeTasks || 0}</p>
                                </div>
                            </div>
                        </div>
                        {/* <div className="p-4 rounded-xl bg-card border shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
                                    <Clock className="h-4 w-4" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Pending Invoices</p>
                                    <p className="text-lg font-bold">{stats?.pendingInvoices || 2}</p>
                                </div>
                            </div>
                        </div> */}
                    </div>

                    {/* Revenue Row */}
                    <div className="grid lg:grid-cols-3 gap-6">
                        {/* Revenue Trend */}
                        <div className="lg:col-span-2 bg-card rounded-xl border p-5 md:p-6 shadow-sm flex flex-col h-full">
                            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                                <h2 className="font-heading font-semibold text-lg flex items-center gap-2">
                                    <BarChart3 className="h-5 w-5 text-primary" />
                                    Revenue Trend
                                </h2>
                                <Badge variant="outline" className="text-xs py-1 px-3 shadow-sm bg-background">
                                    <CalendarDays className="h-3.5 w-3.5 mr-1.5" />
                                    {periodLabel}
                                </Badge>
                            </div>

                            <div className="flex-1 overflow-hidden flex flex-col min-h-[300px]">
                                {trendData.length > 0 ? (
                                    <ScrollArea className="flex-1 w-full pr-4 h-[300px] lg:h-auto">
                                        <div className="space-y-3 pb-2">
                                            {trendData.map((data) => {
                                                const maxRevenue = Math.max(...trendData.map(d => d.revenue), 1);
                                                const barWidth = Math.max((data.revenue / maxRevenue) * 100, 1.5);
                                                return (
                                                    <div key={data.label} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-3 rounded-lg bg-accent/30 border border-accent/20 hover:bg-accent/50 transition-colors">
                                                        <div className="w-full sm:w-28 shrink-0 flex items-center justify-between sm:block">
                                                            <p className="text-sm font-medium truncate">{data.label}</p>
                                                            <p className="font-bold text-primary text-sm sm:hidden block">₹{formatINR(data.revenue)}</p>
                                                        </div>
                                                        <div className="flex-1 w-full">
                                                            <div className="w-full h-2 sm:h-2.5 bg-accent/50 rounded-full overflow-hidden">
                                                                <div
                                                                    className={`h-full rounded-full transition-all duration-700 ease-out ${data.revenue > 0 ? 'bg-primary' : 'bg-transparent'}`}
                                                                    style={{ width: `${barWidth}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="w-28 text-right shrink-0 hidden sm:block">
                                                            <p className="font-bold text-primary text-sm">₹{formatINR(data.revenue)}</p>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </ScrollArea>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-10 text-muted-foreground h-full bg-accent/10 rounded-lg border border-dashed border-accent/30">
                                        <BarChart3 className="h-10 w-10 opacity-20 mb-3" />
                                        <p className="text-sm font-medium">No revenue data for {periodLabel}</p>
                                    </div>
                                )}
                            </div>

                            {trendData.length > 0 && (
                                <div className="pt-4 border-t mt-4 bg-background z-10">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground font-medium">Total Period Revenue</span>
                                        <span className="font-bold text-primary text-xl">₹{formatINR(trendData.reduce((s, d) => s + d.revenue, 0))}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Revenue by Plan */}
                        <div className="bg-card rounded-xl border shadow-sm p-5 md:p-6">
                            <h2 className="font-heading font-semibold mb-6 flex items-center gap-2 text-lg">
                                Revenue by Plan
                            </h2>
                            <div className="space-y-6">
                                {revenueByPlan.length > 0 ? revenueByPlan.map((plan) => (
                                    <div key={plan.name} className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Badge variant={
                                                    plan.name === 'Platinum' ? 'default' :
                                                        plan.name === 'Premium' ? 'secondary' :
                                                            plan.name === 'Elite' ? 'default' :
                                                                plan.name === 'Within 2 Hours' ? 'destructive' : 'outline'
                                                } className="text-[10px] px-2 py-0.5 shadow-sm">
                                                    {plan.name}
                                                </Badge>
                                                <span className="text-xs text-muted-foreground font-medium">{plan.count} {plan.name === 'Add-on Services' || plan.name === 'Within 2 Hours' ? 'sales' : 'active users'}</span>
                                            </div>
                                            <span className="text-sm font-bold">₹{formatINR(plan.revenue)}</span>
                                        </div>
                                        <div className="w-full h-2 bg-accent/50 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-primary transition-all duration-500"
                                                style={{ width: `${(plan.revenue / (revenueByPlan.reduce((s, p) => s + p.revenue, 0) || 1)) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                )) : (
                                    <div className="text-center py-10 bg-accent/10 rounded-lg border border-dashed border-accent/30">
                                        <p className="text-sm text-muted-foreground font-medium">No plan data for {periodLabel}</p>
                                    </div>
                                )}

                                <div className="pt-4 border-t mt-4">
                                    <div className="flex items-center justify-between font-bold">
                                        <span className="text-muted-foreground">Total Revenue</span>
                                        <span className="text-primary text-lg">₹{formatINR(revenueByPlan.reduce((s, p) => s + p.revenue, 0))}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Clients Row */}
                    <div className="grid lg:grid-cols-2 gap-6">
                        {/* Top Clients by Revenue */}
                        <div className="bg-card rounded-xl border shadow-sm overflow-hidden flex flex-col">
                            <div className="p-4 border-b flex items-center justify-between bg-primary/5">
                                <h2 className="font-heading font-semibold flex items-center gap-2">
                                    <IndianRupee className="h-5 w-5 text-primary" />
                                    Top Clients
                                </h2>
                                <Badge variant="outline" className="text-[10px] bg-background">{periodLabel}</Badge>
                            </div>
                            <div className="flex-1">
                                <Table>
                                    <TableHeader className="bg-muted/30">
                                        <TableRow className="hover:bg-transparent">
                                            <TableHead className="text-xs font-semibold uppercase py-3">Client</TableHead>
                                            <TableHead className="text-xs font-semibold uppercase py-3">Plan</TableHead>
                                            <TableHead className="text-xs font-semibold uppercase py-3 text-right">Revenue</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {topClients.length > 0 ? topClients.slice(0, 5).map((client, idx) => (
                                            <TableRow key={client._id} className="hover:bg-accent/20 transition-colors">
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-[10px] shadow-sm">
                                                            {idx + 1}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="font-medium text-sm capitalize">{client.name}</span>
                                                            <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">{client.company || "Personal"}</span>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={client.plan === "Platinum" ? "default" : client.plan === "Premium" ? "secondary" : "outline"} className="text-[10px] px-1.5 py-0 bg-background shadow-sm">
                                                        {client.plan || "N/A"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right text-sm font-bold text-primary">
                                                    ₹{client.revenue.toLocaleString('en-IN')}
                                                </TableCell>
                                            </TableRow>
                                        )) : (
                                            <TableRow>
                                                <TableCell colSpan={3} className="text-center py-10 text-muted-foreground italic text-sm">No revenue data for {periodLabel}</TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>

                        {/* Recently Joined Clients */}
                        <div className="bg-card rounded-xl border shadow-sm overflow-hidden flex flex-col">
                            <div className="p-4 border-b flex items-center justify-between">
                                <h2 className="font-heading font-semibold flex items-center gap-2">
                                    <UserPlus className="h-5 w-5 text-primary" />
                                    Recently Joined Clients
                                </h2>
                                <button onClick={() => setActiveTab("Clients")} className="text-sm text-primary hover:underline font-medium">View All</button>
                            </div>
                            <div className="flex-1">
                                <Table>
                                    <TableHeader className="bg-muted/30">
                                        <TableRow className="hover:bg-transparent">
                                            <TableHead className="text-xs font-semibold uppercase py-3">Client</TableHead>
                                            <TableHead className="text-xs font-semibold uppercase py-3">Plan</TableHead>
                                            <TableHead className="text-xs font-semibold uppercase py-3">Status</TableHead>
                                            <TableHead className="text-xs font-semibold uppercase py-3 text-right">Joined</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {recentClients.length > 0 ? recentClients.map((client) => (
                                            <TableRow key={client._id} className="hover:bg-accent/20 transition-colors">
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-sm capitalize">{client.name}</span>
                                                        <span className="text-[10px] text-muted-foreground capitalize truncate max-w-[120px]">{client.company || "Personal"}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-background shadow-sm">
                                                        {client.plan || "N/A"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-1.5">
                                                        <div className={`w-1.5 h-1.5 rounded-full ${client.status === "active" ? "bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]" : "bg-gray-300"}`} />
                                                        <span className="text-[10px] capitalize font-medium">{client.status}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right text-[11px] text-muted-foreground font-medium">
                                                    {new Date(client.joinedDate || client.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                                                </TableCell>
                                            </TableRow>
                                        )) : (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center py-10 text-muted-foreground italic text-sm">No recent clients found</TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    </div>

                    {/* Performance Row */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Top Performing Managers */}
                        <div className="bg-card rounded-xl border shadow-sm p-6">
                            <h2 className="font-heading font-semibold mb-6 flex items-center gap-2">
                                <Users className="h-5 w-5 text-primary" />
                                Top Managers
                            </h2>
                            <div className="space-y-4">
                                {managers.length > 0 ? managers.map((manager) => (
                                    <div key={manager.name} className="flex items-center justify-between p-3 rounded-xl bg-accent/20 border border-accent/10 hover:bg-accent/40 transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-sm uppercase shadow-sm">
                                                {manager.name.split(' ').map(n => n[0]).join('')}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-sm capitalize">{manager.name}</p>
                                                <p className="text-[11px] text-muted-foreground">{manager.clients} Clients assigned</p>
                                            </div>
                                        </div>
                                        <div className="text-right flex flex-col items-end">
                                            <p className="text-sm font-bold text-primary">{manager.completed}</p>
                                            <p className="text-[10px] text-muted-foreground font-medium uppercase">Tasks Done</p>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="flex flex-col items-center justify-center py-6 text-muted-foreground bg-accent/5 rounded-xl border border-dashed border-accent/20">
                                        <Users className="h-8 w-8 opacity-20 mb-2" />
                                        <p className="text-sm font-medium">No manager performance data</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Recent System Activities */}
                        <div className="lg:col-span-2 bg-card rounded-xl border shadow-sm p-6 flex flex-col h-full">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="font-heading font-semibold text-lg flex items-center gap-2">
                                    <Activity className="h-5 w-5 text-primary" />
                                    Recent System Activities
                                </h2>
                            </div>

                            <div className="space-y-3 flex-1">
                                {recentActivities.length > 0 ? recentActivities.slice(0, 5).map((activity, idx) => (
                                    <div key={activity._id || idx} className="flex gap-4 p-3 rounded-xl hover:bg-accent/40 transition-colors border border-transparent hover:border-accent/50 cursor-default">
                                        <div className="mt-1 w-9 h-9 rounded-full bg-accent flex items-center justify-center shrink-0 border border-accent">
                                            {getActivityIcon(activity.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2 mb-1">
                                                <p className="text-sm font-semibold truncate">{activity.action}</p>
                                                <span className="text-[11px] font-medium text-muted-foreground whitespace-nowrap bg-muted/50 px-2 py-0.5 rounded-full">
                                                    {new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <p className="text-xs text-muted-foreground truncate">{activity.details || `Performed by ${activity.user?.name}`}</p>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="flex flex-col items-center justify-center py-10 text-muted-foreground h-full bg-accent/5 rounded-xl border border-dashed border-accent/20">
                                        <Activity className="h-10 w-10 opacity-20 mb-3" />
                                        <p className="text-sm font-medium">No recent activities found.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default DashboardTab;
