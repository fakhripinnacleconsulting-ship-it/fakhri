import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
const statusConfig = {
  completed: { label: "Completed", variant: "default" },
  "in-progress": { label: "In Progress", variant: "secondary" },
  "in progress": { label: "In Progress", variant: "secondary" },
  "under review": { label: "Under Review", variant: "secondary" },
  cancelled: { label: "Cancelled", variant: "outline" },
  pending: { label: "Pending", variant: "outline" },
  "to do": { label: "To Do", variant: "outline" },
  "todo": { label: "To Do", variant: "outline" },
  "in review": { label: "In Review", variant: "secondary" },
  active: { label: "Active", variant: "default" },
  inactive: { label: "Inactive", variant: "outline" },
  paid: { label: "Paid", variant: "default" },
  unpaid: { label: "Unpaid", variant: "destructive" },
  overdue: { label: "Overdue", variant: "destructive" },
};

const StatusBadge = ({ status, className }) => {
  const config = statusConfig[status?.toLowerCase()] || { label: status || "Unknown", variant: "outline" };
  return (
    <Badge variant={config.variant} className={cn(className)}>
      <span className="capitalize">{config.label}</span>
    </Badge>
  );
};
export default StatusBadge;
