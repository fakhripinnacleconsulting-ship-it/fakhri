"use client";
import { useState, useEffect } from "react";
import { Plus, MoreVertical, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

import { upsertAdmin, deleteAdmin, toggleAdminStatus, getAdmins } from "@/lib/actions/admin";
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
                                    <button onClick={() => handleSort('clientCount')} className="flex items-center hover:text-primary transition-colors font-bold uppercase text-[11px] tracking-wider">
                                        Clients {getSortIcon('clientCount')}
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
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm">
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
