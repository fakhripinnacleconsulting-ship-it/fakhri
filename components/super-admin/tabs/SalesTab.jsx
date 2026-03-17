"use client";
import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Users, IndianRupee, Loader2 } from "lucide-react";
import StatCard from "@/components/dashboard/StatCard";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatINR } from "@/lib/utils";
import DataPagination from "@/components/ui/DataPagination";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { getSalesAnalytics } from "@/lib/actions/invoice";

const SuperAdminSalesTab = () => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);
    const [revenueByPlan, setRevenueByPlan] = useState([]);
    const [topClients, setTopClients] = useState([]);
    const [trendData, setTrendData] = useState([]);
    const [filterPeriod, setFilterPeriod] = useState("all");
    const [summary, setSummary] = useState({
        totalRevenue: 0,
        totalClients: 0,
        avgRevenue: 0,
        churnRate: 0
    });
    const [availableYears, setAvailableYears] = useState([]);

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 9;

    const totalPages = Math.ceil(topClients.length / itemsPerPage);
    const paginatedTopClients = topClients.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    useEffect(() => {
        async function loadData() {
            setLoading(true);
            try {
                let startDate = null;
                let endDate = null;
                let groupBy = 'month';

                const now = new Date();

                if (filterPeriod === 'month') {
                    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                } else if (filterPeriod === 'quarter') {
                    const q = Math.floor(now.getMonth() / 3);
                    startDate = new Date(now.getFullYear(), q * 3, 1);
                    endDate = new Date(now.getFullYear(), (q + 1) * 3, 0);
                    groupBy = 'month';
                } else if (filterPeriod === 'year') {
                    startDate = new Date(now.getFullYear(), 0, 1);
                    endDate = new Date(now.getFullYear(), 11, 31);
                    groupBy = 'month';
                } else if (filterPeriod === 'all') {
                    groupBy = 'year';
                } else {
                    const year = parseInt(filterPeriod);
                    if (!isNaN(year)) {
                        startDate = new Date(year, 0, 1);
                        endDate = new Date(year, 11, 31);
                        groupBy = 'month';
                    }
                }

                const salesData = await getSalesAnalytics({ startDate, endDate, groupBy });

                if (salesData) {
                    setTrendData(salesData.trend || []);
                    setAvailableYears(salesData.availableYears || []);
                    setTopClients(salesData.topClients || []);
                    setRevenueByPlan(salesData.revenueByPlan || []);

                    const totalClients = salesData.topClients?.length || 0;
                    setSummary({
                        totalRevenue: salesData.totalRevenue,
                        totalClients: totalClients,
                        avgRevenue: totalClients > 0 ? salesData.totalRevenue / totalClients : 0,
                        churnRate: salesData.churnRate || 0
                    });
                }
            } catch (error) {
                console.error("Error loading sales data:", error);
                toast.error("Failed to load sales data");
                setTrendData([]);
                setAvailableYears([]);
                setTopClients([]);
                setRevenueByPlan([]);
                setSummary({
                    totalRevenue: 0,
                    totalClients: 0,
                    avgRevenue: 0,
                    churnRate: 0
                });
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [filterPeriod]);

    if (loading) {
        return (
            <div className="h-64 flex flex-col items-center justify-center">
                <Loader2 className="h-8 w-8 text-primary animate-spin mb-2" />
                <p className="text-muted-foreground">Loading sales data...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="font-heading text-2xl font-bold mb-2">Sales & Revenue</h1>
                    <p className="text-muted-foreground">Track revenue and sales performance.</p>
                </div>
                <Select value={filterPeriod} onValueChange={setFilterPeriod}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Period" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="month">This Month</SelectItem>
                        <SelectItem value="quarter">This Quarter</SelectItem>
                        <SelectItem value="year">This Year</SelectItem>
                        <SelectItem value="all">All Time</SelectItem>
                        {availableYears.map(year => (
                            <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <Tabs defaultValue="overview" className="w-full" onValueChange={() => setCurrentPage(1)}>
                <TabsList className="mb-4">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="clients">Top Clients</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                    {/* Stats Grid */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard
                            title="Total Revenue"
                            value={`₹${formatINR(summary.totalRevenue)}`}
                            icon={<IndianRupee className="h-5 w-5" />}
                            trend={{ value: filterPeriod === 'all' ? "All Time" : "For Period", positive: true }}
                        />
                        <StatCard
                            title="Active Clients"
                            value={summary.totalClients.toString()}
                            icon={<Users className="h-5 w-5" />}
                        />
                        <StatCard
                            title="Avg. Revenue per Client"
                            value={`₹${formatINR(summary.avgRevenue)}`}
                            icon={<TrendingUp className="h-5 w-5" />}
                        />
                        <StatCard
                            title="Churn Rate"
                            value={`${summary.churnRate.toFixed(1)}%`}
                            icon={<TrendingDown className="h-5 w-5" />}
                            trend={{ value: "Based on disabled accounts", positive: summary.churnRate < 5 }}
                        />
                    </div>

                    <div className="grid lg:grid-cols-2 gap-6">
                        {/* Revenue by Plan */}
                        <div className="bg-card rounded-xl border p-6">
                            <h2 className="font-heading font-semibold mb-6">Revenue by Plan</h2>
                            <div className="space-y-6">
                                {revenueByPlan.length > 0 ? revenueByPlan.map((plan) => {
                                    const percentage = summary.totalRevenue > 0 ? (plan.revenue / summary.totalRevenue) * 100 : 0;

                                    return (
                                        <div key={plan.name}>
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <Badge variant={
                                                        plan.name === 'Platinum' ? 'default' :
                                                            plan.name === 'Premium' ? 'secondary' :
                                                                plan.name === 'Elite' ? 'default' :
                                                                    plan.name === 'Within 2 Hours' ? 'destructive' :
                                                                        plan.name === 'Add-on Services' ? 'outline' : 'outline'
                                                    }>
                                                        {plan.name}
                                                    </Badge>
                                                    <span className="text-sm text-muted-foreground">{plan.count} {plan.name === 'Add-on Services' || plan.name === 'Within 2 Hours' ? 'sales' : 'clients'}</span>
                                                </div>
                                                <span className="font-semibold">₹{plan.revenue.toLocaleString()}</span>
                                            </div>
                                            <div className="w-full h-3 bg-accent rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full bg-primary`}
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                }) : (
                                    <p className="text-muted-foreground text-center py-10 italic">No plan data available</p>
                                )}
                            </div>
                        </div>

                        {/* Monthly Trend */}
                        <div className="bg-card rounded-xl border p-6">
                            <h2 className="font-heading font-semibold mb-6">Revenue Trend ({filterPeriod === 'all' ? 'Yearly' : 'Monthly'})</h2>
                            <div className="space-y-4">
                                {trendData.length > 0 ? trendData.map((data) => (
                                    <div key={data.label} className="flex items-center justify-between p-4 rounded-lg bg-accent/30">
                                        <div>
                                            <p className="font-medium">{data.label}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold">₹{(data.revenue).toLocaleString()}</p>
                                        </div>
                                    </div>
                                )) : (
                                    <p className="text-muted-foreground text-center py-10 italic">No trend data available</p>
                                )}
                            </div>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="clients">
                    <div className="bg-card rounded-xl border p-6">
                        <h2 className="font-heading font-semibold mb-4">Top Clients by Revenue</h2>
                        <div className="space-y-3">
                            {paginatedTopClients.length > 0 ? paginatedTopClients.map((client, i) => (
                                <div key={client._id} className="flex items-center justify-between py-3 border-b last:border-0">
                                    <div className="flex items-center gap-4">
                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                            {(currentPage - 1) * itemsPerPage + i + 1}
                                        </div>
                                        <div>
                                            <p className="font-medium capitalize">{client.name}</p>
                                            <p className="text-xs text-muted-foreground capitalize">{client.company || "Personal"}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <Badge variant={client.plan === "Platinum" ? "default" : client.plan === "Premium" ? "secondary" : "outline"}>
                                            {client.plan || "N/A"}
                                        </Badge>
                                        <span className="font-semibold text-primary">₹{client.revenue.toLocaleString()}</span>
                                    </div>
                                </div>
                            )) : (
                                <p className="text-muted-foreground text-center py-10 italic">No client data available</p>
                            )}
                        </div>
                    </div>

                    <div className="mt-4">
                        <DataPagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                        />
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default SuperAdminSalesTab;
