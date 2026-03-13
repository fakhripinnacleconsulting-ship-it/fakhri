"use client";
import { DollarSign, TrendingUp, TrendingDown, Users, IndianRupee } from "lucide-react";
import StatCard from "@/components/dashboard/StatCard";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
const monthlyData = [
  { month: "Jan", revenue: 285000, clients: 156 },
  { month: "Dec", revenue: 241000, clients: 144 },
  { month: "Nov", revenue: 228000, clients: 138 },
  { month: "Oct", revenue: 215000, clients: 132 },
];
const topClients = [
  { name: "TechGadgets Co", plan: "Platinum", revenue: "₹3,60,000", since: "2023" },
  { name: "BeautyBrand Inc", plan: "Platinum", revenue: "₹3,60,000", since: "2024" },
  { name: "Fashion Forward", plan: "Platinum", revenue: "₹3,60,000", since: "2024" },
  { name: "HomeEssentials", plan: "Premium", revenue: "₹2,40,000", since: "2023" },
  { name: "Sports Gear Pro", plan: "Premium", revenue: "₹2,40,000", since: "2024" },
];
const SuperAdminSales = () => {
  return (<div className="space-y-6">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="font-heading text-2xl font-bold mb-2">Sales & Revenue</h1>
        <p className="text-muted-foreground">Track revenue and sales performance.</p>
      </div>
      <Select defaultValue="2026">
        <SelectTrigger className="w-[120px]">
          <SelectValue placeholder="Year" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="2026">2026</SelectItem>
          <SelectItem value="2025">2025</SelectItem>
          <SelectItem value="2024">2024</SelectItem>
        </SelectContent>
      </Select>
    </div>

    {/* Stats Grid */}
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard title="Total Revenue (Jan)" value="₹28.5L" icon={<IndianRupee className="h-5 w-5" />} trend={{ value: "+18.6% vs Dec", positive: true }} />
      <StatCard title="MRR" value="₹28.5L" icon={<TrendingUp className="h-5 w-5" />} />
      <StatCard title="Avg. Revenue per Client" value="₹18,333" icon={<Users className="h-5 w-5" />} />
      <StatCard title="Churn Rate" value="2.1%" icon={<TrendingDown className="h-5 w-5" />} trend={{ value: "-0.3% vs Dec", positive: true }} />
    </div>

    <div className="grid lg:grid-cols-2 gap-6">
      {/* Revenue by Plan */}
      <div className="bg-card rounded-xl border p-6">
        <h2 className="font-heading font-semibold mb-6">Revenue by Plan</h2>
        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Badge>Platinum</Badge>
                <span className="text-sm text-muted-foreground">40 clients</span>
              </div>
              <span className="font-semibold">₹12,00,000</span>
            </div>
            <div className="w-full h-3 bg-accent rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full" style={{ width: '56%' }} />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Premium</Badge>
                <span className="text-sm text-muted-foreground">50 clients</span>
              </div>
              <span className="font-semibold">₹10,00,000</span>
            </div>
            <div className="w-full h-3 bg-accent rounded-full overflow-hidden">
              <div className="h-full bg-primary/70 rounded-full" style={{ width: '35%' }} />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline">Elite</Badge>
                <span className="text-sm text-muted-foreground">66 clients</span>
              </div>
              <span className="font-semibold">₹9,90,000</span>
            </div>
            <div className="w-full h-3 bg-accent rounded-full overflow-hidden">
              <div className="h-full bg-primary/50 rounded-full" style={{ width: '23%' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Trend */}
      <div className="bg-card rounded-xl border p-6">
        <h2 className="font-heading font-semibold mb-6">Monthly Trend</h2>
        <div className="space-y-4">
          {monthlyData.map((data, i) => (<div key={data.month} className="flex items-center justify-between p-4 rounded-lg bg-accent/30">
            <div>
              <p className="font-medium">{data.month} 2026</p>
              <p className="text-sm text-muted-foreground">{data.clients} clients</p>
            </div>
            <div className="text-right">
              <p className="font-semibold">₹{(data.revenue / 1000).toFixed(0)}K</p>
              {i > 0 && (<p className={`text-xs ${monthlyData[i - 1].revenue < data.revenue ? 'text-green-600' : 'text-red-600'}`}>
                {monthlyData[i - 1].revenue < data.revenue ? '↑' : '↓'}
                {Math.abs(((data.revenue - monthlyData[i - 1].revenue) / monthlyData[i - 1].revenue) * 100).toFixed(1)}%
              </p>)}
            </div>
          </div>))}
        </div>
      </div>
    </div>

    {/* Top Clients */}
    <div className="bg-card rounded-xl border p-6">
      <h2 className="font-heading font-semibold mb-4">Top Clients by Revenue</h2>
      <div className="space-y-3">
        {topClients.map((client, i) => (<div key={client.name} className="flex items-center justify-between py-3 border-b last:border-0">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
              {i + 1}
            </div>
            <div>
              <p className="font-medium">{client.name}</p>
              <p className="text-xs text-muted-foreground">Client since {client.since}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant={client.plan === "Platinum" ? "default" : "secondary"}>
              {client.plan}
            </Badge>
            <span className="font-semibold text-primary">{client.revenue}</span>
          </div>
        </div>))}
      </div>
    </div>
  </div>);
};
export default SuperAdminSales;
