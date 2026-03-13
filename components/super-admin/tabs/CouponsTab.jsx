"use client";
import { useState, useEffect } from "react";
import {
    Ticket, Plus, Edit, Trash2, Search,
    Calendar, CheckCircle2, XCircle, Loader2,
    ArrowRight, Percent, Tag, ShieldCheck,
    ArrowUp, ArrowDown, ChevronsUpDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { getCoupons, upsertCoupon, deleteCoupon } from "@/lib/actions/coupon";
import { toast } from "sonner";
import { formatINR } from "@/lib/utils";
import DataPagination from "@/components/ui/DataPagination";
import { ScrollableContainer } from "@/components/ui/scrollable-container";


const SuperAdminCouponsTab = () => {
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState(null);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    const [formData, setFormData] = useState({
        code: "",
        description: "",
        discountType: "percentage",
        discountAmount: 0,
        minPurchase: 0,
        maxUsage: null,
        expiryDate: "",
        status: "active"
    });

    const fetchCoupons = async () => {
        setLoading(true);
        try {
            const data = await getCoupons();
            setCoupons(data);
        } catch (error) {
            console.error("Error fetching coupons:", error);
            toast.error("Failed to load coupons");
            setCoupons([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCoupons();
    }, []);

    const handleOpenDialog = (coupon = null) => {
        if (coupon) {
            setEditingCoupon(coupon);
            setFormData({
                ...coupon,
                expiryDate: coupon.expiryDate ? new Date(coupon.expiryDate).toISOString().split('T')[0] : ""
            });
        } else {
            setEditingCoupon(null);
            setFormData({
                code: "",
                description: "",
                discountType: "percentage",
                discountAmount: 0,
                minPurchase: 0,
                maxUsage: null,
                expiryDate: "",
                status: "active"
            });
        }
        setIsOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const result = await upsertCoupon({
                ...formData,
                id: editingCoupon?._id || editingCoupon?.id
            });

            if (result.success) {
                toast.success(editingCoupon ? "Coupon updated" : "Coupon created successfully");
                setIsOpen(false);
                fetchCoupons();
            } else {
                toast.error(result.error || "Failed to save coupon");
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this coupon?")) return;

        try {
            const result = await deleteCoupon(id);
            if (result.success) {
                toast.success("Coupon deleted");
                fetchCoupons();
            } else {
                toast.error("Failed to delete coupon");
            }
        } catch (error) {
            toast.error("An error occurred");
        }
    };

    const [sortConfig, setSortConfig] = useState({ key: "code", direction: "asc" });

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

    const filteredCoupons = coupons.filter(coupon =>
        coupon.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        coupon.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const sortedCoupons = [...filteredCoupons].sort((a, b) => {
        let aVal = a[sortConfig.key] || "";
        let bVal = b[sortConfig.key] || "";

        if (typeof aVal === 'string') aVal = aVal.toLowerCase();
        if (typeof bVal === 'string') bVal = bVal.toLowerCase();

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    const paginatedCoupons = sortedCoupons.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const totalPages = Math.ceil(filteredCoupons.length / itemsPerPage);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Tag className="h-6 w-6 text-primary" />
                        Coupon Management
                    </h1>
                    <p className="text-muted-foreground text-sm">Create and manage discount codes for checkout.</p>
                </div>
                <Button onClick={() => handleOpenDialog()} className="shadow-lg shadow-primary/20">
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Coupon
                </Button>
            </div>

            <div className="grid md:grid-cols-4 gap-4">
                <div className="md:col-span-2 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by code or description..."
                        className="pl-10"
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setCurrentPage(1);
                        }}
                    />
                </div>
            </div>

            <div className="bg-card rounded-xl border overflow-hidden shadow-sm">
                <ScrollableContainer maxHeight="60vh">
                    <Table wrapperClassName="overflow-visible">
                        <TableHeader className="sticky top-0 z-10 bg-card shadow-sm border-b">
                            <TableRow>
                                <TableHead>
                                    <button onClick={() => handleSort('code')} className="flex items-center hover:text-primary transition-colors font-bold uppercase text-[11px] tracking-wider whitespace-nowrap">
                                        Coupon Code {getSortIcon('code')}
                                    </button>
                                </TableHead>
                                <TableHead className="font-bold uppercase text-[11px] tracking-wider whitespace-nowrap">Discount</TableHead>
                                <TableHead className="font-bold uppercase text-[11px] tracking-wider whitespace-nowrap">Requirements</TableHead>
                                <TableHead className="font-bold uppercase text-[11px] tracking-wider whitespace-nowrap">Usage</TableHead>
                                <TableHead>
                                    <button onClick={() => handleSort('expiryDate')} className="flex items-center hover:text-primary transition-colors font-bold uppercase text-[11px] tracking-wider whitespace-nowrap">
                                        Expiry {getSortIcon('expiryDate')}
                                    </button>
                                </TableHead>
                                <TableHead>
                                    <button onClick={() => handleSort('status')} className="flex items-center hover:text-primary transition-colors font-bold uppercase text-[11px] tracking-wider whitespace-nowrap">
                                        Status {getSortIcon('status')}
                                    </button>
                                </TableHead>
                                <TableHead className="text-right font-bold uppercase text-[11px] tracking-wider whitespace-nowrap">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-64 text-center">
                                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-2" />
                                        <p className="text-sm text-muted-foreground">Loading coupon inventory...</p>
                                    </TableCell>
                                </TableRow>
                            ) : sortedCoupons.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-64 text-center">
                                        <div className="bg-muted/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Ticket className="h-8 w-8 text-muted-foreground opacity-20" />
                                        </div>
                                        <p className="text-muted-foreground italic">No coupons found matching your search.</p>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedCoupons.map((coupon) => (
                                    <TableRow key={coupon._id} className="hover:bg-accent/50 transition-colors">
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-mono font-bold text-primary tracking-wider">{coupon.code}</span>
                                                <span className="text-[10px] text-muted-foreground truncate max-w-[150px]">{coupon.description}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className="bg-primary/10 text-primary border-none">
                                                {coupon.discountType === 'percentage' ? (
                                                    <><Percent className="h-3 w-3 mr-1" /> {coupon.discountAmount}% OFF</>
                                                ) : (
                                                    <>₹{formatINR(coupon.discountAmount)} OFF</>
                                                )}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-xs">
                                            {coupon.minPurchase > 0 ? `Min: ₹${formatINR(coupon.minPurchase)}` : "No Minimum"}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                                                    <span>Used: {coupon.usedCount}</span>
                                                    {coupon.maxUsage && <span>Limit: {coupon.maxUsage}</span>}
                                                </div>
                                                {coupon.maxUsage && (
                                                    <div className="w-full h-1 bg-accent rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-primary"
                                                            style={{ width: `${Math.min((coupon.usedCount / coupon.maxUsage) * 100, 100)}%` }}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-xs">
                                            {coupon.expiryDate ? (
                                                <div className="flex items-center gap-1.5 font-medium">
                                                    <Calendar className="h-3 w-3 text-muted-foreground" />
                                                    {new Date(coupon.expiryDate).toLocaleDateString()}
                                                </div>
                                            ) : "Never Expires"}
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={coupon.status === 'active' ? 'bg-green-500' : 'bg-red-500'}>
                                                <span className="capitalize">{coupon.status}</span>
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(coupon)}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => handleDelete(coupon._id)}>
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


            {/* Create/Edit Dialog */}
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {editingCoupon ? <Edit className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                            {editingCoupon ? "Edit Coupon" : "Create Promotional Coupon"}
                        </DialogTitle>
                        <DialogDescription>
                            Configure your discount code details. Used codes will automatically track redemption.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="code">Coupon Code</Label>
                                <Input
                                    id="code"
                                    placeholder="SUMMER50"
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase().replace(/\s/g, '') })}
                                    required
                                    className="font-mono font-bold uppercase tracking-widest bg-muted/30"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="status">Status</Label>
                                <Select
                                    value={formData.status}
                                    onValueChange={(v) => setFormData({ ...formData, status: v })}
                                >
                                    <SelectTrigger id="status">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="inactive">Inactive</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Short Description</Label>
                            <Input
                                id="description"
                                placeholder="E.g. 50% discount on all platinum plans"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="discountType">Discount Type</Label>
                                <Select
                                    value={formData.discountType}
                                    onValueChange={(v) => setFormData({ ...formData, discountType: v })}
                                >
                                    <SelectTrigger id="discountType">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="percentage">Percentage (%)</SelectItem>
                                        <SelectItem value="fixed">Fixed Amount (₹)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="amount">Value ({formData.discountType === 'percentage' ? '%' : '₹'})</Label>
                                <Input
                                    id="amount"
                                    type="number"
                                    value={formData.discountAmount}
                                    onChange={(e) => setFormData({ ...formData, discountAmount: parseFloat(e.target.value) || 0 })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-2 border-t mt-4">
                            <div className="space-y-2">
                                <Label htmlFor="minPurchase">Min Purchase (₹)</Label>
                                <Input
                                    id="minPurchase"
                                    type="number"
                                    value={formData.minPurchase}
                                    onChange={(e) => setFormData({ ...formData, minPurchase: parseFloat(e.target.value) || 0 })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="maxUsage">Usage Limit (Optional)</Label>
                                <Input
                                    id="maxUsage"
                                    type="number"
                                    placeholder="Unlimited"
                                    value={formData.maxUsage || ""}
                                    onChange={(e) => setFormData({ ...formData, maxUsage: parseInt(e.target.value) || null })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="expiry">Expiry Date (Optional)</Label>
                            <Input
                                id="expiry"
                                type="date"
                                value={formData.expiryDate}
                                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                            />
                        </div>

                        <DialogFooter className="pt-6">
                            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                {editingCoupon ? "Save Changes" : "Create Coupon"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default SuperAdminCouponsTab;
