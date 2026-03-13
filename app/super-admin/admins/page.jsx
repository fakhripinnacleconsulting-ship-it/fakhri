"use client";

import { useState, useEffect } from "react";
import { Plus, MoreVertical, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, } from "@/components/ui/dropdown-menu";
import { getUsers } from "@/lib/actions/user";

const SuperAdminAdmins = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAdmins = async () => {
      setLoading(true);
      try {
        const { users } = await getUsers({ role: 'admin' });
        setAdmins(users || []);
      } catch (error) {
        console.error("Error loading admins:", error);
      } finally {
        setLoading(false);
      }
    };
    loadAdmins();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">Loading admins...</p>
      </div>
    );
  }

  return (<div className="space-y-6">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="font-heading text-2xl font-bold mb-2">Admin Users</h1>
        <p className="text-muted-foreground">Manage account managers and their access.</p>
      </div>
      <Button>
        <Plus className="h-4 w-4 mr-2" />
        Add Admin
      </Button>
    </div>

    {/* Admin Table */}
    <div className="bg-card rounded-xl border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Admin</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Team</TableHead>
            <TableHead>Clients</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {admins.length > 0 ? admins.map((admin) => (<TableRow key={admin._id}>
            <TableCell>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                  {admin.name?.split(' ').map(n => n[0]).join('') || "AD"}
                </div>
                <div>
                  <p className="font-medium">{admin.name}</p>
                  <p className="text-xs text-muted-foreground">{admin.email}</p>
                </div>
              </div>
            </TableCell>
            <TableCell>
              <Badge variant={admin.role === "Senior Manager" || admin.role === "Team Lead" ? "default" : "secondary"}>
                {admin.adminRole || admin.role}
              </Badge>
            </TableCell>
            <TableCell className="text-muted-foreground">{admin.teamName || admin.team || "N/A"}</TableCell>
            <TableCell>{admin.clientsCount || 0}</TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <Switch defaultChecked={admin.status === "active"} />
                <span className="text-sm text-muted-foreground">
                  {admin.status === "active" ? "Active" : "Disabled"}
                </span>
              </div>
            </TableCell>
            <TableCell className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>View Details</DropdownMenuItem>
                  <DropdownMenuItem>Edit</DropdownMenuItem>
                  <DropdownMenuItem>Change Team</DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive">Remove</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>)) : (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                No admin users found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  </div>);
};
export default SuperAdminAdmins;

