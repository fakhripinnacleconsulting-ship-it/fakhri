"use client";
import { Eye } from "lucide-react";
import StatusBadge from "@/components/dashboard/StatusBadge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
const tasks = [
    {
        id: 1,
        title: "Listing Optimization - Product A",
        service: "Catalog Management",
        status: "completed",
        eta: "Jan 20, 2026",
        completedDate: "Jan 19, 2026"
    },
    {
        id: 2,
        title: "PPC Campaign Setup",
        service: "PPC Management",
        status: "in-progress",
        eta: "Jan 25, 2026",
        completedDate: null
    },
    {
        id: 3,
        title: "A+ Content Design - Product B",
        service: "A+ Content",
        status: "in-progress",
        eta: "Jan 28, 2026",
        completedDate: null
    },
    {
        id: 4,
        title: "Brand Registry Application",
        service: "Brand Registry",
        status: "pending",
        eta: "Feb 1, 2026",
        completedDate: null
    },
    {
        id: 5,
        title: "Competitor Analysis Report",
        service: "Account Management",
        status: "completed",
        eta: "Jan 15, 2026",
        completedDate: "Jan 14, 2026"
    },
    {
        id: 6,
        title: "Backend Search Terms Update",
        service: "Catalog Management",
        status: "completed",
        eta: "Jan 12, 2026",
        completedDate: "Jan 12, 2026"
    },
];
const ClientTasks = () => {
    return (<div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold mb-2">Tasks</h1>
        <p className="text-muted-foreground">View the status of all tasks assigned to your account.</p>
      </div>

      {/* Task Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-card border text-center">
          <p className="text-2xl font-heading font-bold text-yellow-600">2</p>
          <p className="text-sm text-muted-foreground">In Progress</p>
        </div>
        <div className="p-4 rounded-xl bg-card border text-center">
          <p className="text-2xl font-heading font-bold text-muted-foreground">1</p>
          <p className="text-sm text-muted-foreground">Pending</p>
        </div>
        <div className="p-4 rounded-xl bg-card border text-center">
          <p className="text-2xl font-heading font-bold text-primary">3</p>
          <p className="text-sm text-muted-foreground">Completed</p>
        </div>
      </div>

      {/* Tasks Table */}
      <div className="bg-card rounded-xl border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Task</TableHead>
              <TableHead>Service</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>ETA</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.map((task) => (<TableRow key={task.id}>
                <TableCell className="font-medium">{task.title}</TableCell>
                <TableCell className="text-muted-foreground">{task.service}</TableCell>
                <TableCell>
                  <StatusBadge status={task.status}/>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {task.completedDate || task.eta}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4 mr-1"/>
                    View
                  </Button>
                </TableCell>
              </TableRow>))}
          </TableBody>
        </Table>
      </div>

      {/* Read-only Notice */}
      <div className="bg-accent/50 rounded-lg p-4 text-center text-sm text-muted-foreground">
        <p>Tasks are managed by your account manager. Contact them for any task-related requests.</p>
      </div>
    </div>);
};
export default ClientTasks;
