"use client";
import { Plus, Eye, Upload, Edit, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import StatusBadge from "@/components/dashboard/StatusBadge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
const tasks = [
  { id: 1, title: "PPC Campaign Setup", client: "John Doe", manager: "Sarah Mitchell", service: "PPC Management", priority: "High", status: "In Progress", eta: "Jan 25, 2026", lastUpdated: "2 hours ago" },
  { id: 2, title: "A+ Content Design", client: "Emily Smith", manager: "Sarah Mitchell", service: "A+ Content", priority: "Medium", status: "In Progress", eta: "Jan 28, 2026", lastUpdated: "5 hours ago" },
  { id: 3, title: "Brand Registry", client: "Michael Brown", manager: "Sarah Mitchell", service: "Brand Registry", priority: "High", status: "Under Review", eta: "Feb 1, 2026", lastUpdated: "1 day ago" },
  { id: 4, title: "Listing Optimization", client: "Robert Kim", manager: "John Anderson", service: "Catalog", priority: "Low", status: "Completed", eta: "Jan 20, 2026", lastUpdated: "2 days ago" },
  { id: 5, title: "Account Audit", client: "Amanda White", manager: "Emma Wilson", service: "Account Management", priority: "Medium", status: "Completed", eta: "Jan 18, 2026", lastUpdated: "4 days ago" },
];
const SuperAdminTasks = () => {
  return (<div className="space-y-6">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="font-heading text-2xl font-bold mb-2">Tasks</h1>
        <p className="text-muted-foreground">View and manage all tasks across the platform.</p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline">
          <Upload className="h-4 w-4 mr-2" />
          Upload Deliverable
        </Button>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Task
        </Button>
      </div>
    </div>

    {/* Filters */}
    <div className="flex flex-wrap gap-3">
      <Input placeholder="Search tasks..." className="w-[250px]" />
      <Select defaultValue="all">
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="In Progress">In Progress</SelectItem>
          <SelectItem value="Under Review">Under Review</SelectItem>
          <SelectItem value="Completed">Completed</SelectItem>
          <SelectItem value="Cancelled">Cancelled</SelectItem>
        </SelectContent>
      </Select>
      <Select defaultValue="all">
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Manager" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Managers</SelectItem>
          <SelectItem value="sarah">Sarah Mitchell</SelectItem>
          <SelectItem value="john">John Anderson</SelectItem>
          <SelectItem value="emma">Emma Wilson</SelectItem>
        </SelectContent>
      </Select>
      <Select defaultValue="all">
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Priority" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Priority</SelectItem>
          <SelectItem value="high">High</SelectItem>
          <SelectItem value="medium">Medium</SelectItem>
          <SelectItem value="low">Low</SelectItem>
        </SelectContent>
      </Select>
    </div>

    {/* Tasks Table */}
    <div className="bg-card rounded-xl border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Task</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Manager</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>ETA</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => (<TableRow key={task.id}>
            <TableCell>
              <div>
                <p className="font-medium">{task.title}</p>
                <p className="text-xs text-muted-foreground">{task.service}</p>
              </div>
            </TableCell>
            <TableCell>{task.client}</TableCell>
            <TableCell className="text-muted-foreground">{task.manager}</TableCell>
            <TableCell>
              <Badge variant={task.priority === "High" ? "destructive" : task.priority === "Medium" ? "secondary" : "outline"}>
                {task.priority}
              </Badge>
            </TableCell>
            <TableCell>
              <StatusBadge status={task.status} />
            </TableCell>
            <TableCell>
              <div>
                <p className="text-sm">{task.eta}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {task.lastUpdated}
                </p>
              </div>
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-1">
                <Button variant="ghost" size="sm">
                  <Eye className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>))}
        </TableBody>
      </Table>
    </div>

    {/* Audit Log Preview */}
    <div className="bg-card rounded-xl border p-6">
      <h3 className="font-heading font-semibold mb-4">Recent Activity</h3>
      <div className="space-y-3">
        {[
          { action: "Task completed", user: "Sarah Mitchell", task: "Listing Optimization", time: "2 hours ago" },
          { action: "Status updated", user: "John Anderson", task: "PPC Campaign Setup", time: "5 hours ago" },
          { action: "File uploaded", user: "Emma Wilson", task: "Account Audit", time: "1 day ago" },
        ].map((log, i) => (<div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-medium">
              {log.user.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <p className="text-sm"><span className="font-medium">{log.user}</span> - {log.action}</p>
              <p className="text-xs text-muted-foreground">{log.task}</p>
            </div>
          </div>
          <span className="text-xs text-muted-foreground">{log.time}</span>
        </div>))}
      </div>
    </div>
  </div>);
};
export default SuperAdminTasks;
