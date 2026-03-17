"use client";
import { useState, useMemo, useEffect } from "react";
import {
    Download, FileText, Image, FileSpreadsheet, Eye,
    Calendar, X, Loader2, File as FileIcon, Search,
    ArrowUp, ArrowDown, ChevronsUpDown, FolderOpen
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getFilesByClientId } from "@/lib/actions/file";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter,
    DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { NoPlanState } from "@/components/client/NoPlanState";
import DataPagination from "@/components/ui/DataPagination";
import { ScrollableContainer } from "@/components/ui/scrollable-container";
import { cn } from "@/lib/utils";

const getFileIcon = (type) => {
    const t = type?.toLowerCase();
    if (['pdf'].includes(t)) return <FileText className="h-5 w-5 text-red-500" />;
    if (['excel', 'xls', 'xlsx', 'csv'].includes(t)) return <FileSpreadsheet className="h-5 w-5 text-green-500" />;
    if (['image', 'jpg', 'jpeg', 'png', 'svg', 'webp'].includes(t)) return <Image className="h-5 w-5 text-blue-500" />;
    return <FileIcon className="h-5 w-5 text-muted-foreground" />;
};

const getFileTypeLabel = (type) => {
    const t = type?.toLowerCase();
    if (['pdf'].includes(t)) return "PDF";
    if (['excel', 'xls', 'xlsx', 'csv'].includes(t)) return "Excel";
    if (['image', 'jpg', 'jpeg', 'png', 'svg', 'webp'].includes(t)) return "Image";
    return "File";
};

const getFileTypeBadgeColor = (type) => {
    const t = type?.toLowerCase();
    if (['pdf'].includes(t)) return "bg-red-50 text-red-700 border-red-200";
    if (['excel', 'xls', 'xlsx', 'csv'].includes(t)) return "bg-green-50 text-green-700 border-green-200";
    if (['image', 'jpg', 'jpeg', 'png', 'svg', 'webp'].includes(t)) return "bg-blue-50 text-blue-700 border-blue-200";
    return "bg-gray-50 text-gray-700 border-gray-200";
};

const ClientFilesTab = ({ currentUser }) => {
    const [loading, setLoading] = useState(true);
    const [allFiles, setAllFiles] = useState([]);
    const [dateRange, setDateRange] = useState({ start: "", end: "" });
    const [searchQuery, setSearchQuery] = useState("");
    const [sortConfig, setSortConfig] = useState({ key: "createdAt", direction: "desc" });

    // Dialog states
    const [isViewOpen, setIsViewOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);

    useEffect(() => {
        const loadFilesData = async () => {
            if (!currentUser) {
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                const response = await getFilesByClientId(currentUser._id, { limit: 100 });
                setAllFiles(response.files || []);
            } catch (error) {
                console.error("Error loading client files:", error);
                toast.error("Failed to load files");
            } finally {
                setLoading(false);
            }
        };

        loadFilesData();
    }, [currentUser]);

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const getSortIcon = (key) => {
        if (sortConfig.key !== key) return <ChevronsUpDown className="ml-2 h-3 w-3 opacity-40 shrink-0" />;
        return sortConfig.direction === 'asc'
            ? <ArrowUp className="ml-2 h-3 w-3 text-primary shrink-0" />
            : <ArrowDown className="ml-2 h-3 w-3 text-primary shrink-0" />;
    };

    // Filter files
    const filteredFiles = useMemo(() => {
        let filtered = allFiles.filter(file => {
            // Search filter
            const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase());
            if (!matchesSearch) return false;

            // Date filter
            const fileDate = new Date(file.createdAt);
            if (dateRange.start) {
                const startDate = new Date(dateRange.start);
                if (fileDate < startDate) return false;
            }
            if (dateRange.end) {
                const endDate = new Date(dateRange.end);
                endDate.setHours(23, 59, 59, 999);
                if (fileDate > endDate) return false;
            }
            return true;
        });

        if (sortConfig.key) {
            filtered.sort((a, b) => {
                let aValue = a[sortConfig.key];
                let bValue = b[sortConfig.key];

                if (sortConfig.key === 'createdAt') {
                    aValue = new Date(a.date || a.createdAt).getTime();
                    bValue = new Date(b.date || b.createdAt).getTime();
                } else if (sortConfig.key === 'size') {
                    aValue = (aValue || '').toString().toLowerCase();
                    bValue = (bValue || '').toString().toLowerCase();
                } else {
                    aValue = (aValue || '').toString().toLowerCase();
                    bValue = (bValue || '').toString().toLowerCase();
                }

                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return filtered;
    }, [dateRange, allFiles, searchQuery, sortConfig]);

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

    const handleDownload = (file) => {
        if (!file.url) {
            toast.error("Download URL not available");
            return;
        }
        window.open(file.url, '_blank');
    };

    const handlePreview = (file) => {
        setSelectedFile(file);
        setIsViewOpen(true);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground">Loading your files...</p>
            </div>
        );
    }

    if ((!currentUser?.plan || currentUser?.plan === "None") && allFiles.length === 0) {
        return (
            <NoPlanState
                title="Project Files & Assets"
                message="Once you start a project with us, this is where you'll find all your project files and deliverables."
            />
        );
    }

    const hasActiveFilters = searchQuery || dateRange.start || dateRange.end;

    return (
        <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="font-heading text-2xl font-bold mb-1">Files & Deliverables</h1>
                    <p className="text-muted-foreground text-sm">Download and view documents shared by your account manager.</p>
                </div>
                <Badge variant="outline" className="self-start sm:self-center px-3 py-1.5 text-xs font-medium">
                    <FolderOpen className="h-3.5 w-3.5 mr-1.5" />
                    {allFiles.length} {allFiles.length === 1 ? 'File' : 'Files'}
                </Badge>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-end">
                <div className="lg:col-span-2 space-y-1.5">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Search</Label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by file name..."
                            className="pl-10 h-10"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery("")}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                </div>
                <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider font-medium">From Date</Label>
                    <Input
                        type="date"
                        className="h-10"
                        value={dateRange.start}
                        onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                    />
                </div>
                <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider font-medium">To Date</Label>
                    <Input
                        type="date"
                        className="h-10"
                        value={dateRange.end}
                        onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                    />
                </div>
            </div>

            {/* Files Table */}
            <div className="bg-card rounded-xl border overflow-hidden shadow-sm">
                <ScrollableContainer className="max-h-[60vh]">
                    <Table wrapperClassName="overflow-visible">
                        <TableHeader className="sticky top-0 z-10 bg-card shadow-sm border-b">
                            <TableRow className="bg-muted/50 hover:bg-muted/50">
                                <TableHead className="sticky top-0 z-10 bg-muted/50">
                                    <button onClick={() => handleSort('name')} className="flex items-center hover:text-primary transition-colors font-bold uppercase text-[11px] tracking-wider whitespace-nowrap">
                                        File Details {getSortIcon('name')}
                                    </button>
                                </TableHead>
                                <TableHead className="sticky top-0 z-10 bg-muted/50">
                                    <button onClick={() => handleSort('type')} className="flex items-center hover:text-primary transition-colors font-bold uppercase text-[11px] tracking-wider whitespace-nowrap">
                                        Type {getSortIcon('type')}
                                    </button>
                                </TableHead>
                                <TableHead className="sticky top-0 z-10 bg-muted/50">
                                    <button onClick={() => handleSort('size')} className="flex items-center hover:text-primary transition-colors font-bold uppercase text-[11px] tracking-wider whitespace-nowrap">
                                        Size {getSortIcon('size')}
                                    </button>
                                </TableHead>
                                <TableHead className="sticky top-0 z-10 bg-muted/50">
                                    <button onClick={() => handleSort('uploadedBy')} className="flex items-center hover:text-primary transition-colors font-bold uppercase text-[11px] tracking-wider whitespace-nowrap">
                                        Uploaded By {getSortIcon('uploadedBy')}
                                    </button>
                                </TableHead>
                                <TableHead className="sticky top-0 z-10 bg-muted/50">
                                    <button onClick={() => handleSort('createdAt')} className="flex items-center hover:text-primary transition-colors font-bold uppercase text-[11px] tracking-wider whitespace-nowrap">
                                        Received On {getSortIcon('createdAt')}
                                    </button>
                                </TableHead>
                                <TableHead className="text-right sticky top-0 z-10 bg-muted/50 font-bold uppercase text-[11px] tracking-wider whitespace-nowrap">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedFiles.length > 0 ? (
                                paginatedFiles.map((file) => (
                                    <TableRow key={file._id} className="hover:bg-accent/20 transition-colors">
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
                                                    {getFileIcon(file.type)}
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="font-medium truncate max-w-[200px] lg:max-w-[400px]" title={file.name}>
                                                        {file.name}
                                                    </span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-tighter">
                                                            v{file.version || '1.0'}
                                                        </span>
                                                        {file.source && (
                                                            <span className="text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-sm font-semibold tracking-tight border border-blue-100" title={file.source}>
                                                                {file.source.length > 25 ? file.source.substring(0, 25) + "..." : file.source}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={cn("text-[10px] h-5 py-0 px-2 font-medium", getFileTypeBadgeColor(file.type))}>
                                                {getFileTypeLabel(file.type)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {file.size || 'N/A'}
                                        </TableCell>
                                        <TableCell className="text-sm font-medium capitalize">
                                            {file.uploadedBy || 'Manager'}
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                                            {file.date || new Date(file.createdAt).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
                                                    onClick={() => handlePreview(file)}
                                                    title="Preview"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0 hover:bg-green-500/10 hover:text-green-600"
                                                    onClick={() => handleDownload(file)}
                                                    title="Download"
                                                >
                                                    <Download className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-16 text-muted-foreground">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-16 h-16 rounded-2xl bg-accent/50 flex items-center justify-center">
                                                <FileIcon className="h-8 w-8 opacity-20" />
                                            </div>
                                            <div>
                                                <p className="text-base font-medium">No files available</p>
                                                <p className="text-sm opacity-70 mt-1">
                                                    {hasActiveFilters
                                                        ? "No files match your search criteria."
                                                        : "Your account manager hasn't shared any files with you yet."}
                                                </p>
                                            </div>
                                        </div>
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

            {/* Secure Storage Notice */}
            <div className="bg-primary/5 border border-primary/10 rounded-xl p-5 flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <FileIcon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                    <h4 className="text-sm font-semibold">Secure File Storage</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        All deliverables and documents are securely stored and accessible 24/7.
                        If you need to send files to us, please use the Support tab or contact your manager.
                    </p>
                </div>
            </div>

            {/* View/Preview Dialog */}
            <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{selectedFile?.name}</DialogTitle>
                        <DialogDescription>
                            Received on {selectedFile?.date || new Date(selectedFile?.createdAt).toLocaleDateString()}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-6 flex flex-col items-center justify-center bg-accent/20 rounded-xl border-2 border-dashed border-accent">
                        {selectedFile?.type === 'image' ? (
                            <div className="relative w-full aspect-video rounded-lg overflow-hidden border shadow-sm">
                                <img
                                    src={selectedFile.url}
                                    alt={selectedFile.name}
                                    className="object-contain w-full h-full"
                                />
                            </div>
                        ) : (
                            <div className="text-center space-y-4 py-10">
                                <div className="w-20 h-20 bg-card rounded-2xl border shadow-sm flex items-center justify-center mx-auto">
                                    {getFileIcon(selectedFile?.type)}
                                </div>
                                <div>
                                    <p className="font-semibold">{selectedFile?.name}</p>
                                    <p className="text-sm text-muted-foreground uppercase">{getFileTypeLabel(selectedFile?.type)} • {selectedFile?.size}</p>
                                </div>
                                <p className="text-xs text-muted-foreground max-w-sm px-10">
                                    Preview is not available for this file type. Please download the file to view its contents.
                                </p>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsViewOpen(false)}>Close</Button>
                        <Button onClick={() => handleDownload(selectedFile)}>
                            <Download className="mr-2 h-4 w-4" />
                            Download File
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default ClientFilesTab;
