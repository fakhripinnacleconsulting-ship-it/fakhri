"use client";
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
    Receipt, Plus, Eye, Trash2, Search, Loader2,
    ArrowUp, ArrowDown, ChevronsUpDown, Calendar,
    Building2, User, IndianRupee, X, Download, Info,
    FileText, AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
    Dialog, DialogContent, DialogHeader,
    DialogTitle, DialogFooter, DialogDescription
} from "@/components/ui/dialog";
import {
    Select, SelectContent, SelectItem,
    SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
    Table, TableBody, TableCell,
    TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { getInvoices, createInvoice, deleteInvoice, getClients } from "@/lib/actions/admin";
import { toast } from "sonner";
import { formatINR } from "@/lib/utils";
import DataPagination from "@/components/ui/DataPagination";
import { ScrollableContainer } from "@/components/ui/scrollable-container";
import InvoiceLayout from "@/components/invoice/InvoiceLayout";

const SuperAdminInvoicesTab = () => {
    // Data state
    const [invoices, setInvoices] = useState([]);
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    // Filters
    const [statusFilter, setStatusFilter] = useState("all");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Sorting
    const [sortConfig, setSortConfig] = useState({ key: "createdAt", direction: "desc" });

    // Dialog states
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isViewOpen, setIsViewOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Delete toggle
    const [removeFromRevenue, setRemoveFromRevenue] = useState(true);

    // Invoice ref for printing
    const invoiceRef = useRef(null);

    // Create invoice form
    const [formData, setFormData] = useState({
        clientName: "",
        clientEmail: "",
        clientPhone: "",
        clientCompany: "",
        clientState: "",
        clientGstNo: "",
        clientId: "",
        date: new Date().toISOString().split("T")[0],
        status: "Pending",
        notes: "",
        addToRevenue: true,
        items: [{ description: "", qty: 1, rate: 0, amount: 0 }]
    });

    // Load initial data
    const fetchInvoices = useCallback(async () => {
        setLoading(true);
        try {
            const [invoicesRes, clientsRes] = await Promise.all([
                getInvoices({ limit: 1000 }),
                getClients({}, { projection: "_id name email company phone gstNo address city state pincode country" })
            ]);
            setInvoices(invoicesRes.invoices || []);
            setClients(clientsRes.clients || []);
        } catch (error) {
            console.error("Error fetching invoices:", error);
            toast.error("Failed to load invoices");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchInvoices();
    }, [fetchInvoices]);

    // Sorting
    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc"
        }));
    };

    const getSortIcon = (key) => {
        if (sortConfig.key !== key) return <ChevronsUpDown className="ml-1 h-3 w-3 opacity-40 shrink-0" />;
        return sortConfig.direction === "asc"
            ? <ArrowUp className="ml-1 h-3 w-3 text-primary shrink-0" />
            : <ArrowDown className="ml-1 h-3 w-3 text-primary shrink-0" />;
    };

    // Filter + Sort + Paginate
    const filteredInvoices = useMemo(() => {
        let result = invoices.filter(inv => {
            const matchesSearch = !searchQuery ||
                (inv.invoiceNumber || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                (inv.client?.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                (inv.client?.company || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                (inv.client?.email || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                String(inv.amount || "").includes(searchQuery);

            const matchesStatus = statusFilter === "all" || inv.status === statusFilter;

            let matchesDate = true;
            if (dateFrom) {
                const invDate = new Date(inv.date || inv.createdAt);
                matchesDate = invDate >= new Date(dateFrom);
            }
            if (dateTo && matchesDate) {
                const invDate = new Date(inv.date || inv.createdAt);
                const toDate = new Date(dateTo);
                toDate.setHours(23, 59, 59, 999);
                matchesDate = invDate <= toDate;
            }

            return matchesSearch && matchesStatus && matchesDate;
        });

        // Sort
        result = [...result].sort((a, b) => {
            let aVal, bVal;
            switch (sortConfig.key) {
                case "invoiceNumber":
                    aVal = (a.invoiceNumber || "").toLowerCase();
                    bVal = (b.invoiceNumber || "").toLowerCase();
                    break;
                case "clientName":
                    aVal = (a.client?.name || "").toLowerCase();
                    bVal = (b.client?.name || "").toLowerCase();
                    break;
                case "amount":
                    aVal = Number(a.amount) || 0;
                    bVal = Number(b.amount) || 0;
                    break;
                case "status":
                    aVal = (a.status || "").toLowerCase();
                    bVal = (b.status || "").toLowerCase();
                    break;
                case "createdAt":
                default:
                    aVal = new Date(a.date || a.createdAt).getTime();
                    bVal = new Date(b.date || b.createdAt).getTime();
                    break;
            }
            if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
            return 0;
        });

        return result;
    }, [invoices, searchQuery, statusFilter, dateFrom, dateTo, sortConfig]);

    const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);
    const paginatedInvoices = filteredInvoices.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Reset page on filter change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, statusFilter, dateFrom, dateTo]);

    // Summary stats
    const stats = useMemo(() => {
        const total = invoices.length;
        const paid = invoices.filter(i => i.status === "Paid").length;
        const pending = invoices.filter(i => i.status === "Pending").length;
        const totalRevenue = invoices.filter(i => i.status === "Paid").reduce((s, i) => s + (Number(i.amount) || 0), 0);
        return { total, paid, pending, totalRevenue };
    }, [invoices]);

    // --- Form Handlers ---
    const resetForm = () => {
        setFormData({
            clientName: "",
            clientEmail: "",
            clientPhone: "",
            clientCompany: "",
            clientState: "",
            clientGstNo: "",
            clientId: "",
            date: new Date().toISOString().split("T")[0],
            status: "Pending",
            notes: "",
            addToRevenue: true,
            items: [{ description: "", qty: 1, rate: 0, amount: 0 }]
        });
    };

    const handleClientSelect = (clientId) => {
        if (clientId === "manual") {
            setFormData(prev => ({
                ...prev,
                clientId: "",
                clientName: "",
                clientEmail: "",
                clientPhone: "",
                clientCompany: "",
                clientState: "",
                clientGstNo: ""
            }));
            return;
        }
        const client = clients.find(c => c._id === clientId);
        if (client) {
            setFormData(prev => ({
                ...prev,
                clientId: client._id,
                clientName: client.name || "",
                clientEmail: client.email || "",
                clientPhone: client.phone || "",
                clientCompany: client.company || "",
                clientState: client.state || "",
                clientGstNo: client.gstNo || ""
            }));
        }
    };

    const updateItem = (index, field, value) => {
        setFormData(prev => {
            const items = [...prev.items];
            items[index] = { ...items[index], [field]: value };
            // Auto-calculate amount
            if (field === "rate" || field === "qty") {
                const qty = field === "qty" ? Number(value) || 1 : Number(items[index].qty) || 1;
                const rate = field === "rate" ? Number(value) || 0 : Number(items[index].rate) || 0;
                items[index].amount = qty * rate;
            }
            return { ...prev, items };
        });
    };

    const addItem = () => {
        setFormData(prev => ({
            ...prev,
            items: [...prev.items, { description: "", qty: 1, rate: 0, amount: 0 }]
        }));
    };

    const removeItem = (index) => {
        if (formData.items.length <= 1) return;
        setFormData(prev => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== index)
        }));
    };

    const subTotal = useMemo(() => {
        return formData.items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    }, [formData.items]);

    const gstAmount = useMemo(() => Math.round(subTotal * 18) / 100, [subTotal]);
    const grandTotal = useMemo(() => Math.round((subTotal + gstAmount) * 100) / 100, [subTotal, gstAmount]);

    const handleCreateInvoice = async (e) => {
        e.preventDefault();
        if (!formData.clientName) {
            toast.error("Client name is required");
            return;
        }
        if (formData.items.some(item => !item.description || !item.rate)) {
            toast.error("All items need description and rate");
            return;
        }

        setIsSubmitting(true);
        try {
            const invoicePayload = {
                client: {
                    name: formData.clientName,
                    email: formData.clientEmail,
                    phone: formData.clientPhone,
                    company: formData.clientCompany,
                    state: formData.clientState,
                    gstNo: formData.clientGstNo,
                    id: formData.clientId || undefined
                },
                date: formData.date ? new Date(formData.date) : new Date(),
                status: formData.status,
                notes: formData.notes || "Thank you for your business!",
                excludeFromRevenue: !formData.addToRevenue,
                items: formData.items.map(item => ({
                    description: item.description,
                    hsnCode: "998311",
                    qty: Number(item.qty) || 1,
                    rate: Number(item.rate) || 0,
                    amount: Number(item.amount) || 0
                }))
            };

            const result = await createInvoice(invoicePayload);
            if (result.success) {
                toast.success(`Invoice ${result.invoice.invoiceNumber} created successfully`);
                setIsCreateOpen(false);
                resetForm();
                fetchInvoices();
            } else {
                toast.error(result.error || "Failed to create invoice");
            }
        } catch (error) {
            console.error("Error creating invoice:", error);
            toast.error("An error occurred while creating the invoice");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteInvoice = async () => {
        if (!selectedInvoice) return;
        setIsDeleting(true);
        try {
            const result = await deleteInvoice(selectedInvoice._id, removeFromRevenue);
            if (result.success) {
                toast.success("Invoice deleted successfully");
                setIsDeleteOpen(false);
                setSelectedInvoice(null);
                setRemoveFromRevenue(true);
                fetchInvoices();
            } else {
                toast.error(result.error || "Failed to delete invoice");
            }
        } catch (error) {
            console.error("Error deleting invoice:", error);
            toast.error("An error occurred");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleDownload = (invoice) => {
        const url = invoice.url || invoice.downloadUrl;
        if (url) {
            window.open(url, "_blank");
            return;
        }

        setSelectedInvoice(invoice);
        toast.info("Preparing PDF for download...");

        setTimeout(() => {
            const containers = document.querySelectorAll("#invoice-container");
            const printContent = containers[containers.length - 1];
            if (printContent) {
                const printWindow = window.open("", "_blank");
                if (!printWindow) {
                    toast.error("Popup blocked! Please allow popups to download invoices.");
                    return;
                }
                printWindow.document.write(`
                    <html>
                        <head>
                            <title>Invoice - ${invoice.invoiceNumber || "Draft"}</title>
                            <link rel="stylesheet" href="${window.location.origin}/_next/static/css/app/layout.css">
                            <script src="https://cdn.tailwindcss.com"><\/script>
                            <style>
                                @page { size: A4; margin: 0; }
                                body { padding: 0; margin: 0; background: white; }
                                #invoice-container { box-shadow: none !important; border: none !important; width: 210mm !important; margin: 0 !important; padding: 0.5in !important; }
                                @media print { .no-print { display: none !important; } }
                                * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                            </style>
                        </head>
                        <body>
                            <div style="width: 210mm; margin: 0 auto;">
                                ${printContent.outerHTML}
                            </div>
                            <script>
                                window.onload = () => { setTimeout(() => { window.print(); window.close(); }, 800); };
                            <\/script>
                        </body>
                    </html>
                `);
                printWindow.document.close();
            } else {
                toast.error("Could not generate PDF. Please try 'View' first.");
            }
        }, 500);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "Paid": return "bg-emerald-500/10 text-emerald-600 border-emerald-200";
            case "Pending": return "bg-amber-500/10 text-amber-600 border-amber-200";
            case "Overdue": return "bg-red-500/10 text-red-600 border-red-200";
            case "Cancelled": return "bg-slate-500/10 text-slate-500 border-slate-200";
            default: return "bg-slate-500/10 text-slate-500 border-slate-200";
        }
    };

    const clearFilters = () => {
        setSearchQuery("");
        setStatusFilter("all");
        setDateFrom("");
        setDateTo("");
        setCurrentPage(1);
    };

    const hasActiveFilters = searchQuery || statusFilter !== "all" || dateFrom || dateTo;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Receipt className="h-6 w-6 text-primary" />
                        Invoice Management
                    </h1>
                    <p className="text-muted-foreground text-sm">Manage all generated invoices, create new ones and track revenue.</p>
                </div>
                <Button onClick={() => { resetForm(); setIsCreateOpen(true); }} className="shadow-lg shadow-primary/20">
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Invoice
                </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-card rounded-xl border p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-2 mb-1">
                        <FileText className="h-4 w-4 text-primary" />
                        <span className="text-xs text-muted-foreground font-medium">Total Invoices</span>
                    </div>
                    <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <div className="bg-card rounded-xl border p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-2 mb-1">
                        <IndianRupee className="h-4 w-4 text-emerald-500" />
                        <span className="text-xs text-muted-foreground font-medium">Total Revenue</span>
                    </div>
                    <p className="text-2xl font-bold text-emerald-600">₹{formatINR(stats.totalRevenue)}</p>
                </div>
                <div className="bg-card rounded-xl border p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="h-2 w-2 rounded-full bg-emerald-500" />
                        <span className="text-xs text-muted-foreground font-medium">Paid</span>
                    </div>
                    <p className="text-2xl font-bold text-emerald-600">{stats.paid}</p>
                </div>
                <div className="bg-card rounded-xl border p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="h-2 w-2 rounded-full bg-amber-500" />
                        <span className="text-xs text-muted-foreground font-medium">Pending</span>
                    </div>
                    <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-3 items-start md:items-end">
                <div className="flex-1 relative w-full md:max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by invoice #, client, email, amount..."
                        className="pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="Paid">Paid</SelectItem>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="Overdue">Overdue</SelectItem>
                        <SelectItem value="Cancelled">Cancelled</SelectItem>
                    </SelectContent>
                </Select>
                <div className="flex items-center gap-2">
                    <Input
                        type="date"
                        className="w-[150px]"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        placeholder="From"
                    />
                    <span className="text-muted-foreground text-sm">to</span>
                    <Input
                        type="date"
                        className="w-[150px]"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        placeholder="To"
                    />
                </div>
                {hasActiveFilters && (
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground hover:text-destructive">
                        <X className="h-3 w-3 mr-1" /> Clear
                    </Button>
                )}
            </div>

            {/* Results count */}
            <div className="text-xs text-muted-foreground">
                Showing {paginatedInvoices.length} of {filteredInvoices.length} invoices
                {hasActiveFilters && ` (filtered from ${invoices.length} total)`}
            </div>

            {/* Table */}
            <div className="bg-card rounded-xl border overflow-hidden shadow-sm">
                <ScrollableContainer maxHeight="60vh">
                    <Table wrapperClassName="overflow-visible">
                        <TableHeader className="sticky top-0 z-10 bg-card shadow-sm border-b">
                            <TableRow>
                                <TableHead>
                                    <button onClick={() => handleSort("invoiceNumber")} className="flex items-center hover:text-primary transition-colors font-bold uppercase text-[11px] tracking-wider whitespace-nowrap">
                                        Invoice # {getSortIcon("invoiceNumber")}
                                    </button>
                                </TableHead>
                                <TableHead>
                                    <button onClick={() => handleSort("clientName")} className="flex items-center hover:text-primary transition-colors font-bold uppercase text-[11px] tracking-wider whitespace-nowrap">
                                        Client {getSortIcon("clientName")}
                                    </button>
                                </TableHead>
                                <TableHead>
                                    <button onClick={() => handleSort("createdAt")} className="flex items-center hover:text-primary transition-colors font-bold uppercase text-[11px] tracking-wider whitespace-nowrap">
                                        Date {getSortIcon("createdAt")}
                                    </button>
                                </TableHead>
                                <TableHead>
                                    <button onClick={() => handleSort("amount")} className="flex items-center hover:text-primary transition-colors font-bold uppercase text-[11px] tracking-wider whitespace-nowrap">
                                        Amount {getSortIcon("amount")}
                                    </button>
                                </TableHead>
                                <TableHead>
                                    <button onClick={() => handleSort("status")} className="flex items-center hover:text-primary transition-colors font-bold uppercase text-[11px] tracking-wider whitespace-nowrap">
                                        Status {getSortIcon("status")}
                                    </button>
                                </TableHead>
                                <TableHead className="text-right font-bold uppercase text-[11px] tracking-wider whitespace-nowrap">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-64 text-center">
                                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-2" />
                                        <p className="text-sm text-muted-foreground">Loading invoices...</p>
                                    </TableCell>
                                </TableRow>
                            ) : paginatedInvoices.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-64 text-center">
                                        <div className="bg-muted/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Receipt className="h-8 w-8 text-muted-foreground opacity-20" />
                                        </div>
                                        <p className="text-muted-foreground italic">
                                            {hasActiveFilters ? "No invoices match your filters." : "No invoices found. Create your first invoice!"}
                                        </p>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedInvoices.map((invoice) => (
                                    <TableRow key={invoice._id} className="hover:bg-accent/50 transition-colors">
                                        <TableCell>
                                            <span className="font-mono font-bold text-primary tracking-wider text-sm">
                                                {invoice.invoiceNumber || invoice._id?.slice(-8).toUpperCase()}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium text-sm capitalize">{invoice.client?.name || "N/A"}</span>
                                                <span className="text-[10px] text-muted-foreground truncate max-w-[180px]">
                                                    {invoice.client?.company || invoice.client?.email || ""}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {new Date(invoice.date || invoice.createdAt).toLocaleDateString("en-IN", {
                                                day: "2-digit", month: "short", year: "numeric"
                                            })}
                                        </TableCell>
                                        <TableCell className="font-semibold text-sm">
                                            ₹{formatINR(invoice.amount)}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={`${getStatusColor(invoice.status)} text-xs font-semibold`}>
                                                {invoice.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    title="View Invoice"
                                                    onClick={() => {
                                                        setSelectedInvoice(invoice);
                                                        setIsViewOpen(true);
                                                    }}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                                    title="Delete Invoice"
                                                    onClick={() => {
                                                        setSelectedInvoice(invoice);
                                                        setRemoveFromRevenue(true);
                                                        setIsDeleteOpen(true);
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </ScrollableContainer>

                {totalPages > 1 && (
                    <div className="p-4 border-t bg-muted/20">
                        <DataPagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                        />
                    </div>
                )}
            </div>

            {/* ============= CREATE INVOICE DIALOG ============= */}
            <Dialog open={isCreateOpen} onOpenChange={(open) => { if (!open) resetForm(); setIsCreateOpen(open); }}>
                <DialogContent className="sm:max-w-[650px] p-0 flex flex-col max-h-[90vh] gap-0">
                    {/* Fixed Header */}
                    <div className="p-6 pb-4 border-b shrink-0">
                        <DialogTitle className="flex items-center gap-2 text-lg">
                            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Plus className="h-4 w-4 text-primary" />
                            </div>
                            Create New Invoice
                        </DialogTitle>
                        <DialogDescription className="mt-1">
                            Fill in the details below to generate a new GST tax invoice.
                        </DialogDescription>
                    </div>

                    {/* Scrollable Body */}
                    <form onSubmit={handleCreateInvoice} className="flex flex-col flex-1 min-h-0">
                        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">

                            {/* Client Selection */}
                            <div className="space-y-3">
                                <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                    <User className="h-3.5 w-3.5" /> Client Details
                                </Label>
                                <Select onValueChange={handleClientSelect}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select existing client or enter manually..." />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-[250px]">
                                        <SelectItem value="manual">✏️ Enter Manually</SelectItem>
                                        {clients.map(c => (
                                            <SelectItem key={c._id} value={c._id}>
                                                <span className="capitalize">{c.name}</span>
                                                {c.company && <span className="text-muted-foreground ml-1">({c.company})</span>}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="clientName" className="text-xs">Client Name <span className="text-destructive">*</span></Label>
                                        <Input
                                            id="clientName"
                                            placeholder="John Doe"
                                            value={formData.clientName}
                                            onChange={(e) => setFormData(prev => ({ ...prev, clientName: e.target.value }))}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="clientCompany" className="text-xs">Company</Label>
                                        <Input
                                            id="clientCompany"
                                            placeholder="Acme Corp"
                                            value={formData.clientCompany}
                                            onChange={(e) => setFormData(prev => ({ ...prev, clientCompany: e.target.value }))}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="clientEmail" className="text-xs">Email</Label>
                                        <Input
                                            id="clientEmail"
                                            type="email"
                                            placeholder="email@example.com"
                                            value={formData.clientEmail}
                                            onChange={(e) => setFormData(prev => ({ ...prev, clientEmail: e.target.value }))}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="clientPhone" className="text-xs">Phone</Label>
                                        <Input
                                            id="clientPhone"
                                            placeholder="+91 9876543210"
                                            value={formData.clientPhone}
                                            onChange={(e) => setFormData(prev => ({ ...prev, clientPhone: e.target.value }))}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="clientState" className="text-xs">State</Label>
                                        <Input
                                            id="clientState"
                                            placeholder="Madhya Pradesh"
                                            value={formData.clientState}
                                            onChange={(e) => setFormData(prev => ({ ...prev, clientState: e.target.value }))}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="clientGstNo" className="text-xs">GST No</Label>
                                        <Input
                                            id="clientGstNo"
                                            placeholder="23AADCF5985D1ZO"
                                            value={formData.clientGstNo}
                                            onChange={(e) => setFormData(prev => ({ ...prev, clientGstNo: e.target.value.toUpperCase() }))}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Invoice Details */}
                            <div className="space-y-3 border-t pt-4">
                                <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                    <Calendar className="h-3.5 w-3.5" /> Invoice Info
                                </Label>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="invDate" className="text-xs">Invoice Date</Label>
                                        <Input
                                            id="invDate"
                                            type="date"
                                            value={formData.date}
                                            onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="invStatus" className="text-xs">Status</Label>
                                        <Select value={formData.status} onValueChange={(v) => setFormData(prev => ({ ...prev, status: v }))}>
                                            <SelectTrigger id="invStatus">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Pending">Pending</SelectItem>
                                                <SelectItem value="Paid">Paid</SelectItem>
                                                <SelectItem value="Overdue">Overdue</SelectItem>
                                                <SelectItem value="Cancelled">Cancelled</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>

                            {/* Line Items */}
                            <div className="space-y-3 border-t pt-4">
                                <div className="flex items-center justify-between">
                                    <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                        <Receipt className="h-3.5 w-3.5" /> Line Items
                                    </Label>
                                    <Button type="button" variant="outline" size="sm" onClick={addItem} className="h-7 text-xs">
                                        <Plus className="h-3 w-3 mr-1" /> Add Item
                                    </Button>
                                </div>
                                <div className="space-y-2">
                                    {formData.items.map((item, idx) => (
                                        <div key={idx} className="bg-muted/20 rounded-lg p-3 border space-y-2">
                                            <div className="flex items-start gap-2">
                                                <div className="flex-1 space-y-1">
                                                    <Label className="text-[10px] text-muted-foreground">Description <span className="text-destructive">*</span></Label>
                                                    <Input
                                                        placeholder="e.g. Website Development, SEO Service..."
                                                        value={item.description}
                                                        onChange={(e) => updateItem(idx, "description", e.target.value)}
                                                        className="text-sm h-9"
                                                        required
                                                    />
                                                </div>
                                                {formData.items.length > 1 && (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 mt-5 text-destructive hover:bg-destructive/10 shrink-0"
                                                        onClick={() => removeItem(idx)}
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-3 gap-2">
                                                <div className="space-y-1">
                                                    <Label className="text-[10px] text-muted-foreground">Qty</Label>
                                                    <Input
                                                        type="number"
                                                        min="1"
                                                        value={item.qty}
                                                        onChange={(e) => updateItem(idx, "qty", e.target.value)}
                                                        className="text-sm h-9"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-[10px] text-muted-foreground">Rate (₹) <span className="text-destructive">*</span></Label>
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        placeholder="0"
                                                        value={item.rate || ""}
                                                        onChange={(e) => updateItem(idx, "rate", e.target.value)}
                                                        className="text-sm h-9"
                                                        required
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-[10px] text-muted-foreground">Amount</Label>
                                                    <div className="h-9 flex items-center px-3 bg-muted/80 rounded-md text-sm font-semibold">
                                                        ₹{formatINR(item.amount || 0)}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Total Breakdown with GST */}
                                <div className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-xl p-4 space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Sub Total</span>
                                        <span className="font-medium">₹{formatINR(subTotal)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">GST @ 18%</span>
                                        <span className="font-medium text-amber-600">+ ₹{formatINR(gstAmount)}</span>
                                    </div>
                                    <div className="border-t border-primary/20 my-1" />
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-bold">Total Amount (incl. GST)</span>
                                        <span className="text-xl font-bold text-primary">₹{formatINR(grandTotal)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Notes */}
                            <div className="space-y-1.5 border-t pt-4">
                                <Label htmlFor="invNotes" className="text-xs">Notes (optional)</Label>
                                <Textarea
                                    id="invNotes"
                                    placeholder="e.g. Thank you for your business!"
                                    rows={2}
                                    value={formData.notes}
                                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                                    className="resize-none text-sm"
                                />
                            </div>

                            {/* Revenue Toggle */}
                            <div className="flex items-center justify-between bg-muted/30 border rounded-lg p-3">
                                <div className="flex flex-col">
                                    <span className="text-sm font-semibold">Add to Revenue</span>
                                    <span className="text-[11px] text-muted-foreground">Include this invoice in revenue analytics</span>
                                </div>
                                <Switch
                                    checked={formData.addToRevenue}
                                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, addToRevenue: checked }))}
                                />
                            </div>
                        </div>

                        {/* Fixed Footer */}
                        <div className="p-4 border-t bg-muted/10 shrink-0 flex items-center justify-end gap-3">
                            <Button type="button" variant="outline" onClick={() => { resetForm(); setIsCreateOpen(false); }}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting} className="min-w-[140px]">
                                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                Create Invoice
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ============= VIEW INVOICE DIALOG ============= */}
            <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
                <DialogContent className="max-w-5xl p-0 border-none bg-slate-100 flex flex-col max-h-[95vh] outline-none">
                    <DialogTitle className="sr-only">Invoice Details - {selectedInvoice?.invoiceNumber}</DialogTitle>
                    {selectedInvoice ? (
                        <>
                            {/* Toolbar */}
                            <div className="flex items-center justify-between p-4 bg-white border-b z-20 shrink-0 select-none">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                        <Info className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-900 leading-none mb-1">Tax Invoice</h3>
                                        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                                            {selectedInvoice.invoiceNumber || "Draft Invoice"}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="default"
                                        size="sm"
                                        onClick={() => handleDownload(selectedInvoice)}
                                        className="hidden sm:flex items-center gap-2 bg-primary hover:bg-primary/90"
                                    >
                                        <Download className="h-4 w-4" />
                                        Download PDF
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => setIsViewOpen(false)}>
                                        Close
                                    </Button>
                                </div>
                            </div>

                            {/* Scrollable Invoice */}
                            <div
                                className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-200/40 outline-none relative overscroll-contain"
                                tabIndex={0}
                                style={{ touchAction: "pan-y", WebkitOverflowScrolling: "touch", scrollbarWidth: "thin" }}
                                autoFocus
                                onKeyDown={(e) => {
                                    if (e.key === "ArrowDown") e.currentTarget.scrollTop += 40;
                                    if (e.key === "ArrowUp") e.currentTarget.scrollTop -= 40;
                                }}
                            >
                                <div className="mx-auto shadow-2xl bg-white rounded-sm mb-10 pointer-events-auto relative z-10 select-none">
                                    <InvoiceLayout ref={invoiceRef} invoice={selectedInvoice} />
                                </div>

                                {/* Mobile Download */}
                                <div className="sm:hidden mt-4 pb-4">
                                    <Button variant="default" className="w-full" onClick={() => handleDownload(selectedInvoice)}>
                                        <Download className="h-4 w-4 mr-2" />
                                        Download PDF
                                    </Button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="py-20 text-center text-muted-foreground bg-white rounded-xl w-full">
                            <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4 text-primary" />
                            <p className="font-medium">Preparing your invoice...</p>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* ============= DELETE CONFIRMATION DIALOG ============= */}
            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <DialogContent className="sm:max-w-[450px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-destructive">
                            <AlertTriangle className="h-5 w-5" />
                            Delete Invoice
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete invoice{" "}
                            <span className="font-bold text-foreground">{selectedInvoice?.invoiceNumber}</span>?
                            This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4">
                        {selectedInvoice && (
                            <div className="bg-muted/30 rounded-lg p-3 mb-4 text-sm space-y-1">
                                <p><span className="text-muted-foreground">Client:</span> <span className="font-medium capitalize">{selectedInvoice.client?.name}</span></p>
                                <p><span className="text-muted-foreground">Amount:</span> <span className="font-bold">₹{formatINR(selectedInvoice.amount)}</span></p>
                                <div className="flex items-center gap-1"><span className="text-muted-foreground">Status:</span> <Badge variant="outline" className={`${getStatusColor(selectedInvoice.status)} text-[10px]`}>{selectedInvoice.status}</Badge></div>
                            </div>
                        )}

                        <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-lg p-4">
                            <div className="flex flex-col">
                                <span className="text-sm font-semibold text-amber-800">Remove from Revenue</span>
                                <span className="text-[11px] text-amber-600">Also remove this invoice's amount from revenue calculations</span>
                            </div>
                            <Switch
                                checked={removeFromRevenue}
                                onCheckedChange={setRemoveFromRevenue}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteInvoice}
                            disabled={isDeleting}
                        >
                            {isDeleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Delete Invoice
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Hidden Print Portal */}
            <div className="opacity-0 pointer-events-none absolute -left-[5000px] h-0 overflow-hidden" aria-hidden="true">
                {selectedInvoice && !isViewOpen && (
                    <div id="invoice-hidden-print-portal">
                        <InvoiceLayout invoice={selectedInvoice} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default SuperAdminInvoicesTab;
