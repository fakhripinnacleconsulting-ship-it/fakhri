"use client";

import { useState, useEffect } from "react";
import {
    MessageSquare,
    Mail,
    Briefcase,
    CheckCircle2,
    XCircle,
    Trash2,
    Loader2,
    RefreshCcw,
    Eye,
    UserCircle,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    Search,
    ChevronUp,
    ChevronDown,
    ChevronsUpDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { getAllResponses, updateResponseStatus, deleteResponse } from "@/lib/actions/responses";
import { getProfileUpdateRequests, approveProfileUpdateRequest, rejectProfileUpdateRequest } from "@/lib/actions/profile-requests";
import { toast } from "sonner";
import { format } from "date-fns";

import { ScrollableContainer } from "@/components/ui/scrollable-container";
import DataPagination from "@/components/ui/DataPagination";

export default function SuperAdminResponsesTab() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({ feedback: [], contacts: [], applications: [], profileRequests: [] });
    const [refreshing, setRefreshing] = useState(false);

    // View Dialog State
    const [selectedItem, setSelectedItem] = useState(null);
    const [viewType, setViewType] = useState(null); // 'feedback', 'contact', 'career', 'profile-update'
    const [editData, setEditData] = useState(null); // For profile update editing

    const [searchQuery, setSearchQuery] = useState("");
    const [sortConfig, setSortConfig] = useState({ key: "createdAt", direction: "desc" });

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

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 9;

    const loadData = async () => {
        setLoading(true);
        try {
            const responses = await getAllResponses();
            console.log("Responses received:", responses);
            setData(responses);
        } catch (error) {
            console.error("Error loading responses:", error);
            toast.error("Failed to load responses");
        } finally {
            setLoading(false);
        }
    };

    const sortAndFilter = (list, searchFields) => {
        let result = list.filter(item =>
            searchFields.some(field => {
                // Handle nested fields like client.name
                const fields = field.split('.');
                let value = item;
                for (const f of fields) {
                    value = value?.[f];
                    if (value === undefined || value === null) return false;
                }
                return value.toString().toLowerCase().includes(searchQuery.toLowerCase());
            })
        );

        if (sortConfig.key) {
            result = [...result].sort((a, b) => {
                // Handle nested fields for sorting
                const getValue = (obj, key) => {
                    const keys = key.split('.');
                    let value = obj;
                    for (const k of keys) {
                        value = value?.[k];
                        if (value === undefined || value === null) return "";
                    }
                    return value;
                };

                let aVal = getValue(a, sortConfig.key);
                let bVal = getValue(b, sortConfig.key);

                if (sortConfig.key === 'createdAt') {
                    aVal = new Date(aVal).getTime();
                    bVal = new Date(bVal).getTime();
                } else if (typeof aVal === 'string') {
                    aVal = aVal.toLowerCase();
                    bVal = bVal.toLowerCase();
                }

                if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return result;
    };

    const filteredFeedback = sortAndFilter(data.feedback, ['clientName', 'client.name', 'client.email', 'message', 'rating']);
    const filteredContacts = sortAndFilter(data.contacts, ['name', 'email', 'service', 'message']);
    const filteredApplications = sortAndFilter(data.applications, ['fullName', 'email', 'jobTitle']);
    const filteredProfileRequests = sortAndFilter(data.profileRequests, ['userName', 'userRole']);

    useEffect(() => {
        loadData().finally(() => setLoading(false));
    }, []);

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
        toast.success("Refreshed");
    };

    const handleStatusUpdate = async (type, id, newStatus) => {
        try {
            const res = await updateResponseStatus(type, id, newStatus);
            if (res.success) {
                toast.success("Status updated");
                loadData();
                if (selectedItem && selectedItem._id === id) {
                    setSelectedItem(prev => ({ ...prev, status: newStatus }));
                }
            } else {
                toast.error("Failed to update status");
            }
        } catch (error) {
            toast.error("Error updating status");
        }
    };

    const handleDelete = async (type, id) => {
        if (!confirm("Are you sure you want to delete this item?")) return;
        try {
            const res = await deleteResponse(type, id);
            if (res.success) {
                toast.success("Item deleted");
                loadData();
                setSelectedItem(null);
            } else {
                toast.error("Failed to delete item");
            }
        } catch (error) {
            toast.error("Error deleting item");
        }
    };

    const handleApproveRequest = async (id) => {
        const notes = prompt("Enter notes for the client (optional):", "Approved and applied.");
        if (notes === null) return;
        try {
            const res = await approveProfileUpdateRequest(id, editData, notes);
            if (res.success) {
                toast.success("Request approved and profile updated");
                loadData();
                setSelectedItem(null);
            } else {
                toast.error("Failed to approve: " + res.error);
            }
        } catch (error) {
            toast.error("Error approving request");
        }
    };

    const handleRejectRequest = async (id) => {
        const notes = prompt("Enter reason for rejection (optional):");
        if (notes === null) return;
        try {
            const res = await rejectProfileUpdateRequest(id, notes);
            if (res.success) {
                toast.success("Request rejected");
                loadData();
                setSelectedItem(null);
            } else {
                toast.error("Failed to reject: " + res.error);
            }
        } catch (error) {
            toast.error("Error rejecting request");
        }
    };

    const openViewDialog = (item, type) => {
        setSelectedItem(item);
        setViewType(type);
        if (type === 'profile-update') {
            setEditData({ ...item.newData });
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Loading responses...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Responses</h2>
                    <p className="text-muted-foreground">Manage feedback, inquiries, job applications, and profile updates.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search responses..."
                            className="pl-9"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setCurrentPage(1);
                            }}
                        />
                    </div>
                    <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
                        <RefreshCcw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="feedback" className="w-full flex-1 flex flex-col min-h-0" onValueChange={() => {
                setCurrentPage(1);
                setSearchQuery("");
            }}>
                <TabsList className="grid w-full grid-cols-4 max-w-[800px] mb-4">
                    <TabsTrigger value="feedback" className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Feedback
                        <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">{data.feedback.length}</Badge>
                    </TabsTrigger>
                    <TabsTrigger value="contact" className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Inquiries
                        <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">{data.contacts.length}</Badge>
                    </TabsTrigger>
                    <TabsTrigger value="career" className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4" />
                        Careers
                        <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">{data.applications.length}</Badge>
                    </TabsTrigger>
                    <TabsTrigger value="profile" className="flex items-center gap-2">
                        <UserCircle className="h-4 w-4" />
                        Profile
                        <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">{data.profileRequests.filter(r => r.status === 'pending').length}</Badge>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="feedback" className="mt-0 space-y-4">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle>Client Feedback</CardTitle>
                            <CardDescription>Feedback submitted by clients from their dashboard.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="bg-card rounded-xl border overflow-hidden">
                                <ScrollableContainer maxHeight="60vh">
                                    <Table wrapperClassName="overflow-visible">
                                        <TableHeader className="sticky top-0 z-10 bg-card shadow-sm">
                                            <TableRow>
                                                <TableHead>
                                                    <button onClick={() => handleSort('clientName')} className="flex items-center hover:text-primary transition-colors font-bold uppercase text-[11px] tracking-wider whitespace-nowrap">
                                                        User {getSortIcon('clientName')}
                                                    </button>
                                                </TableHead>
                                                <TableHead>
                                                    <button onClick={() => handleSort('email')} className="flex items-center hover:text-primary transition-colors font-bold uppercase text-[11px] tracking-wider whitespace-nowrap">
                                                        Email {getSortIcon('email')}
                                                    </button>
                                                </TableHead>
                                                <TableHead>
                                                    <button onClick={() => handleSort('rating')} className="flex items-center hover:text-primary transition-colors font-bold uppercase text-[11px] tracking-wider whitespace-nowrap">
                                                        Rating {getSortIcon('rating')}
                                                    </button>
                                                </TableHead>
                                                <TableHead className="font-bold uppercase text-[11px] tracking-wider">Message Preview</TableHead>
                                                <TableHead>
                                                    <button onClick={() => handleSort('createdAt')} className="flex items-center hover:text-primary transition-colors font-bold uppercase text-[11px] tracking-wider whitespace-nowrap">
                                                        Date {getSortIcon('createdAt')}
                                                    </button>
                                                </TableHead>
                                                <TableHead className="text-right font-bold uppercase text-[11px] tracking-wider">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredFeedback.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((item) => (
                                                <TableRow key={item._id} className="hover:bg-accent/50 transition-colors">
                                                    <TableCell className="font-medium capitalize">{item.clientName || item.client?.name || 'Unknown'}</TableCell>
                                                    <TableCell>{item.client?.email || 'No email'}</TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-1">
                                                            {[1, 2, 3, 4, 5].map(star => (
                                                                <span
                                                                    key={star}
                                                                    className={`text-xs ${star <= item.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                                                                >
                                                                    ★
                                                                </span>
                                                            ))}
                                                            <span className="text-sm text-muted-foreground ml-1">{item.rating}/5</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="max-w-[200px] truncate">{item.message}</TableCell>
                                                    <TableCell className="whitespace-nowrap">{format(new Date(item.createdAt), 'MMM dd, yyyy')}</TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <Button variant="ghost" size="icon" onClick={() => openViewDialog(item, 'feedback')}>
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                            <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => handleDelete('feedback', item._id)}>
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            {filteredFeedback.length === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={6} className="h-64 text-center text-muted-foreground italic">
                                                        No feedback found matching your search.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </ScrollableContainer>
                            </div>
                        </CardContent>
                    </Card>
                    {filteredFeedback.length > itemsPerPage && (
                        <div className="p-4 bg-muted/20 border rounded-lg">
                            <DataPagination
                                currentPage={currentPage}
                                totalPages={Math.ceil(filteredFeedback.length / itemsPerPage)}
                                onPageChange={setCurrentPage}
                            />
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="contact" className="mt-0 space-y-4">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle>Contact Inquiries</CardTitle>
                            <CardDescription>Messages from the public website contact form.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="bg-card rounded-xl border overflow-hidden">
                                <ScrollableContainer maxHeight="60vh">
                                    <Table wrapperClassName="overflow-visible">
                                        <TableHeader className="sticky top-0 z-10 bg-card shadow-sm">
                                            <TableRow>
                                                <TableHead>
                                                    <button onClick={() => handleSort('name')} className="flex items-center hover:text-primary transition-colors font-bold uppercase text-[11px] tracking-wider whitespace-nowrap">
                                                        Name {getSortIcon('name')}
                                                    </button>
                                                </TableHead>
                                                <TableHead>
                                                    <button onClick={() => handleSort('email')} className="flex items-center hover:text-primary transition-colors font-bold uppercase text-[11px] tracking-wider whitespace-nowrap">
                                                        Contact {getSortIcon('email')}
                                                    </button>
                                                </TableHead>
                                                <TableHead>
                                                    <button onClick={() => handleSort('service')} className="flex items-center hover:text-primary transition-colors font-bold uppercase text-[11px] tracking-wider whitespace-nowrap">
                                                        Service {getSortIcon('service')}
                                                    </button>
                                                </TableHead>
                                                <TableHead>
                                                    <button onClick={() => handleSort('createdAt')} className="flex items-center hover:text-primary transition-colors font-bold uppercase text-[11px] tracking-wider whitespace-nowrap">
                                                        Date {getSortIcon('createdAt')}
                                                    </button>
                                                </TableHead>
                                                <TableHead>
                                                    <button onClick={() => handleSort('status')} className="flex items-center hover:text-primary transition-colors font-bold uppercase text-[11px] tracking-wider whitespace-nowrap">
                                                        Status {getSortIcon('status')}
                                                    </button>
                                                </TableHead>
                                                <TableHead className="text-right font-bold uppercase text-[11px] tracking-wider">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredContacts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((item) => (
                                                <TableRow key={item._id} className="hover:bg-accent/50 transition-colors">
                                                    <TableCell className="font-medium capitalize">{item.name}</TableCell>
                                                    <TableCell>
                                                        <div className="text-sm">{item.email}</div>
                                                        <div className="text-xs text-muted-foreground">{item.phone}</div>
                                                    </TableCell>
                                                    <TableCell className="max-w-[150px] truncate capitalize">{item.service ? item.service.replace(/-/g, ' ') : 'N/A'}</TableCell>
                                                    <TableCell className="whitespace-nowrap">{format(new Date(item.createdAt), 'MMM dd, yyyy')}</TableCell>
                                                    <TableCell>
                                                        <Badge variant={item.status === 'unread' || item.status === 'new' ? "default" : "secondary"} className="capitalize">
                                                            {item.status}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <Button variant="ghost" size="icon" onClick={() => openViewDialog(item, 'contact')}>
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                            <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => handleDelete('contact', item._id)}>
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            {filteredContacts.length === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={6} className="h-64 text-center text-muted-foreground italic">
                                                        No inquiries found matching your search.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </ScrollableContainer>
                            </div>
                        </CardContent>
                    </Card>
                    {filteredContacts.length > itemsPerPage && (
                        <div className="p-4 bg-muted/20 border rounded-lg">
                            <DataPagination
                                currentPage={currentPage}
                                totalPages={Math.ceil(filteredContacts.length / itemsPerPage)}
                                onPageChange={setCurrentPage}
                            />
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="career" className="mt-0 space-y-4">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle>Job Applications</CardTitle>
                            <CardDescription>Applications from the careers page.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="bg-card rounded-xl border overflow-hidden">
                                <ScrollableContainer maxHeight="60vh">
                                    <Table wrapperClassName="overflow-visible">
                                        <TableHeader className="sticky top-0 z-10 bg-card shadow-sm">
                                            <TableRow>
                                                <TableHead>
                                                    <button onClick={() => handleSort('fullName')} className="flex items-center hover:text-primary transition-colors font-bold uppercase text-[11px] tracking-wider whitespace-nowrap">
                                                        Applicant {getSortIcon('fullName')}
                                                    </button>
                                                </TableHead>
                                                <TableHead>
                                                    <button onClick={() => handleSort('jobTitle')} className="flex items-center hover:text-primary transition-colors font-bold uppercase text-[11px] tracking-wider whitespace-nowrap">
                                                        Position {getSortIcon('jobTitle')}
                                                    </button>
                                                </TableHead>
                                                <TableHead className="font-bold uppercase text-[11px] tracking-wider">Contact</TableHead>
                                                <TableHead>
                                                    <button onClick={() => handleSort('createdAt')} className="flex items-center hover:text-primary transition-colors font-bold uppercase text-[11px] tracking-wider whitespace-nowrap">
                                                        Date {getSortIcon('createdAt')}
                                                    </button>
                                                </TableHead>
                                                <TableHead>
                                                    <button onClick={() => handleSort('status')} className="flex items-center hover:text-primary transition-colors font-bold uppercase text-[11px] tracking-wider whitespace-nowrap">
                                                        Status {getSortIcon('status')}
                                                    </button>
                                                </TableHead>
                                                <TableHead className="text-right font-bold uppercase text-[11px] tracking-wider">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredApplications.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((item) => (
                                                <TableRow key={item._id} className="hover:bg-accent/50 transition-colors">
                                                    <TableCell className="font-medium capitalize">{item.fullName}</TableCell>
                                                    <TableCell>{item.jobTitle}</TableCell>
                                                    <TableCell>
                                                        <div className="text-sm">{item.email}</div>
                                                        <div className="text-xs text-muted-foreground">{item.phone}</div>
                                                    </TableCell>
                                                    <TableCell className="whitespace-nowrap">{format(new Date(item.createdAt), 'MMM dd, yyyy')}</TableCell>
                                                    <TableCell>
                                                        <Badge variant={item.status === 'applied' ? "default" : item.status === 'rejected' ? "destructive" : "secondary"}>
                                                            {item.status}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <Button variant="ghost" size="icon" onClick={() => openViewDialog(item, 'career')}>
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                            <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => handleDelete('career', item._id)}>
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            {filteredApplications.length === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={6} className="h-64 text-center text-muted-foreground italic">
                                                        No applications found matching your search.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </ScrollableContainer>
                            </div>
                        </CardContent>
                    </Card>
                    {filteredApplications.length > itemsPerPage && (
                        <div className="p-4 bg-muted/20 border rounded-lg">
                            <DataPagination
                                currentPage={currentPage}
                                totalPages={Math.ceil(filteredApplications.length / itemsPerPage)}
                                onPageChange={setCurrentPage}
                            />
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="profile" className="mt-0 space-y-4">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle>Profile Update Requests</CardTitle>
                            <CardDescription>Requests from clients and admins to update their profile information.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="bg-card rounded-xl border overflow-hidden">
                                <ScrollableContainer maxHeight="60vh">
                                    <Table wrapperClassName="overflow-visible">
                                        <TableHeader className="sticky top-0 z-10 bg-card shadow-sm">
                                            <TableRow>
                                                <TableHead>
                                                    <button onClick={() => handleSort('userName')} className="flex items-center hover:text-primary transition-colors font-bold uppercase text-[11px] tracking-wider whitespace-nowrap">
                                                        Client {getSortIcon('userName')}
                                                    </button>
                                                </TableHead>
                                                <TableHead className="font-bold uppercase text-[11px] tracking-wider">Changes</TableHead>
                                                <TableHead>
                                                    <button onClick={() => handleSort('createdAt')} className="flex items-center hover:text-primary transition-colors font-bold uppercase text-[11px] tracking-wider whitespace-nowrap">
                                                        Date {getSortIcon('createdAt')}
                                                    </button>
                                                </TableHead>
                                                <TableHead>
                                                    <button onClick={() => handleSort('status')} className="flex items-center hover:text-primary transition-colors font-bold uppercase text-[11px] tracking-wider whitespace-nowrap">
                                                        Status {getSortIcon('status')}
                                                    </button>
                                                </TableHead>
                                                <TableHead className="text-right font-bold uppercase text-[11px] tracking-wider">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredProfileRequests.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((item) => (
                                                <TableRow key={item._id} className="hover:bg-accent/50 transition-colors">
                                                    <TableCell className="font-medium">
                                                        <div className="capitalize">{item.userName}</div>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="text-xs text-muted-foreground">{item.userEmail || item.user?.email || item.email || 'N/A'}</span>
                                                            <Badge variant="outline" className="text-[10px] h-4 px-1 capitalize">{item.userRole}</Badge>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline">
                                                            {Object.keys(item.newData || {}).length} field(s)
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="whitespace-nowrap">{format(new Date(item.createdAt), 'MMM dd, yyyy')}</TableCell>
                                                    <TableCell>
                                                        <Badge variant={item.status === 'pending' ? "default" : item.status === 'approved' ? "secondary" : "destructive"}>
                                                            {item.status}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <Button variant="ghost" size="icon" onClick={() => openViewDialog(item, 'profile-update')}>
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                            <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => handleDelete('profile-update', item._id)}>
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            {filteredProfileRequests.length === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={5} className="h-64 text-center text-muted-foreground italic">
                                                        No profile requests found matching your search.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </ScrollableContainer>
                            </div>
                        </CardContent>
                    </Card>
                    {filteredProfileRequests.length > itemsPerPage && (
                        <div className="p-4 bg-muted/20 border rounded-lg">
                            <DataPagination
                                currentPage={currentPage}
                                totalPages={Math.ceil(filteredProfileRequests.length / itemsPerPage)}
                                onPageChange={setCurrentPage}
                            />
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            {/* DETAIL DIALOG */}
            <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
                <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 overflow-hidden gap-0">
                    <DialogHeader className="p-6 pb-2 flex-shrink-0">
                        <DialogTitle>Response Details</DialogTitle>
                        <DialogDescription>
                            {selectedItem && format(new Date(selectedItem.createdAt), "PPP p")}
                        </DialogDescription>
                    </DialogHeader>

                    <ScrollableContainer className="flex-1 p-6 pt-2 space-y-4">
                        {selectedItem && (
                            <div className="space-y-4">
                                {/* Feedback View */}
                                {viewType === 'feedback' && (
                                    <>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <h4 className="font-semibold text-sm text-muted-foreground">Client</h4>
                                                <p className="capitalize">{selectedItem.clientName || selectedItem.client?.name || 'Unknown'}</p>
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-sm text-muted-foreground">Email</h4>
                                                <p>{selectedItem.client?.email || 'No email'}</p>
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-sm text-muted-foreground">Rating</h4>
                                                <div className="flex items-center gap-1">
                                                    {[1, 2, 3, 4, 5].map(star => (
                                                        <span
                                                            key={star}
                                                            className={`text-sm ${star <= selectedItem.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                                                        >
                                                            ★
                                                        </span>
                                                    ))}
                                                    <span className="text-sm text-muted-foreground ml-1">{selectedItem.rating}/5</span>
                                                </div>
                                            </div>
                                            {selectedItem.subject && (
                                                <div>
                                                    <h4 className="font-semibold text-sm text-muted-foreground">Subject</h4>
                                                    <p>{selectedItem.subject}</p>
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-sm text-muted-foreground">Message</h4>
                                            <div className="mt-2 p-3 bg-muted rounded-md whitespace-pre-wrap text-sm">
                                                {selectedItem.message}
                                            </div>
                                        </div>
                                    </>
                                )}

                                {/* Contact View */}
                                {viewType === 'contact' && (
                                    <>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <h4 className="font-semibold text-sm text-muted-foreground">Name</h4>
                                                <p className="capitalize">{selectedItem.name}</p>
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-sm text-muted-foreground">Email</h4>
                                                <p>{selectedItem.email}</p>
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-sm text-muted-foreground">Phone</h4>
                                                <p>{selectedItem.phone || 'N/A'}</p>
                                            </div>
                                            {selectedItem.company && (
                                                <div>
                                                    <h4 className="font-semibold text-sm text-muted-foreground">Company</h4>
                                                    <p>{selectedItem.company}</p>
                                                </div>
                                            )}
                                            {selectedItem.service && (
                                                <div>
                                                    <h4 className="font-semibold text-sm text-muted-foreground">Interested Service</h4>
                                                    <p className="capitalize">{selectedItem.service.replace(/-/g, ' ')}</p>
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-sm text-muted-foreground">Message</h4>
                                            <div className="mt-2 p-3 bg-muted rounded-md whitespace-pre-wrap text-sm">
                                                {selectedItem.message}
                                            </div>
                                        </div>
                                        <div className="flex gap-2 pt-4">
                                            {(selectedItem.status === 'unread' || selectedItem.status === 'new') && (
                                                <Button onClick={() => handleStatusUpdate('contact', selectedItem._id, 'read')}>
                                                    Mark as Read
                                                </Button>
                                            )}
                                        </div>
                                    </>
                                )}

                                {/* Career View */}
                                {viewType === 'career' && (
                                    <div className="space-y-6">
                                        <div className="flex items-start justify-between border-b pb-4">
                                            <div>
                                                <h3 className="text-xl font-bold capitalize">{selectedItem.fullName}</h3>
                                                <p className="text-muted-foreground">{selectedItem.jobTitle}</p>
                                            </div>
                                            <Badge
                                                className={
                                                    selectedItem.status === 'shortlisted' ? 'bg-green-500 hover:bg-green-600' :
                                                        selectedItem.status === 'rejected' ? 'bg-destructive hover:bg-destructive' :
                                                            'bg-primary hover:bg-primary/90'
                                                }
                                            >
                                                {selectedItem.status.charAt(0).toUpperCase() + selectedItem.status.slice(1)}
                                            </Badge>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Contact Info</h4>
                                                <p className="flex items-center gap-2"><Mail className="h-4 w-4 text-gray-400" /> {selectedItem.email}</p>
                                                <p className="flex items-center gap-2"><span className="w-4 flex justify-center">📱</span> {selectedItem.phone || 'N/A'}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Applied Date</h4>
                                                <p>{format(new Date(selectedItem.createdAt), 'MMMM dd, yyyy')}</p>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Resume</h4>
                                            <div className="p-4 border rounded-md bg-slate-50 flex items-center justify-between">
                                                <span className="text-sm font-medium truncate max-w-[300px]">
                                                    {selectedItem.resume ? 'Resume Document' : 'No resume uploaded'}
                                                </span>
                                                {selectedItem.resume && (
                                                    <Button size="sm" asChild>
                                                        <a href={selectedItem.resume} target="_blank" rel="noopener noreferrer">
                                                            <Eye className="h-4 w-4 mr-2" />
                                                            View Resume
                                                        </a>
                                                    </Button>
                                                )}
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Cover Letter</h4>
                                            <div className="mt-2 p-4 bg-muted/50 rounded-md border whitespace-pre-wrap text-sm leading-relaxed">
                                                {selectedItem.coverLetter || <span className="text-muted-foreground italic">No cover letter provided.</span>}
                                            </div>
                                        </div>

                                        <div className="flex gap-3 pt-6 border-t mt-6">
                                            {selectedItem.status === 'applied' && (
                                                <>
                                                    <Button
                                                        variant="outline"
                                                        className="text-green-600 border-green-200 hover:bg-green-50 flex-1"
                                                        onClick={() => handleStatusUpdate('career', selectedItem._id, 'shortlisted')}
                                                    >
                                                        Shortlist
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        className="text-destructive border-destructive/30 hover:bg-destructive/10 flex-1"
                                                        onClick={() => handleStatusUpdate('career', selectedItem._id, 'rejected')}
                                                    >
                                                        Reject
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Profile Update View */}
                                {viewType === 'profile-update' && (
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between border-b pb-4">
                                            <div>
                                                <h3 className="text-xl font-bold capitalize">{selectedItem.userName}</h3>
                                                <div className="text-muted-foreground flex items-center gap-2">
                                                    Profile Update Request
                                                    <Badge variant="outline" className="capitalize">{selectedItem.userRole}</Badge>
                                                </div>
                                            </div>
                                            <Badge variant={selectedItem.status === 'pending' ? "default" : selectedItem.status === 'approved' ? "secondary" : "destructive"}>
                                                {selectedItem.status.toUpperCase()}
                                            </Badge>
                                        </div>

                                        <div className="space-y-4">
                                            <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Proposed Changes</h4>
                                            <div className="grid gap-4 bg-accent/30 p-4 rounded-lg border">
                                                {Object.keys(selectedItem.newData).map(field => (
                                                    <div key={field} className="grid grid-cols-1 md:grid-cols-2 gap-2 border-b border-white/10 pb-2 last:border-0 last:pb-0">
                                                        <div>
                                                            <p className="text-xs text-muted-foreground font-medium uppercase">{field}</p>
                                                            <p className="text-sm line-through opacity-50">{selectedItem.oldData[field] || 'Empty'}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-primary font-medium uppercase">New Value</p>
                                                            {selectedItem.status === 'pending' ? (
                                                                <Input
                                                                    value={editData[field]}
                                                                    onChange={(e) => setEditData({ ...editData, [field]: e.target.value })}
                                                                    className="h-8 text-sm mt-1"
                                                                />
                                                            ) : (
                                                                <p className="text-sm font-medium">{selectedItem.newData[field]}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {selectedItem.status === 'pending' && (
                                            <div className="flex gap-3 pt-4">
                                                <Button onClick={() => handleApproveRequest(selectedItem._id)} className="flex-1">
                                                    Approve Changes
                                                </Button>
                                                <Button variant="outline" onClick={() => handleRejectRequest(selectedItem._id)} className="flex-1 text-destructive hover:bg-destructive/10">
                                                    Reject Request
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </ScrollableContainer>
                    <DialogFooter className="p-6 pt-2 flex-shrink-0 border-t bg-muted/10">
                        <Button variant="outline" onClick={() => setSelectedItem(null)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
