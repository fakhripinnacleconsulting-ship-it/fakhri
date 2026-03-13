import { cn } from "@/lib/utils";
const StatCard = ({ title, value, icon, trend, className }) => {
    return (<div className={cn("p-6 rounded-xl bg-card border", className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground mb-1">{title}</p>
          <p className="text-2xl font-heading font-bold">{value}</p>
          {trend && (<p className={cn("text-xs mt-1", trend.positive ? "text-green-600" : "text-red-600")}>
              {trend.positive ? "↑" : "↓"} {trend.value}
            </p>)}
        </div>
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          {icon}
        </div>
      </div>
    </div>);
};
export default StatCard;
