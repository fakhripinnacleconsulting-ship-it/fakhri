"use client";
import { CheckCircle2, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
const planFeatures = [
  { name: "Full Account Management", included: true },
  { name: "Advanced PPC Management", included: true },
  { name: "A+ Content Design (3 products)", included: true, used: 2, total: 3 },
  { name: "Brand Registry Support", included: true },
  { name: "Weekly Performance Reports", included: true },
  { name: "Priority Email Support (24h)", included: true },
  { name: "Up to 5 Product Categories", included: true, used: 3, total: 5 },
  { name: "Competitor Analysis", included: true },
  { name: "24/7 Phone Support", included: false },
  { name: "Dedicated Account Manager", included: false },
];
const ClientPlan = () => {
  return (<div className="space-y-6">
    <div>
      <h1 className="font-heading text-2xl font-bold mb-2">My Plan</h1>
      <p className="text-muted-foreground">View your current plan details and included services.</p>
    </div>

    {/* Current Plan Card */}
    <div className="bg-card rounded-xl border overflow-hidden">
      <div className="bg-gradient-primary text-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <Badge className="bg-white/20 text-white mb-2">Current Plan</Badge>
            <h2 className="font-heading text-3xl font-bold">Premium</h2>
            <p className="text-white/80 mt-1">₹20,000 / month</p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 text-yellow-300 mb-2">
              {[1, 2, 3, 4, 5].map((i) => (<Star key={i} className="h-4 w-4 fill-current" />))}
            </div>
            <p className="text-sm text-white/80">Most Popular</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 rounded-lg bg-accent/50">
            <p className="text-sm text-muted-foreground">Start Date</p>
            <p className="font-semibold">Dec 15, 2025</p>
          </div>
          <div className="p-4 rounded-lg bg-accent/50">
            <p className="text-sm text-muted-foreground">Valid Until</p>
            <p className="font-semibold">Mar 15, 2026</p>
          </div>
          <div className="p-4 rounded-lg bg-accent/50">
            <p className="text-sm text-muted-foreground">Days Remaining</p>
            <p className="font-semibold">52 days</p>
          </div>
        </div>

        <h3 className="font-heading font-semibold mb-4">Included Services</h3>
        <div className="space-y-3">
          {planFeatures.map((feature) => (<div key={feature.name} className="flex items-center justify-between py-2 border-b last:border-0">
            <div className="flex items-center gap-3">
              <CheckCircle2 className={`h-4 w-4 ${feature.included ? "text-primary" : "text-muted-foreground"}`} />
              <span className={feature.included ? "" : "text-muted-foreground"}>{feature.name}</span>
            </div>
            {feature.used !== undefined && (<div className="flex items-center gap-2">
              <Progress value={(feature.used / feature.total) * 100} className="w-20 h-2" />
              <span className="text-xs text-muted-foreground">{feature.used}/{feature.total}</span>
            </div>)}
            {!feature.included && (<Badge variant="outline">Platinum Only</Badge>)}
          </div>))}
        </div>
      </div>
    </div>

    {/* Upgrade CTA */}
    <div className="bg-card rounded-xl border p-6 text-center">
      <h3 className="font-heading font-semibold mb-2">Need More Features?</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Upgrade to Platinum for dedicated account manager and 24/7 phone support.
      </p>
      <button className="px-6 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors">
        View Upgrade Options
      </button>
    </div>
  </div>);
};
export default ClientPlan;
