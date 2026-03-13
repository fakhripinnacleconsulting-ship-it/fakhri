"use client";
import { useState, useMemo, useEffect } from "react";
import {
    Download, FileText, Image, FileSpreadsheet, Eye, Upload,
    Calendar, X, Loader2, Trash2, CheckCircle2, UserPlus,
    Search, Filter, MoreVertical, File as FileIcon, Users, Link as LinkIcon,
    ArrowUpDown, ArrowUp, ArrowDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getSuperAdminFiles, getClients, getAdmins, uploadFiles, deleteFile } from "@/lib/actions/admin";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter,
    DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { ScrollableContainer } from "@/components/ui/scrollable-container";
import DataPagination from "@/components/ui/DataPagination";
import { cn } from "@/lib/utils";

const getFileIcon = (type) => {
    const fileType = type?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'svg', 'webp'].includes(fileType) || fileType === 'image') {
        return <Image className="h-5 w-5 text-blue-500" />;
    }
    if (['pdf'].includes(fileType)) {
        return <FileText className="h-5 w-5 text-red-500" />;
    }
    if (['xls', 'xlsx', 'csv'].includes(fileType) || fileType === 'excel') {
        return <FileSpreadsheet className="h-5 w-5 text-green-500" />;
    }
    return <FileIcon className="h-5 w-5 text-muted-foreground" />;
};

const getFileTypeLabel = (type) => {
    const fileType = type?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'svg', 'webp'].includes(fileType) || fileType === 'image') return "Image";
    if (['pdf'].includes(fileType)) return "PDF";
    if (['xls', 'xlsx', 'csv'].includes(fileType) || fileType === 'excel') return "Excel";
    return "File";
};

const SuperAdminFilesTab = ({ currentUser }) => {
    const [files, setFiles] = useState([]);
    const [clients, setClients] = useState([]);
    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [dateRange, setDateRange] = useState({ start: "", end: "" });
    const [searchQuery, setSearchQuery] = useState("");

    // Sorting and Filtering states
    const [sortConfig, setSortConfig] = useState({ key: "createdAt", direction: "desc" });
    const [typeFilter, setTypeFilter] = useState("all");
    const [roleFilter, setRoleFilter] = useState("all");
    const [sourceFilter, setSourceFilter] = useState("all");
    const [recipientSearch, setRecipientSearch] = useState("");
    const [recipientSortOrder, setRecipientSortOrder] = useState("asc"); // 'asc' or 'desc'

    // Dialog states
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [isViewOpen, setIsViewOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [fileToUpload, setFileToUpload] = useState(null);
    const [selectedClientIds, setSelectedClientIds] = useState([]);
    const [selectedAdminIds, setSelectedAdminIds] = useState([]);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        if (!currentUser) return;

        setLoading(true);
        try {
            const [filesData, clientsData, adminsData] = await Promise.all([
                getSuperAdminFiles(),
                getClients({}),
                getAdmins()
            ]);
            setFiles(filesData);
            setClients(clientsData.clients || []);
            setAdmins(adminsData);
        } catch (error) {
            console.error("Failed to load data", error);
            toast.error("Failed to load files and practitioners");
            setFiles([]);
            setClients([]);
            setAdmins([]);
        } finally {
            setLoading(false);
        }
    }

    // Sorting Helpers
    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const getSortIcon = (key) => {
        if (sortConfig.key !== key) return <ArrowUpDown className="ml-2 h-3 w-3 opacity-40 shrink-0" />;
        return sortConfig.direction === 'asc'
            ? <ArrowUp className="ml-2 h-3 w-3 text-primary shrink-0" />
            : <ArrowDown className="ml-2 h-3 w-3 text-primary shrink-0" />;
    };

    // Filter files
    const filteredFiles = useMemo(() => {
        let result = files.filter(file => {
            // Search filter
            const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                file.clientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                file.recipientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                file.uploadedBy?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (file.taskId && file.taskId.toLowerCase().includes(searchQuery.toLowerCase()));

            if (!matchesSearch) return false;

            // Date filter
            const fileDate = new Date(file.createdAt || file.date);
            if (dateRange.start) {
                const startDate = new Date(dateRange.start);
                if (fileDate < startDate) return false;
            }
            if (dateRange.end) {
                const endDate = new Date(dateRange.end);
                if (fileDate > endDate) return false;
            }

            // Type filter
            if (typeFilter !== "all") {
                const fileType = file.type?.toLowerCase();
                if (typeFilter === "image" && !['jpg', 'jpeg', 'png', 'svg', 'webp', 'image'].includes(fileType)) return false;
                if (typeFilter === "pdf" && fileType !== "pdf") return false;
                if (typeFilter === "excel" && !['xls', 'xlsx', 'csv', 'excel'].includes(fileType)) return false;
                if (typeFilter === "other" && ['jpg', 'jpeg', 'png', 'svg', 'webp', 'image', 'pdf', 'xls', 'xlsx', 'csv', 'excel'].includes(fileType)) return false;
            }

            // Role filter
            if (roleFilter !== "all") {
                const role = file.recipientRole || (file.clientId ? 'client' : 'admin');
                if (role !== roleFilter) return false;
            }

            // Source filter
            if (sourceFilter !== "all") {
                if (sourceFilter === "task" && !file.isTaskAttachment) return false;
                if (sourceFilter === "direct" && file.isTaskAttachment) return false;
            }

            return true;
        });

        // Apply Sorting
        if (sortConfig.key) {
            result = [...result].sort((a, b) => {
                let aVal, bVal;
                switch (sortConfig.key) {
                    case 'name':
                        aVal = (a.name || '').toLowerCase();
                        bVal = (b.name || '').toLowerCase();
                        break;
                    case 'recipient':
                        aVal = (a.recipientName || a.clientName || '').toLowerCase();
                        bVal = (b.recipientName || b.clientName || '').toLowerCase();
                        break;
                    case 'type':
                        aVal = (a.type || '').toLowerCase();
                        bVal = (b.type || '').toLowerCase();
                        break;
                    case 'uploadedBy':
                        aVal = (a.uploadedBy || '').toLowerCase();
                        bVal = (b.uploadedBy || '').toLowerCase();
                        break;
                    case 'createdAt':
                    default:
                        aVal = new Date(a.createdAt || a.date).getTime();
                        bVal = new Date(b.createdAt || b.date).getTime();
                        break;
                }

                if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return result;
    }, [dateRange, files, searchQuery, sortConfig, typeFilter, roleFilter, sourceFilter]);

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 9;

    const totalPages = Math.ceil(filteredFiles.length / itemsPerPage);
    const paginatedFiles = filteredFiles.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, dateRange]);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFileToUpload(e.target.files[0]);
        }
    };

    const toggleClientSelection = (clientId) => {
        setSelectedClientIds(prev =>
            prev.includes(clientId)
                ? prev.filter(id => id !== clientId)
                : [...prev, clientId]
        );
    };

    const toggleAdminSelection = (adminId) => {
        setSelectedAdminIds(prev =>
            prev.includes(adminId)
                ? prev.filter(id => id !== adminId)
                : [...prev, adminId]
        );
    };

    const handleUploadSubmit = async () => {
        if (!fileToUpload) {
            toast.error("Please select a file to upload");
            return;
        }

        const totalSelected = selectedClientIds.length + selectedAdminIds.length;
        if (totalSelected === 0) {
            toast.error("Please select at least one recipient (Client or Admin)");
            return;
        }

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', fileToUpload);

            // Combine recipients
            const recipients = [];

            clients.filter(c => selectedClientIds.includes(c._id))
                .forEach(c => recipients.push({ id: c._id, name: c.name, role: 'client' }));

            admins.filter(a => selectedAdminIds.includes(a._id))
                .forEach(a => recipients.push({ id: a._id, name: a.name, role: 'admin' }));

            formData.append('recipients', JSON.stringify(recipients));
            formData.append('uploadedBy', currentUser?.name || 'Super Admin');

            const result = await uploadFiles(formData);

            if (result.success) {
                toast.success(`Successfully uploaded and shared with ${recipients.length} recipients`);
                setIsUploadOpen(false);
                setFileToUpload(null);
                setSelectedClientIds([]);
                setSelectedAdminIds([]);
                // Reload files
                const updatedFiles = await getSuperAdminFiles();
                setFiles(updatedFiles);
            } else {
                toast.error(result.error || "Upload failed");
            }
        } catch (error) {
            console.error("Upload error:", error);
            toast.error("An error occurred during upload");
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteFile = async (file) => {
        if (file.isTaskAttachment) {
            toast.error("This file is part of a Task. Please edit or delete the task to manage this attachment.");
            return;
        }

        if (!confirm("Are you sure you want to delete this file?")) return;

        try {
            const result = await deleteFile(file._id);
            if (result.success) {
                toast.success("File deleted successfully");
                setFiles(prev => prev.filter(f => f._id !== file._id));
            } else {
                toast.error(result.error || "Failed to delete file");
            }
        } catch (error) {
            toast.error("An error occurred");
        }
    };

    const handleDownload = (file) => {
        if (!file.url) {
            toast.error("Download URL not available");
            return;
        }

        try {
            const link = document.createElement('a');
            link.href = file.url;
            link.setAttribute('download', file.name || 'document');
            link.target = "_blank";
            link.rel = "noopener noreferrer";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast.success("Opening file for download...");
        } catch (error) {
            console.error("Download failed:", error);
            window.open(file.url, '_blank');
        }
    };

    const handlePreview = (file) => {
        setSelectedFile(file);
        setIsViewOpen(true);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground">Loading file repository...</p>
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-80px)] flex flex-col space-y-4">
            {/* Header: Title and Primary Actions */}
            {/* <div className="flex items-center justify-between gap-4 shrink-0 px-1">
                <div>
                    <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">Global Files</h1>
                    <p className="text-sm text-muted-foreground">Manage and share documents across the platform.</p>
                </div>
            </div> */}

            {/* Filter Bar: Unified Search, Date Filters and Upload */}
            <div className="flex flex-col lg:flex-row lg:items-center gap-3 bg-white rounded-2xl border border-border shadow-sm shrink-0">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search file, recipient, uploader..."
                        className="pl-10 h-10 bg-muted/30 border-none shadow-none placeholder:text-muted-foreground/60 focus-visible:ring-1"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-2 bg-muted/30 px-3 py-1.5 rounded-xl border border-transparent shadow-none">
                        <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Dates</Label>
                        <div className="h-4 w-px bg-border/50 mx-1" />
                        <input
                            type="date"
                            className="bg-transparent border-none text-xs focus:outline-none cursor-pointer"
                            value={dateRange.start}
                            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                        />
                        <span className="text-muted-foreground/50 text-[10px]">-</span>
                        <input
                            type="date"
                            className="bg-transparent border-none text-xs focus:outline-none cursor-pointer"
                            value={dateRange.end}
                            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                        />
                    </div>

                    <div className="h-8 w-px bg-border mx-1 hidden lg:block" />

                    <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 h-10 px-6 font-bold rounded-xl transition-all active:scale-95">
                                <Upload className="h-4 w-4 mr-2" />
                                Share File
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[50%] max-h-[90vh] overflow-hidden flex flex-col">
                            <DialogHeader>
                                <DialogTitle>Broadcast & Share File</DialogTitle>
                                <DialogDescription>
                                    Upload a document and select recipients from either Clients or Admin users.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="flex-1 overflow-y-auto pr-2 space-y-6 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="file-upload" className="flex items-center gap-2">
                                        <FileIcon className="h-4 w-4 text-primary" />
                                        Choose Document
                                    </Label>
                                    <Input
                                        id="file-upload"
                                        type="file"
                                        onChange={handleFileChange}
                                        className="cursor-pointer border-dashed border-2 hover:border-primary/50 transition-colors py-8 h-auto"
                                    />
                                    {fileToUpload && (
                                        <div className="flex items-center justify-between p-2 bg-primary/5 rounded-md border border-primary/10">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <Badge variant="secondary" className="h-5 px-1.5">{fileToUpload.name.split('.').pop().toUpperCase()}</Badge>
                                                <span className="text-xs font-medium truncate">{fileToUpload.name}</span>
                                            </div>
                                            <span className="text-[10px] text-muted-foreground shrink-0">{(fileToUpload.size / 1024 / 1024).toFixed(2)} MB</span>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <Label className="flex items-center gap-2">
                                            <Users className="h-4 w-4 text-primary" />
                                            Select Target Recipients
                                        </Label>
                                        <Badge variant="outline" className="bg-primary/5 text-[10px]">
                                            {selectedClientIds.length + selectedAdminIds.length} Selected
                                        </Badge>
                                    </div>

                                    <Tabs defaultValue="clients" className="w-full">
                                        <TabsList className="grid w-full grid-cols-2 bg-muted/50">
                                            <TabsTrigger value="clients" className="data-[state=active]:bg-background">
                                                Clients ({clients.length})
                                            </TabsTrigger>
                                            <TabsTrigger value="admins" className="data-[state=active]:bg-background">
                                                Admin Users ({admins.length})
                                            </TabsTrigger>
                                        </TabsList>

                                        <div className="mt-4 flex items-center gap-2 group">
                                            <div className="relative flex-1">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                                <Input
                                                    placeholder="Search recipients by name or email..."
                                                    className="pl-9 h-10 bg-accent/10 border-none shadow-none focus-visible:ring-1"
                                                    value={recipientSearch}
                                                    onChange={(e) => setRecipientSearch(e.target.value)}
                                                />
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-10 w-10 shrink-0 bg-accent/10 border-none hover:bg-accent/20"
                                                onClick={() => setRecipientSortOrder(prev => prev === "asc" ? "desc" : "asc")}
                                                title={`Sort ${recipientSortOrder === 'asc' ? 'Z-A' : 'A-Z'}`}
                                            >
                                                {recipientSortOrder === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                                            </Button>
                                        </div>

                                        <TabsContent value="clients" className="mt-2 outline-none">
                                            <div className="border rounded-lg overflow-hidden bg-accent/20">
                                                <div className="p-2 border-b bg-accent/40 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-muted-foreground text-foreground">
                                                    <span>Client Directory</span>
                                                    <button
                                                        className="text-primary hover:underline"
                                                        onClick={() => {
                                                            const allSelected = selectedClientIds.length === clients.length;
                                                            setSelectedClientIds(allSelected ? [] : clients.map(c => c._id));
                                                        }}
                                                    >
                                                        {selectedClientIds.length === clients.length && clients.length > 0 ? "Unselect All" : "Select All"}
                                                    </button>
                                                </div>
                                                <ScrollArea className="h-[200px]">
                                                    <div className="p-1.5 space-y-1">
                                                        {clients
                                                            .filter(c =>
                                                                c.name?.toLowerCase().includes(recipientSearch.toLowerCase()) ||
                                                                c.company?.toLowerCase().includes(recipientSearch.toLowerCase()) ||
                                                                c.email?.toLowerCase().includes(recipientSearch.toLowerCase())
                                                            )
                                                            .sort((a, b) => {
                                                                const nameA = (a.name || "").toLowerCase();
                                                                const nameB = (b.name || "").toLowerCase();
                                                                return recipientSortOrder === "asc"
                                                                    ? nameA.localeCompare(nameB)
                                                                    : nameB.localeCompare(nameA);
                                                            })
                                                            .map((client) => (
                                                                <div key={client._id} className="flex items-center space-x-3 p-2 rounded-md hover:bg-accent/50 transition-colors group">
                                                                    <Checkbox
                                                                        id={`client-${client._id}`}
                                                                        checked={selectedClientIds.includes(client._id)}
                                                                        onCheckedChange={() => toggleClientSelection(client._id)}
                                                                    />
                                                                    <label htmlFor={`client-${client._id}`} className="flex-1 cursor-pointer">
                                                                        <div className="text-sm font-semibold capitalize group-hover:text-primary transition-colors">{client.name}</div>
                                                                        <div className="text-[10px] text-muted-foreground capitalize">{client.company || 'Private Client'}</div>
                                                                    </label>
                                                                </div>
                                                            ))}
                                                        {clients.filter(c =>
                                                            c.name?.toLowerCase().includes(recipientSearch.toLowerCase()) ||
                                                            c.company?.toLowerCase().includes(recipientSearch.toLowerCase())
                                                        ).length === 0 && (
                                                                <div className="text-center py-10 text-xs text-muted-foreground">No matching clients found</div>
                                                            )}
                                                    </div>
                                                </ScrollArea>
                                            </div>
                                        </TabsContent>

                                        <TabsContent value="admins" className="mt-2 outline-none">
                                            <div className="border rounded-lg overflow-hidden bg-accent/20">
                                                <div className="p-2 border-b bg-accent/40 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                                    <span>Admin Network</span>
                                                    <button
                                                        className="text-primary hover:underline"
                                                        onClick={() => {
                                                            const allSelected = selectedAdminIds.length === admins.length;
                                                            setSelectedAdminIds(allSelected ? [] : admins.map(a => a._id));
                                                        }}
                                                    >
                                                        {selectedAdminIds.length === admins.length && admins.length > 0 ? "Unselect All" : "Select All"}
                                                    </button>
                                                </div>
                                                <ScrollArea className="h-[200px]">
                                                    <div className="p-1.5 space-y-1">
                                                        {admins
                                                            .filter(a =>
                                                                a.name?.toLowerCase().includes(recipientSearch.toLowerCase()) ||
                                                                a.email?.toLowerCase().includes(recipientSearch.toLowerCase())
                                                            )
                                                            .sort((a, b) => {
                                                                const nameA = (a.name || "").toLowerCase();
                                                                const nameB = (b.name || "").toLowerCase();
                                                                return recipientSortOrder === "asc"
                                                                    ? nameA.localeCompare(nameB)
                                                                    : nameB.localeCompare(nameA);
                                                            })
                                                            .map((admin) => (
                                                                <div key={admin._id} className="flex items-center space-x-3 p-2 rounded-md hover:bg-accent/50 transition-colors group">
                                                                    <Checkbox
                                                                        id={`admin-${admin._id}`}
                                                                        checked={selectedAdminIds.includes(admin._id)}
                                                                        onCheckedChange={() => toggleAdminSelection(admin._id)}
                                                                    />
                                                                    <label htmlFor={`admin-${admin._id}`} className="flex-1 cursor-pointer">
                                                                        <div className="text-sm font-semibold capitalize group-hover:text-primary transition-colors">{admin.name}</div>
                                                                        <div className="text-[10px] text-muted-foreground">{admin.email}</div>
                                                                    </label>
                                                                </div>
                                                            ))}
                                                        {admins.filter(a =>
                                                            a.name?.toLowerCase().includes(recipientSearch.toLowerCase()) ||
                                                            a.email?.toLowerCase().includes(recipientSearch.toLowerCase())
                                                        ).length === 0 && (
                                                                <div className="text-center py-10 text-xs text-muted-foreground">No matching admins found</div>
                                                            )}
                                                    </div>
                                                </ScrollArea>
                                            </div>
                                        </TabsContent>
                                    </Tabs>
                                </div>
                            </div>

                            <DialogFooter className="bg-muted/30 -mx-6 -mb-6 p-4 mt-auto border-t">
                                <Button variant="outline" onClick={() => setIsUploadOpen(false)}>Cancel</Button>
                                <Button
                                    onClick={handleUploadSubmit}
                                    disabled={uploading || !fileToUpload || (selectedClientIds.length + selectedAdminIds.length === 0)}
                                    className="min-w-[140px]"
                                >
                                    {uploading ? (
                                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing...</>
                                    ) : (
                                        <><CheckCircle2 className="mr-2 h-4 w-4" />Share with Team</>
                                    )}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Table Container: Flexible/Scrollable content */}
            <div className="flex-1 min-h-0 bg-card rounded-2xl border shadow-sm overflow-hidden flex flex-col mb-2">
                <ScrollableContainer className="flex-1 h-full" maxHeight="none">
                    <Table wrapperClassName="overflow-visible">
                        <TableHeader className="sticky top-0 z-30 bg-muted/90 backdrop-blur-md border-b shadow-sm">
                            <TableRow className="hover:bg-transparent border-none">
                                <TableHead className="w-[300px] bg-muted/50 sticky top-0 z-30">
                                    <button
                                        className="flex items-center hover:text-primary transition-colors font-bold uppercase text-[11px] tracking-wider"
                                        onClick={() => handleSort('name')}
                                    >
                                        File Details {getSortIcon('name')}
                                    </button>
                                </TableHead>
                                <TableHead className="bg-muted/50 sticky top-0 z-30">
                                    <div className="flex flex-col gap-1.5 py-2">
                                        <button
                                            className="flex items-center hover:text-primary transition-colors font-bold uppercase text-[11px] tracking-wider"
                                            onClick={() => handleSort('recipient')}
                                        >
                                            Recipient {getSortIcon('recipient')}
                                        </button>
                                        <Select value={roleFilter} onValueChange={setRoleFilter}>
                                            <SelectTrigger className="h-7 text-[10px] w-24 bg-background/50 border-muted">
                                                <SelectValue placeholder="All Roles" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all" className="text-[10px]">All Roles</SelectItem>
                                                <SelectItem value="client" className="text-[10px]">Client</SelectItem>
                                                <SelectItem value="admin" className="text-[10px]">Admin</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </TableHead>
                                <TableHead className="bg-muted/50 sticky top-0 z-30">
                                    <div className="flex flex-col gap-1.5 py-2">
                                        <button
                                            className="flex items-center hover:text-primary transition-colors font-bold uppercase text-[11px] tracking-wider"
                                            onClick={() => handleSort('type')}
                                        >
                                            Type {getSortIcon('type')}
                                        </button>
                                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                                            <SelectTrigger className="h-7 text-[10px] w-24 bg-background/50 border-muted">
                                                <SelectValue placeholder="All Types" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all" className="text-[10px]">All Types</SelectItem>
                                                <SelectItem value="pdf" className="text-[10px]">PDF Documents</SelectItem>
                                                <SelectItem value="excel" className="text-[10px]">Excel Sheets</SelectItem>
                                                <SelectItem value="image" className="text-[10px]">Images</SelectItem>
                                                <SelectItem value="other" className="text-[10px]">Others</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </TableHead>
                                <TableHead className="bg-muted/50 sticky top-0 z-30">
                                    <button
                                        className="flex items-center hover:text-primary transition-colors font-bold uppercase text-[11px] tracking-wider whitespace-nowrap"
                                        onClick={() => handleSort('uploadedBy')}
                                    >
                                        Shared By {getSortIcon('uploadedBy')}
                                    </button>
                                </TableHead>
                                <TableHead className="bg-muted/50 sticky top-0 z-30">
                                    <button
                                        className="flex items-center hover:text-primary transition-colors font-bold uppercase text-[11px] tracking-wider"
                                        onClick={() => handleSort('createdAt')}
                                    >
                                        Date {getSortIcon('createdAt')}
                                    </button>
                                </TableHead>
                                <TableHead className="bg-muted/50 sticky top-0 z-30">
                                    <div className="flex flex-col gap-1.5 py-2">
                                        <p className="font-bold uppercase text-[11px] tracking-wider">Source</p>
                                        <Select value={sourceFilter} onValueChange={setSourceFilter}>
                                            <SelectTrigger className="h-7 text-[10px] w-28 bg-background/50 border-muted">
                                                <SelectValue placeholder="All Sources" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all" className="text-[10px]">All Sources</SelectItem>
                                                <SelectItem value="task" className="text-[10px]">From Tasks</SelectItem>
                                                <SelectItem value="direct" className="text-[10px]">Direct Uploads</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </TableHead>
                                <TableHead className="text-right bg-muted/50 font-bold uppercase text-[11px] tracking-wider sticky top-0 z-30">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedFiles.length > 0 ? (
                                paginatedFiles.map((file) => (
                                    <TableRow key={file._id} className="hover:bg-accent/5 transition-colors group">
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-lg bg-accent/50 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                                    {getFileIcon(file.type)}
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="font-semibold text-sm truncate" title={file.name}>
                                                        {file.name}
                                                    </span>
                                                    {file.isTaskAttachment ? (
                                                        <div className="flex items-center gap-1.5 mt-0.5">
                                                            <Badge variant="outline" className="text-[8px] h-3.5 px-1 bg-amber-500/10 border-amber-500/20 text-amber-600 uppercase font-bold tracking-tighter">Task Ref</Badge>
                                                            <span className="text-[10px] text-muted-foreground font-mono">{file.taskId}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-[10px] text-muted-foreground font-mono mt-0.5 opacity-60">ID: {file._id?.toString().slice(-6).toUpperCase()}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1">
                                                <span className="text-sm font-bold capitalize truncate max-w-[140px]">{file.recipientName || file.clientName}</span>
                                                <div className="flex gap-1">
                                                    <Badge
                                                        variant="secondary"
                                                        className={cn(
                                                            "text-[9px] h-4 px-1 font-bold uppercase",
                                                            (file.recipientRole === 'admin' || !file.clientId) ? "bg-purple-100 text-purple-700 hover:bg-purple-100" : "bg-blue-100 text-blue-700 hover:bg-blue-100"
                                                        )}
                                                    >
                                                        {file.recipientRole || (file.clientId ? 'client' : 'admin')}
                                                    </Badge>
                                                    {file.isTaskAttachment && (
                                                        <span className="text-[9px] text-muted-foreground opacity-70 italic truncate max-w-[80px]">{file.taskTitle}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="bg-background font-medium text-[10px] h-5">
                                                {getFileTypeLabel(file.type)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary shrink-0 border border-primary/20">
                                                    {file.uploadedBy?.charAt(0) || 'U'}
                                                </div>
                                                <span className="text-sm truncate max-w-[90px] font-medium opacity-80">{file.uploadedBy}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="text-xs font-semibold">{file.date}</span>
                                                <span className="text-[9px] text-muted-foreground opacity-60">
                                                    {file.createdAt ? new Date(file.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {file.isTaskAttachment ? (
                                                <Badge variant="outline" className="text-[10px] h-5 bg-amber-50 text-amber-700 border-amber-200">Task File</Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-[10px] h-5 bg-sky-50 text-sky-700 border-sky-200">Direct Upload</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10 hover:text-primary" onClick={() => handlePreview(file)}>
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-blue-500/10 hover:text-blue-600" onClick={() => handleDownload(file)}>
                                                    <Download className="h-4 w-4" />
                                                </Button>
                                                {!file.isTaskAttachment && (
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDeleteFile(file)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-20 text-muted-foreground bg-accent/5">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="p-4 bg-muted rounded-full">
                                                <FileIcon className="h-10 w-10 opacity-20" />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-lg font-bold">No files matched filters</p>
                                                <p className="text-sm opacity-60 max-w-[280px] mx-auto">Try adjusting your search query or date range to find specific documents.</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </ScrollableContainer>
            </div>

            <div className="flex items-center justify-between shrink-0  mt-auto">
                <div className="text-xs text-muted-foreground">
                    Showing <span className="font-bold">{paginatedFiles.length}</span> of <span className="font-bold">{filteredFiles.length}</span> total files
                </div>
                <DataPagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                />
            </div>

            <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
                <DialogContent className="max-w-2xl border-none shadow-2xl p-0 overflow-hidden">
                    <div className="bg-primary px-6 py-4 flex items-center justify-between">
                        <div className="space-y-0.5">
                            <DialogTitle className="text-white font-bold text-lg leading-none">{selectedFile?.name}</DialogTitle>
                            <DialogDescription className="text-white/60 text-xs">
                                {selectedFile?.isTaskAttachment
                                    ? `Attachment for Task ${selectedFile.taskId}`
                                    : `Direct file shared with ${selectedFile?.recipientName || selectedFile?.clientName}`}
                            </DialogDescription>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white">
                            {getFileIcon(selectedFile?.type)}
                        </div>
                    </div>

                    <div className="p-8 flex flex-col items-center justify-center bg-accent/10">
                        {['jpg', 'jpeg', 'png', 'svg', 'webp', 'image'].includes(selectedFile?.type?.toLowerCase()) ? (
                            <div className="max-h-[400px] w-full flex items-center justify-center p-4">
                                <img
                                    src={selectedFile.url}
                                    alt={selectedFile.name}
                                    className="max-w-full max-h-full object-contain rounded-lg shadow-2xl border-4 border-white bg-white"
                                />
                            </div>
                        ) : (
                            <div className="text-center space-y-6 py-10 w-full max-w-md mx-auto">
                                <div className="relative">
                                    <div className="w-28 h-28 bg-white rounded-3xl border-4 border-primary/5 shadow-xl flex items-center justify-center mx-auto relative z-10 transition-transform hover:scale-105">
                                        {getFileIcon(selectedFile?.type)}
                                    </div>
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-primary/5 rounded-full blur-2xl -z-0" />
                                </div>
                                <div className="space-y-2">
                                    <p className="font-bold text-2xl text-foreground truncate">{selectedFile?.name}</p>
                                    <div className="flex items-center justify-center gap-2">
                                        <Badge variant="secondary" className="uppercase text-[10px] tracking-widest font-bold">
                                            {getFileTypeLabel(selectedFile?.type)}
                                        </Badge>
                                        <span className="text-foreground/20">•</span>
                                        <span className="text-xs font-bold text-muted-foreground">{selectedFile?.size || 'System Link'}</span>
                                    </div>
                                </div>
                                <p className="text-[13px] leading-relaxed text-muted-foreground px-6 italic">
                                    {selectedFile?.isTaskAttachment
                                        ? "This document is securely attached to a specific task workflow. Preview is limited to external viewers."
                                        : "This is a direct upload repository asset. Please download to view complete contents."}
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="bg-card px-6 py-4 border-t flex items-center justify-between">
                        <div className="flex flex-col">
                            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Object Reference</span>
                            <span className="text-[11px] font-mono text-primary">{selectedFile?._id}</span>
                        </div>
                        <div className="flex gap-3">
                            <Button variant="ghost" size="sm" className="font-bold h-10 px-6 rounded-xl hover:bg-accent" onClick={() => setIsViewOpen(false)}>Dismiss</Button>
                            <Button size="sm" className="font-bold h-10 px-8 rounded-xl shadow-lg hover:shadow-primary/20" onClick={() => handleDownload(selectedFile)}>
                                <Download className="mr-2 h-4 w-4" />
                                Download Source
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default SuperAdminFilesTab;
