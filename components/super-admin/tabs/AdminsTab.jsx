"use client";
import { useState, useEffect } from "react";
import { Plus, MoreVertical, Loader2, Eye, Mail, Phone, Users, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

import { upsertAdmin, deleteAdmin, toggleAdminStatus, getAdmins, getAdminClients } from "@/lib/actions/admin";
import { getTeams } from "@/lib/actions/team";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

import { ScrollableContainer } from "@/components/ui/scrollable-container";
import DataPagination from "@/components/ui/DataPagination";
import { Check, ChevronsUpDown, Search, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMemo } from "react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const CreatableCombobox = ({ value, onChange, options, placeholder, emptyText = "No option found." }) => {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");

    // Case-insensitive check
    const existingOption = options.find(opt => opt.toLowerCase() === (query || value || "").toLowerCase());

    const handleSelect = (currentValue) => {
        // If query matches an existing option (case-insensitive), use the existing option's casing
        // Otherwise use the currentValue (which comes from CommandItem value prop)
        // Actually, CommandItem value is usually lowercase. We should rely on the original option string.
        const originalOption = options.find(opt => opt.toLowerCase() === currentValue.toLowerCase());
        onChange(originalOption || currentValue); // currentValue for new items will be lowercase from Command usually? No, we need to handle creation.
        setOpen(false);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between font-normal px-3"
                >
                    {value || <span className="text-muted-foreground">{placeholder}</span>}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
                <Command shouldFilter={false}>
                    <CommandInput
                        placeholder={placeholder}
                        value={query}
                        onValueChange={setQuery}
                    />
                    <CommandList>
                        <CommandEmpty>
                            <div className="p-2 text-center text-sm text-muted-foreground">
                                {query.trim().length > 0 ? (
                                    <div
                                        className="cursor-pointer hover:underline text-primary"
                                        onClick={() => {
                                            onChange(query); // Set the raw query as the new value
                                            setOpen(false);
                                        }}
                                    >
                                        Create "{query}"
                                    </div>
                                ) : emptyText}
                            </div>
                        </CommandEmpty>
                        <CommandGroup>
                            {options.filter(opt => opt.toLowerCase().includes(query.toLowerCase())).map((option) => (
                                <CommandItem
                                    key={option}
                                    value={option}
                                    onSelect={(currentValue) => {
                                        // currentValue is the value prop of CommandItem (option)
                                        // but Command usually lowercases it?? 
                                        // shadcn CommandItem uses 'value' prop. 
                                        // Let's force use 'option' directly.
                                        onChange(option);
                                        setOpen(false);
                                    }}
                                    className="capitalize"
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === option ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {option}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
};

const SuperAdminAdminsTab = () => {
    const [admins, setAdmins] = useState([]);
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingAdmin, setEditingAdmin] = useState(null);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        adminRole: "Account Manager",
        team: "",
        status: "active",
        password: "",
        permissions: []
    });

    const [searchQuery, setSearchQuery] = useState("");
    const [sortConfig, setSortConfig] = useState({ key: "name", direction: "asc" });

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const [viewingAdmin, setViewingAdmin] = useState(null);
    const [adminClients, setAdminClients] = useState([]);
    const [isLoadingClients, setIsLoadingClients] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);

    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const getSortIcon = (key) => {
        if (sortConfig.key !== key) return <ChevronsUpDown className="ml-2 h-3 w-3 opacity-40 shrink-0" />;
        return sortConfig.direction === 'asc'
            ? <ArrowUp className="ml-2 h-3 w-3 text-primary shrink-0" />
            : <ArrowDown className="ml-2 h-3 w-3 text-primary shrink-0" />;
    };

    const filteredAdmins = useMemo(() => {
        let result = admins.filter(admin =>
            admin.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            admin.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            admin.adminRole?.toLowerCase().includes(searchQuery.toLowerCase())
        );

        if (sortConfig.key) {
            result = [...result].sort((a, b) => {
                let aVal = a[sortConfig.key] || "";
                let bVal = b[sortConfig.key] || "";

                if (typeof aVal === 'string') aVal = aVal.toLowerCase();
                if (typeof bVal === 'string') bVal = bVal.toLowerCase();

                if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return result;
    }, [admins, searchQuery, sortConfig]);

    const totalPages = Math.ceil(filteredAdmins.length / itemsPerPage);
    const paginatedAdmins = filteredAdmins.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const loadData = async () => {
        setLoading(true);
        try {
            const [adminsData, teamsData] = await Promise.all([
                getAdmins(),
                getTeams()
            ]);

            if (adminsData) {
                setAdmins(adminsData);
            }
            if (teamsData) {
                setTeams(teamsData);
            }
        } catch (error) {
            console.error("Error loading data:", error);
            toast.error("Failed to load admin data");
        }
        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleOpenModal = (admin = null) => {
        if (admin) {
            setEditingAdmin(admin);
            setFormData({
                name: admin.name,
                email: admin.email,
                phone: admin.phone || "",
                adminRole: admin.adminRole || "Account Manager",
                team: admin.team || "",
                status: admin.status || "active",
                password: admin.plainPassword || "", // Show retrievable plain password
                permissions: admin.permissions || []
            });
        } else {
            setEditingAdmin(null);
            setFormData({
                name: "",
                email: "",
                phone: "",
                adminRole: "Account Manager",
                team: "",
                status: "active",
                password: "",
                permissions: []
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const data = { ...formData };
            if (editingAdmin) {
                data._id = editingAdmin._id;
                // If editing and password is unchanged from what's currently stored, 
                // don't send it to avoid re-hashing.
                if (data.password === editingAdmin.plainPassword || data.password === editingAdmin.password) {
                    delete data.password;
                }
            } else {
                // For new admins, password might be required
                if (!data.password) {
                    toast.error("Password is required for new admin");
                    setIsSubmitting(false);
                    return;
                }
                // Store plain password for email before hashing on server
                data.password_plain = data.password;
            }

            await upsertAdmin(data);
            toast.success(editingAdmin ? "Admin updated successfully" : "Admin created successfully");
            setIsModalOpen(false);
            loadData();
        } catch (error) {
            console.error("Error saving admin:", error);
            toast.error(error.message || "Failed to save admin");
        }
        setIsSubmitting(false);
    };

    const handleDelete = async (id) => {
        try {
            const result = await deleteAdmin(id);
            if (result.success) {
                toast.success("Admin removed successfully");
                loadData();
            } else {
                toast.error(result.error || "Failed to remove admin");
            }
        } catch (error) {
            console.error("Error deleting admin:", error);
            toast.error("An error occurred while removing admin");
        }
    };

    const handleStatusToggle = async (adminId, currentStatus) => {
        const newStatus = currentStatus === "active" ? "disabled" : "active";
        try {
            await toggleAdminStatus(adminId, newStatus);
            toast.success(`Admin status updated to ${newStatus}`);
            // Optimistic update or reload
            setAdmins(admins.map(a => a._id === adminId ? { ...a, status: newStatus } : a));
        } catch (error) {
            console.error("Error toggling status:", error);
            toast.error("Failed to update status");
        }
    };

    const togglePermission = (perm) => {
        setFormData(prev => ({
            ...prev,
            permissions: prev.permissions.includes(perm)
                ? prev.permissions.filter(p => p !== perm)
                : [...prev.permissions, perm]
        }));
    };

    const handleViewClients = async (admin) => {
        setViewingAdmin(admin);
        setIsViewModalOpen(true);
        setIsLoadingClients(true);
        try {
            const clients = await getAdminClients(admin._id);
            setAdminClients(clients || []);
        } catch (error) {
            console.error("Error loading admin clients:", error);
            toast.error("Failed to load associated clients");
        }
        setIsLoadingClients(false);
    };

    if (loading) {
        return (
            <div className="h-64 flex flex-col items-center justify-center">
                <Loader2 className="h-8 w-8 text-primary animate-spin mb-2" />
                <p className="text-muted-foreground">Loading admin users...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1">
                    <h1 className="font-heading text-2xl font-bold mb-2">Admin Users</h1>
                    <p className="text-muted-foreground">Manage account managers and their access.</p>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search admins..."
                            className="pl-9"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setCurrentPage(1);
                            }}
                        />
                    </div>
                    <Button onClick={() => handleOpenModal()} className="w-full sm:w-auto">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Admin
                    </Button>
                </div>
            </div>

            <div className="bg-card rounded-xl border overflow-hidden shadow-sm flex flex-col h-full min-h-[500px]">
                <ScrollableContainer className="flex-1" maxHeight="60vh">
                    <Table wrapperClassName="overflow-visible">
                        <TableHeader className="sticky top-0 z-10 bg-muted/50 shadow-sm backdrop-blur-sm">
                            <TableRow>
                                <TableHead>
                                    <button onClick={() => handleSort('name')} className="flex items-center hover:text-primary transition-colors font-bold uppercase text-[11px] tracking-wider">
                                        Admin {getSortIcon('name')}
                                    </button>
                                </TableHead>
                                <TableHead>
                                    <button onClick={() => handleSort('adminRole')} className="flex items-center hover:text-primary transition-colors font-bold uppercase text-[11px] tracking-wider">
                                        Role {getSortIcon('adminRole')}
                                    </button>
                                </TableHead>
                                <TableHead>
                                    <button onClick={() => handleSort('team')} className="flex items-center hover:text-primary transition-colors font-bold uppercase text-[11px] tracking-wider">
                                        Team {getSortIcon('team')}
                                    </button>
                                </TableHead>
                                <TableHead>
                                    <button onClick={() => handleSort('clientsCount')} className="flex items-center hover:text-primary transition-colors font-bold uppercase text-[11px] tracking-wider">
                                        Clients {getSortIcon('clientsCount')}
                                    </button>
                                </TableHead>
                                <TableHead>
                                    <button onClick={() => handleSort('status')} className="flex items-center hover:text-primary transition-colors font-bold uppercase text-[11px] tracking-wider">
                                        Status {getSortIcon('status')}
                                    </button>
                                </TableHead>
                                <TableHead className="text-right font-bold uppercase text-[11px] tracking-wider">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedAdmins.length > 0 ? (
                                paginatedAdmins.map((admin) => (
                                    <TableRow key={admin._id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium uppercase">
                                                    {admin.name.split(' ').map(n => n[0]).join('')}
                                                </div>
                                                <div>
                                                    <p className="font-medium capitalize">{admin.name}</p>
                                                    <p className="text-xs text-muted-foreground">{admin.email}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={(admin.adminRole || admin.role) === "Senior Manager" || (admin.adminRole || admin.role) === "Team Lead" ? "default" : "secondary"} className="capitalize">
                                                {admin.adminRole || admin.role}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground capitalize">{admin.teamName || admin.team || "N/A"}</TableCell>
                                        <TableCell>{admin.clientsCount || 0}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Switch
                                                    checked={admin.status === "active"}
                                                    onCheckedChange={() => handleStatusToggle(admin._id, admin.status)}
                                                />
                                                <span className="text-sm text-muted-foreground capitalize">
                                                    {admin.status || "active"}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
                                                    onClick={() => handleViewClients(admin)}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => handleOpenModal(admin)}>Edit</DropdownMenuItem>
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <DropdownMenuItem
                                                                className="text-destructive font-medium"
                                                                onSelect={(e) => e.preventDefault()}
                                                            >
                                                                Remove
                                                            </DropdownMenuItem>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Remove Admin User?</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    Are you sure you want to remove <strong>{admin.name}</strong>? This action will permanently delete their account and access.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                <AlertDialogAction
                                                                    onClick={() => handleDelete(admin._id)}
                                                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                                >
                                                                    Remove
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                                        No admin users found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </ScrollableContainer>
            </div>

            <DataPagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
            />

            {/* View Admin Clients Modal */}
            <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
                <DialogContent className="sm:max-w-[600px] max-h-[85vh] flex flex-col p-0 gap-0">
                    <DialogHeader className="p-6 border-b">
                        <DialogTitle>Admin Profile: {viewingAdmin?.name}</DialogTitle>
                        <DialogDescription>
                            Assigned clients and roles across the system.
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="flex-1 overflow-hidden flex flex-col">
                        <ScrollableContainer className="flex-1">
                            <div className="p-6 pt-4 space-y-6">
                                {/* Admin Details Header Area */}
                                <div className="flex items-start gap-4 p-4 rounded-xl bg-primary/5 border border-primary/10">
                                    <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xl font-bold uppercase shrink-0">
                                        {viewingAdmin?.name?.split(' ').map(n => n[0]).join('')}
                                    </div>
                                    <div className="space-y-1">
                                        <h2 className="text-xl font-bold capitalize leading-tight">{viewingAdmin?.name}</h2>
                                        <div className="flex flex-wrap gap-2 pt-1">
                                            <Badge variant="outline" className="bg-background/50 border-primary/20 text-primary px-2 py-0 h-5 text-[10px] uppercase font-bold tracking-wider">
                                                {viewingAdmin?.adminRole || viewingAdmin?.role || "Manager"}
                                            </Badge>
                                            <Badge variant="outline" className="bg-background/50 border-muted text-muted-foreground px-2 py-0 h-5 text-[10px] uppercase font-bold tracking-wider">
                                                {viewingAdmin?.team || "No Team"}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>

                                {/* Contact & Info Cards */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-3">
                                        <h3 className="font-bold text-[10px] uppercase text-muted-foreground tracking-widest pl-1">Contact Information</h3>
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-3 p-3 rounded-lg border bg-card/30">
                                                <Mail className="h-4 w-4 text-primary opacity-70" />
                                                <div className="overflow-hidden">
                                                    <p className="text-[10px] text-muted-foreground uppercase font-bold leading-none mb-1">Email</p>
                                                    <p className="text-sm truncate font-medium">{viewingAdmin?.email}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 p-3 rounded-lg border bg-card/30">
                                                <Phone className="h-4 w-4 text-primary opacity-70" />
                                                <div>
                                                    <p className="text-[10px] text-muted-foreground uppercase font-bold leading-none mb-1">Phone</p>
                                                    <p className="text-sm font-medium">{viewingAdmin?.phone || "N/A"}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <h3 className="font-bold text-[10px] uppercase text-muted-foreground tracking-widest pl-1">Performance Overview</h3>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="p-3 rounded-lg border bg-card/30 text-center">
                                                <p className="text-2xl font-bold text-primary">{viewingAdmin?.clientsCount || 0}</p>
                                                <p className="text-[9px] text-muted-foreground uppercase font-bold">Clients</p>
                                            </div>
                                            <div className="p-3 rounded-lg border bg-card/30 text-center">
                                                <p className="text-2xl font-bold text-amber-500">{viewingAdmin?.performance?.activeTasks || 0}</p>
                                                <p className="text-[9px] text-muted-foreground uppercase font-bold">Active Tasks</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Shared Clients List */}
                                <div className="space-y-3 pt-2">
                                    <div className="flex items-center justify-between pl-1">
                                        <h3 className="font-bold text-[10px] uppercase text-muted-foreground tracking-widest">Client Access List</h3>
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground italic">
                                            Showing {adminClients.length} unique client assignments
                                        </span>
                                    </div>

                                    {isLoadingClients ? (
                                        <div className="py-12 border rounded-xl border-dashed flex flex-col items-center justify-center">
                                            <Loader2 className="h-6 w-6 text-primary animate-spin mb-2" />
                                            <p className="text-xs text-muted-foreground uppercase font-bold tracking-tighter">Syncing assignments...</p>
                                        </div>
                                    ) : adminClients.length > 0 ? (
                                        <div className="space-y-2">
                                            {adminClients.map((client) => (
                                                <div key={client._id} className="p-3 rounded-xl border bg-card hover:bg-muted/5 transition-colors flex items-center justify-between group">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                                                            <Users className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold leading-none mb-1">{client.name}</p>
                                                            <p className="text-[10px] text-muted-foreground uppercase tracking-tight">{client.company || 'Personal'}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-wrap gap-1 justify-end max-w-[50%]">
                                                        {client.roles.map((role, idx) => (
                                                            <Badge key={idx} variant="outline" className="text-[9px] py-0 px-1.5 h-4 bg-muted/30 border-muted text-muted-foreground whitespace-nowrap">
                                                                {role}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="py-10 border rounded-xl border-dashed border-muted text-center flex flex-col items-center gap-2">
                                            <ShieldCheck className="h-8 w-8 text-muted opacity-20" />
                                            <p className="text-xs text-muted-foreground font-medium">No direct client assignments found for this profile.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </ScrollableContainer>
                    </div>
                    
                    <DialogFooter className="p-4 border-t bg-muted/20">
                        <Button variant="secondary" className="w-full" onClick={() => setIsViewModalOpen(false)}>
                            Close Profile
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Add/Edit Admin Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[450px] max-h-[85vh] flex flex-col p-0 gap-0">
                    <DialogHeader className="p-6 pb-2">
                        <DialogTitle>{editingAdmin ? "Edit Admin" : "Add New Admin"}</DialogTitle>
                        <DialogDescription>
                            Enter the details for the admin account manager.
                        </DialogDescription>
                    </DialogHeader>
                    <ScrollableContainer className="flex-1 p-6 pt-2">
                        <form id="admin-form" onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name</Label>
                                <Input
                                    id="name"
                                    placeholder="John Doe"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="john@example.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    required
                                    disabled={!!editingAdmin}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="text"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone Number</Label>
                                <Input
                                    id="phone"
                                    placeholder="+1 234 567 890"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Role</Label>
                                    <CreatableCombobox
                                        value={formData.adminRole}
                                        onChange={(value) => setFormData({ ...formData, adminRole: value })}
                                        options={[
                                            ...new Set([
                                                "Account Manager",
                                                "Senior Manager",
                                                "Team Lead",
                                                "Sales Head",
                                                ...admins.map(a => a.adminRole || a.role).filter(Boolean)
                                            ])
                                        ].sort()}
                                        placeholder="Select or create role..."
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Team</Label>
                                    <CreatableCombobox
                                        value={formData.team}
                                        onChange={(value) => setFormData({ ...formData, team: value })}
                                        options={[
                                            ...new Set([
                                                ...teams.map(t => t.name),
                                                ...admins.map(a => a.teamName || a.team).filter(Boolean)
                                            ])
                                        ].sort()}
                                        placeholder="Select or create team..."
                                    />
                                </div>
                            </div>

                        </form>
                    </ScrollableContainer>
                    <DialogFooter className="p-6 pt-2 border-t">
                        <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" form="admin-form" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {editingAdmin ? "Save Changes" : "Create Admin"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default SuperAdminAdminsTab;
