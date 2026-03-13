"use client";
import { Plus, Edit, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
const tasks = [
  {
    id: 1,
    title: "PPC Campaign Setup",
    client: "John Doe",
    service: "PPC Management",
    priority: "High",
    status: "In Progress",
    eta: "Jan 25, 2026"
  },
  {
    id: 2,
    title: "A+ Content Design - Product B",
    client: "Emily Smith",
    service: "A+ Content",
    priority: "Medium",
    status: "In Progress",
    eta: "Jan 28, 2026"
  },
  {
    id: 3,
    title: "Brand Registry Application",
    client: "Michael Brown",
    service: "Brand Registry",
    priority: "High",
    status: "Under Review",
    eta: "Feb 1, 2026"
  },
  {
    id: 4,
    title: "Competitor Analysis Report",
    client: "John Doe",
    service: "Account Management",
    priority: "Low",
    status: "Completed",
    eta: "Jan 14, 2026"
  },
  {
    id: 5,
    title: "Listing Optimization",
    client: "Emily Smith",
    service: "Catalog Management",
    priority: "Medium",
    status: "Completed",
    eta: "Jan 12, 2026"
  },
];
const AdminTasks = () => {
  return (<div className="space-y-6">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="font-heading text-2xl font-bold mb-2">Tasks</h1>
        <p className="text-muted-foreground">Manage tasks for your clients.</p>
      </div>
      <Button>
        <Plus className="h-4 w-4 mr-2" />
        Create Task
      </Button>
    </div>

    {/* Filters */}
    <div className="flex flex-wrap gap-3">
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
          <SelectValue placeholder="Client" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Clients</SelectItem>
          <SelectItem value="john">John Doe</SelectItem>
          <SelectItem value="emily">Emily Smith</SelectItem>
          <SelectItem value="michael">Michael Brown</SelectItem>
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
            <TableHead>Service</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>ETA</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => (<TableRow key={task.id}>
            <TableCell className="font-medium">{task.title}</TableCell>
            <TableCell>{task.client}</TableCell>
            <TableCell className="text-muted-foreground">{task.service}</TableCell>
            <TableCell>
              <Badge variant={task.priority === "High" ? "destructive" : task.priority === "Medium" ? "secondary" : "outline"}>
                {task.priority}
              </Badge>
            </TableCell>
            <TableCell>
              <Select defaultValue={task.status}>
                <SelectTrigger className="w-[130px] h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Under Review">Under Review</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </TableCell>
            <TableCell className="text-muted-foreground">{task.eta}</TableCell>
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
  </div>);
};
export default AdminTasks;
