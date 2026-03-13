"use client";

import { useState, useEffect } from "react";
import { Plus, Eye, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
import { getUsers } from "@/lib/actions/user";

const SuperAdminClients = () => {
  const [clients, setClients] = useState([]);
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      try {
        const [clientsRes, adminsRes] = await Promise.all([
          getUsers({ role: 'client' }),
          getUsers({ role: 'admin' })
        ]);
        setClients(clientsRes.users || []);
        setManagers(adminsRes.users || []);
      } catch (error) {
        console.error("Error loading clients data:", error);
      } finally {
        setLoading(false);
      }
    };
    loadInitialData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">Loading clients...</p>
      </div>
    );
  }

  return (<div className="space-y-6">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="font-heading text-2xl font-bold mb-2">Clients</h1>
        <p className="text-muted-foreground">Manage all clients and their assignments.</p>
      </div>
      <Button>
        <Plus className="h-4 w-4 mr-2" />
        Add Client
      </Button>
    </div>

    {/* Filters */}
    <div className="flex flex-wrap gap-3">
      <Input placeholder="Search clients..." className="w-[250px]" />
      <Select defaultValue="all">
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Plan" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Plans</SelectItem>
          <SelectItem value="platinum">Platinum</SelectItem>
          <SelectItem value="premium">Premium</SelectItem>
          <SelectItem value="elite">Elite</SelectItem>
        </SelectContent>
      </Select>
      <Select defaultValue="all">
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Manager" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Managers</SelectItem>
          <SelectItem value="unassigned">Unassigned</SelectItem>
          {managers.map((m) => (<SelectItem key={m._id} value={m._id}>{m.name}</SelectItem>))}
        </SelectContent>
      </Select>
    </div>

    {/* Clients Table */}
    <div className="bg-card rounded-xl border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Client</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Plan</TableHead>
            <TableHead>Assigned POC</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.length > 0 ? clients.map((client) => (<TableRow key={client._id}>
            <TableCell>
              <div>
                <p className="font-medium">{client.name}</p>
                <p className="text-xs text-muted-foreground">{client.company || "Personal"}</p>
              </div>
            </TableCell>
            <TableCell className="text-muted-foreground">{client.email}</TableCell>
            <TableCell>
              <Badge variant={client.plan === "Platinum" ? "default" : client.plan === "Premium" ? "secondary" : "outline"}>
                {client.plan || "N/A"}
              </Badge>
            </TableCell>
            <TableCell>
              {!client.managerId ? (<Select>
                <SelectTrigger className="w-[160px] h-8 border-destructive">
                  <SelectValue placeholder="Assign Manager" />
                </SelectTrigger>
                <SelectContent>
                  {managers.map((m) => (<SelectItem key={m._id} value={m._id}>{m.name}</SelectItem>))}
                </SelectContent>
              </Select>) : (<Select defaultValue={client.managerId}>
                <SelectTrigger className="w-[160px] h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {managers.map((m) => (<SelectItem key={m._id} value={m._id}>{m.name}</SelectItem>))}
                </SelectContent>
              </Select>)}
            </TableCell>
            <TableCell>
              <Badge variant={client.status === "active" ? "default" : "outline"}>
                {client.status === "active" ? "Active" : "Pending"}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              <Button variant="ghost" size="sm">
                <Eye className="h-4 w-4" />
              </Button>
            </TableCell>
          </TableRow>)) : (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                No clients found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  </div>);
};
export default SuperAdminClients;

