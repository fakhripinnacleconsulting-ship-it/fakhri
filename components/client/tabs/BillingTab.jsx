"use client";

import { useState, useEffect, useRef } from "react";
import { Download, Eye, CreditCard, Loader2, Trash2, Plus, Info } from "lucide-react";
import StatusBadge from "@/components/dashboard/StatusBadge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { formatINR, calculatePeriodDays } from "@/lib/utils";
import { ScrollableContainer } from "@/components/ui/scrollable-container";
import { ArrowUp, ArrowDown, ChevronsUpDown } from "lucide-react";
import { getInvoices, getInvoiceSummary } from "@/lib/actions/invoice";
import {
    updatePaymentMethod,
    setDefaultPaymentMethod,
    deletePaymentMethod
} from "@/lib/actions/user";
import { getPricingPlans } from "@/lib/actions/content";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter,
    DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { NoPlanState } from "@/components/client/NoPlanState";
import DataPagination from "@/components/ui/DataPagination";
import InvoiceLayout from "@/components/invoice/InvoiceLayout";

const ClientBillingTab = ({ currentUser }) => {
    const [loading, setLoading] = useState(true);
    const [client, setClient] = useState(null);
    const [invoices, setInvoices] = useState([]);
    const [summary, setSummary] = useState(null);
    const [planDetails, setPlanDetails] = useState(null);

    // Dialog states
    const [isViewOpen, setIsViewOpen] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const invoiceRef = useRef(null);
    const [isAddCardOpen, setIsAddCardOpen] = useState(false);

    // New Card Form State
    const [newCard, setNewCard] = useState({
        brand: "Visa",
        last4: "",
        expiry: "",
        cardholderName: "",
        isDefault: false
    });

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 9;

    // Sorting Config
    const [sortConfig, setSortConfig] = useState({ key: "createdAt", direction: "desc" });

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

    const sortedInvoices = [...invoices].sort((a, b) => {
        if (!sortConfig.key) return 0;
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];

        if (sortConfig.key === 'createdAt') {
            aVal = new Date(aVal).getTime();
            bVal = new Date(bVal).getTime();
        }

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    const totalPages = Math.ceil(sortedInvoices.length / itemsPerPage);
    const paginatedInvoices = sortedInvoices.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const loadBillingData = async () => {
        if (!currentUser) {
            setLoading(false);
            return;
        }

        try {
            // Fetch invoices, summary and master plan data
            const [invoicesRes, summaryRes, plans] = await Promise.all([
                getInvoices({ clientId: currentUser._id, limit: 100 }),
                getInvoiceSummary(currentUser._id),
                getPricingPlans()
            ]);

            setInvoices(invoicesRes.invoices || []);
            setSummary(summaryRes);

            // Find the user's current plan details
            if (currentUser.plan) {
                const currentPlan = plans.find(p =>
                    p.name.toLowerCase().trim() === currentUser.plan.toLowerCase().trim()
                );
                setPlanDetails(currentPlan);
            }
        } catch (error) {
            console.error("Error loading client billing data:", error);
            toast.error("Failed to load billing details");
        }
    };

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            setClient(currentUser);
            await loadBillingData();
            setLoading(false);
        };
        init();
    }, [currentUser]);

    const handleSetDefault = async (index) => {
        try {
            const res = await setDefaultPaymentMethod(client._id, index);
            if (res.success) {
                setClient(res.user);
                toast.success("Default payment method updated");
            } else {
                toast.error(res.error || "Failed to update default method");
            }
        } catch (error) {
            toast.error("An error occurred");
        }
    };

    const handleDeleteMethod = async (index) => {
        if (!confirm("Are you sure you want to remove this payment method?")) return;
        try {
            const res = await deletePaymentMethod(client._id, index);
            if (res.success) {
                setClient(res.user);
                toast.success("Payment method removed");
            } else {
                toast.error(res.error || "Failed to remove method");
            }
        } catch (error) {
            toast.error("An error occurred");
        }
    };

    const handleAddCard = async () => {
        if (!newCard.last4 || !newCard.expiry || !newCard.cardholderName) {
            toast.error("Please fill in all card details");
            return;
        }

        if (newCard.last4.length !== 4) {
            toast.error("Last 4 digits must be exactly 4 numbers");
            return;
        }

        try {
            const res = await updatePaymentMethod(client._id, {
                ...newCard,
                providerId: `pm_fake_${Date.now()}` // Generating a mock provider ID for logic check
            });
            if (res.success) {
                setClient(res.user);
                setIsAddCardOpen(false);
                setNewCard({ brand: "Visa", last4: "", expiry: "", cardholderName: "", isDefault: false });
                toast.success("Payment method added successfully");
            } else {
                toast.error(res.error || "Failed to add method");
            }
        } catch (error) {
            toast.error("An error occurred");
        }
    };

    const handleDownload = (invoice) => {
        // If there's a pre-generated URL, use it
        const url = invoice.url || invoice.downloadUrl;
        if (url) {
            window.open(url, '_blank');
            return;
        }

        // Set the invoice to be rendered in our hidden portal
        setSelectedInvoice(invoice);
        toast.info("Preparing PDF for download...");

        // Wait for React to render the component in the hidden portal
        setTimeout(() => {
            const containers = document.querySelectorAll('#invoice-container');
            // Prefer the latest rendered container (from the hidden portal or dialog)
            const printContent = containers[containers.length - 1];

            if (printContent) {
                executePrint(invoice, printContent);
            } else {
                toast.error("Could not generate PDF. Please try 'View' first.");
            }
        }, 500);
    };

    const executePrint = (invoice, content) => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            toast.error("Popup blocked! Please allow popups to download invoices.");
            return;
        }

        printWindow.document.write(`
            <html>
                <head>
                    <title>Invoice - ${invoice.invoiceNumber || 'Draft'}</title>
                    <link rel="stylesheet" href="${window.location.origin}/_next/static/css/app/layout.css">
                    <script src="https://cdn.tailwindcss.com"></script>
                    <style>
                        @page { size: A4; margin: 0; }
                        body { padding: 0; margin: 0; background: white; }
                        #invoice-container { 
                            box-shadow: none !important; 
                            border: none !important; 
                            width: 210mm !important; 
                            margin: 0 !important;
                            padding: 0.5in !important;
                            visibility: visible !important;
                            display: block !important;
                        }
                        @media print {
                            .no-print { display: none !important; }
                        }
                        /* Ensure font rendering is optimized for print */
                        * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                    </style>
                </head>
                <body>
                    <div style="width: 210mm; margin: 0 auto;">
                        ${content.outerHTML}
                    </div>
                    <script>
                        window.onload = () => {
                            setTimeout(() => {
                                window.print();
                                window.close();
                            }, 800);
                        };
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground animate-pulse">Loading billing information...</p>
            </div>
        );
    }

    if (!client) {
        return (
            <div className="bg-card rounded-xl border p-12 text-center">
                <h2 className="text-xl font-semibold mb-2">Account Not Found</h2>
                <p className="text-muted-foreground">We couldn't load your billing details. Please contact support.</p>
            </div>
        );
    }

    // Calculate next payment date (based on period)
    const planDays = calculatePeriodDays(planDetails?.period || client.plan);
    const nextPaymentDate = new Date(client?.joinedDate || Date.now());

    // If joinedDate was long ago, find the next occurrence in the future
    const now = new Date();
    while (nextPaymentDate < now) {
        nextPaymentDate.setDate(nextPaymentDate.getDate() + planDays);
    }

    const nextPaymentDateString = nextPaymentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    if ((!client.plan || client.plan === "None") && invoices.length === 0) {
        return (
            <NoPlanState
                title="Billing & Invoices"
                message="Your billing history and invoices will appear here once you have an active subscription or make a purchase."
            />
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="font-heading text-2xl font-bold mb-2">Billing</h1>
                <p className="text-muted-foreground">View your invoices and payment history.</p>
            </div>

            {/* Payment Summary */}
            <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-card rounded-xl border p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <CreditCard className="h-5 w-5 text-primary" />
                        <span className="text-sm text-muted-foreground">Current Plan</span>
                    </div>
                    <p className="text-2xl font-heading font-bold capitalize">{client.plan && client.plan !== "None" ? client.plan : "No Active Plan"}</p>
                    <p className="text-sm font-medium text-primary">
                        {client.plan && client.plan !== "None" ? `${planDetails?.prices?.monthly || "Custom Pricing"} / ${planDetails?.period || "month"}` : "-"}
                    </p>
                    <p className="text-[10px] text-muted-foreground capitalize">Status: {client.plan && client.plan !== "None" ?
                        // (client.status || "Active") 
                        ""
                        : "-"}</p>
                </div>
                <div className="bg-card rounded-xl border p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <CreditCard className="h-5 w-5 text-primary" />
                        <span className="text-sm text-muted-foreground">Next Payment</span>
                    </div>
                    <p className="text-2xl font-heading font-bold">{client.plan && client.plan !== "None" ? nextPaymentDateString : "N/A"}</p>
                    <p className="text-sm text-muted-foreground">{client.plan && client.plan !== "None" ? "Monthly recurrence" : "No payment scheduled"}</p>
                </div>
                <div className="bg-card rounded-xl border p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <CreditCard className="h-5 w-5 text-primary" />
                        <span className="text-sm text-muted-foreground">Total Paid</span>
                    </div>
                    <p className="text-2xl font-heading font-bold">₹{formatINR(summary?.totalAmount || 0)}</p>
                    <p className="text-sm text-muted-foreground">{summary?.paidCount || 0} invoices paid</p>
                </div>
            </div>

            {/* Invoice Table */}
            <div className="bg-card rounded-xl border flex-1 min-h-0 flex flex-col mb-2 overflow-hidden shadow-sm">
                <div className="p-4 border-b shrink-0 bg-card z-20">
                    <h2 className="font-heading font-semibold">Invoice History</h2>
                </div>
                <ScrollableContainer className="flex-1 overflow-auto h-full" maxHeight="60vh">
                    <Table wrapperClassName="overflow-visible">
                        <TableHeader className="sticky top-0 z-10 bg-card shadow-sm border-b">
                            <TableRow className="bg-muted/50 hover:bg-muted/50">
                                <TableHead className="sticky top-0 z-10 bg-muted/50">
                                    <button onClick={() => handleSort('invoiceNumber')} className="flex items-center hover:text-primary transition-colors font-bold uppercase text-[11px] tracking-wider whitespace-nowrap">
                                        Invoice # {getSortIcon('invoiceNumber')}
                                    </button>
                                </TableHead>
                                <TableHead className="sticky top-0 z-10 bg-muted/50">
                                    <button onClick={() => handleSort('createdAt')} className="flex items-center hover:text-primary transition-colors font-bold uppercase text-[11px] tracking-wider whitespace-nowrap">
                                        Date {getSortIcon('createdAt')}
                                    </button>
                                </TableHead>
                                <TableHead className="sticky top-0 z-10 bg-muted/50">
                                    <button onClick={() => handleSort('amount')} className="flex items-center hover:text-primary transition-colors font-bold uppercase text-[11px] tracking-wider whitespace-nowrap">
                                        Amount {getSortIcon('amount')}
                                    </button>
                                </TableHead>
                                <TableHead className="sticky top-0 z-10 bg-muted/50">
                                    <button onClick={() => handleSort('status')} className="flex items-center hover:text-primary transition-colors font-bold uppercase text-[11px] tracking-wider whitespace-nowrap">
                                        Status {getSortIcon('status')}
                                    </button>
                                </TableHead>
                                <TableHead className="text-right sticky top-0 z-10 bg-muted/50 font-bold uppercase text-[11px] tracking-wider whitespace-nowrap">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedInvoices.length > 0 ? (
                                paginatedInvoices.map((invoice) => (
                                    <TableRow key={invoice._id}>
                                        <TableCell className="font-medium">{invoice.invoiceNumber || invoice._id.slice(-8).toUpperCase()}</TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {new Date(invoice.createdAt).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>₹{formatINR(invoice.amount)}</TableCell>
                                        <TableCell>
                                            <StatusBadge status={invoice.status} />
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        setSelectedInvoice(invoice);
                                                        setIsViewOpen(true);
                                                    }}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDownload(invoice)}
                                                >
                                                    <Download className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                                        No invoices found.
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

            {/* Invoice View Dialog */}
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
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setIsViewOpen(false)}
                                    >
                                        Close
                                    </Button>
                                </div>
                            </div>

                            {/* Scrollable Area - Highly optimized for Mouse, Keys, and Touch */}
                            <div
                                className="flex-1 overflow-y-auto p-4 md:p-8 main-invoice-scroll bg-slate-200/40 outline-none relative overscroll-contain"
                                tabIndex={0}
                                style={{
                                    touchAction: 'pan-y',
                                    WebkitOverflowScrolling: 'touch',
                                    scrollbarWidth: 'thin'
                                }}
                                autoFocus
                                onKeyDown={(e) => {
                                    // Manually handle arrow keys if focus is lost
                                    if (e.key === 'ArrowDown') e.currentTarget.scrollTop += 40;
                                    if (e.key === 'ArrowUp') e.currentTarget.scrollTop -= 40;
                                    if (e.key === 'PageDown') e.currentTarget.scrollTop += 200;
                                    if (e.key === 'PageUp') e.currentTarget.scrollTop -= 200;
                                }}
                            >
                                <div className="mx-auto shadow-2xl bg-white rounded-sm mb-10 pointer-events-auto relative z-10 select-none">
                                    <InvoiceLayout ref={invoiceRef} invoice={selectedInvoice} />
                                </div>

                                {/* Mobile Download Button */}
                                <div className="sm:hidden mt-4 pb-4">
                                    <Button
                                        variant="default"
                                        className="w-full"
                                        onClick={() => handleDownload(selectedInvoice)}
                                    >
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

            {/* Hidden Print Portal - Ensures 'Download' button in table always works directly */}
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

export default ClientBillingTab;
