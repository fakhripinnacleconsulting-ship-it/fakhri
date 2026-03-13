"use client";
import { useState, useMemo, useEffect } from "react";
import {
    Plus, Eye, X, Mail, Phone, Building2, CreditCard,
    CheckSquare, StickyNote, Edit, Save, Calendar, User,
    Filter, ChevronDown, ChevronUp, Clock, ArrowLeft, Loader2, Layers, Receipt, Copy,
    ArrowUp, ArrowDown, ChevronsUpDown, ArrowUpDown, Search
} from "lucide-react";
import { ScrollableContainer } from "@/components/ui/scrollable-container";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getClients, getTasks, upsertTask, deleteTask, getNotes, upsertNote, getAdmins, sendClientEmail, updateSubscribedServiceStatus, uploadTaskAttachment, getActiveTaskCounts } from "@/lib/actions/admin";
import { toast } from "sonner";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";
import DataPagination from "@/components/ui/DataPagination";
import CountdownTimer from "@/components/ui/CountdownTimer";
import { cn } from "@/lib/utils";





const AdminClientsTab = ({ currentUser }) => {
    const [clients, setClients] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [notes, setNotes] = useState([]);
    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(true);

    const [selectedClient, setSelectedClient] = useState(null);
    const [activeView, setActiveView] = useState("tasks");
    const [showCreateTask, setShowCreateTask] = useState(false);
    const [showEditTask, setShowEditTask] = useState(null);
    const [showAddNote, setShowAddNote] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [taskSearchQuery, setTaskSearchQuery] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [taskToDelete, setTaskToDelete] = useState(null);
    const [newNote, setNewNote] = useState("");
    const [selectedFile, setSelectedFile] = useState(null);

    // Get current week number
    const getCurrentWeek = () => {
        const now = new Date();
        const start = new Date(now.getFullYear(), 0, 1);
        const diff = now - start;
        const oneWeek = 1000 * 60 * 60 * 24 * 7;
        return Math.ceil(diff / oneWeek);
    };

    const currentWeekNumber = useMemo(() => getCurrentWeek(), []);

    const weekNumbers = useMemo(() => {
        const weeks = [];
        const startWeek = Math.max(1, currentWeekNumber - 10);
        for (let i = startWeek; i <= 52; i++) {
            weeks.push({
                value: i.toString(),
                label: `Week ${i}`,
                disabled: i < currentWeekNumber
            });
        }
        return weeks;
    }, [currentWeekNumber]);

    const [newTask, setNewTask] = useState({
        title: "",
        owner: currentUser?.name || "Admin",
        dueDate: "",
        planForWeek: currentWeekNumber.toString(),
        description: "",
        isHighPriority: false,
        isCompleted: false,
        attachment: null
    });
    const [showMailForm, setShowMailForm] = useState(false);
    const [mailSubject, setMailSubject] = useState("");
    const [mailBody, setMailBody] = useState("");
    // List filters
    const [clientPlanFilter, setClientPlanFilter] = useState("all");
    const [clientSupportFilter, setClientSupportFilter] = useState("all");

    // Task filters (detailed view)
    const [statusFilter, setStatusFilter] = useState("all");
    const [priorityFilter, setPriorityFilter] = useState("all");
    const [ownerFilter, setOwnerFilter] = useState("all");

    // Load clients and admins on mount
    useEffect(() => {
        async function loadData() {
            if (!currentUser) {
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                const clientProjection = {
                    name: 1, company: 1, email: 1, phone: 1,
                    plan: 1, supportType: 1, status: 1,
                    activeTasks: 1, createdAt: 1
                };

                const [clientsRes, a] = await Promise.all([
                    getClients(
                        currentUser.role === 'super-admin' ? {} : { managerId: currentUser._id },
                        { projection: clientProjection }
                    ),
                    getAdmins()
                ]);
                const c = clientsRes.clients || [];
                const uniqueClients = Array.from(new Map(c.map(item => [String(item._id), item])).values());
                const uniqueAdmins = Array.from(new Map(a.map(item => [String(item._id), item])).values());

                // Fetch active task counts for each client
                const clientIds = uniqueClients.map(cl => cl._id);
                let taskCountMap = {};
                if (clientIds.length > 0) {
                    try {
                        taskCountMap = await getActiveTaskCounts(clientIds);
                    } catch (e) {
                        console.error("Failed to fetch active task counts", e);
                    }
                }

                const clientsWithIds = uniqueClients.map(client => ({
                    ...client,
                    id: client._id || client.id || `client-${Math.random()}`,
                    activeTasks: taskCountMap[client._id] || 0
                }));
                setClients(clientsWithIds);
                setAdmins(uniqueAdmins);
            } catch (error) {
                console.error("Failed to load data", error);
                toast.error("Failed to load clients");
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [currentUser]);

    // Fetch tasks & notes when a client is selected (like super-admin)
    useEffect(() => {
        if (selectedClient) {
            async function loadClientData() {
                try {
                    const taskProjection = {
                        title: 1, status: 1, priority: 1,
                        owner: 1, assignee: 1, dueDate: 1,
                        description: 1, createdAt: 1, attachment: 1,
                        category: 1, planForWeek: 1, taskId: 1, client: 1,
                        tags: 1, updates: 1
                    };

                    const [t, clientNotes] = await Promise.all([
                        getTasks(
                            { 'client.id': selectedClient._id || selectedClient.id },
                            taskProjection
                        ),
                        getNotes(selectedClient._id || selectedClient.id)
                    ]);
                    const uniqueTasks = Array.from(new Map((Array.isArray(t) ? t : []).map(item => [String(item._id || item.id), item])).values());
                    setTasks(uniqueTasks);
                    setNotes(clientNotes || []);
                } catch (error) {
                    console.error("Failed to load client data", error);
                }
            }
            loadClientData();
        } else {
            setTasks([]);
            setNotes([]);
        }
    }, [selectedClient]);

    // Mock managers for now


    const [clientSortConfig, setClientSortConfig] = useState({ key: null, direction: 'asc' });
    const [taskSortConfig, setTaskSortConfig] = useState({ key: null, direction: 'asc' });

    const handleSort = (configSetter, key) => {
        configSetter(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const getSortIcon = (config, key) => {
        if (config.key !== key) return <ChevronsUpDown className="ml-1 h-3 w-3 opacity-40 shrink-0" />;
        return config.direction === 'asc'
            ? <ArrowUp className="ml-1 h-3 w-3 text-primary shrink-0" />
            : <ArrowDown className="ml-1 h-3 w-3 text-primary shrink-0" />;
    };

    const sortedClients = useMemo(() => {
        let result = [...clients].filter(client => {
            const matchesSearch = (client.name && client.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (client.company && client.company.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (client.email && client.email.toLowerCase().includes(searchQuery.toLowerCase()));
            const matchesPlan = clientPlanFilter === "all" || (client.plan || "").toLowerCase() === clientPlanFilter.toLowerCase();
            const matchesSupport = clientSupportFilter === "all" || (client.supportType === clientSupportFilter);
            return matchesSearch && matchesPlan && matchesSupport;
        });

        if (clientSortConfig.key) {
            result.sort((a, b) => {
                let aVal = a[clientSortConfig.key] || "";
                let bVal = b[clientSortConfig.key] || "";

                if (typeof aVal === 'string') aVal = aVal.toLowerCase();
                if (typeof bVal === 'string') bVal = bVal.toLowerCase();

                if (aVal < bVal) return clientSortConfig.direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return clientSortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return result;
    }, [searchQuery, clientPlanFilter, clientSupportFilter, clients, clientSortConfig]);

    const itemsPerPage = 9;
    const [currentPageClients, setCurrentPageClients] = useState(1);
    const paginatedClients = sortedClients.slice((currentPageClients - 1) * itemsPerPage, currentPageClients * itemsPerPage);

    useEffect(() => {
        setCurrentPageClients(1);
    }, [searchQuery, clientPlanFilter, clientSupportFilter, clientSortConfig]);

    // tasks is already per-client (fetched on selection), so clientTasks = tasks
    const clientTasks = tasks;

    const sortedTasks = useMemo(() => {
        if (!selectedClient) return [];
        let t = [...tasks];

        // Filter by task search query
        if (taskSearchQuery) {
            t = t.filter(task =>
                (task.title && task.title.toLowerCase().includes(taskSearchQuery.toLowerCase())) ||
                (task.description && task.description.toLowerCase().includes(taskSearchQuery.toLowerCase())) ||
                (task.owner && task.owner.toLowerCase().includes(taskSearchQuery.toLowerCase()))
            );
        }

        if (statusFilter !== "all") {
            t = t.filter(task => (task.status || "").toLowerCase().replace(/-/g, ' ') === statusFilter.toLowerCase().replace(/-/g, ' '));
        }
        if (priorityFilter !== "all") {
            t = t.filter(task => (task.priority || "").toLowerCase() === priorityFilter.toLowerCase());
        }
        if (ownerFilter !== "all") {
            t = t.filter(task => (task.assignee?.name || task.owner) === ownerFilter);
        }

        if (taskSortConfig.key) {
            t = [...t].sort((a, b) => {
                let aVal = a[taskSortConfig.key] || "";
                let bVal = b[taskSortConfig.key] || "";

                if (taskSortConfig.key === 'priority') {
                    const priorityOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
                    aVal = priorityOrder[aVal] || 0;
                    bVal = priorityOrder[bVal] || 0;
                } else if (typeof aVal === 'string') {
                    aVal = aVal.toLowerCase();
                    bVal = bVal.toLowerCase();
                }

                if (aVal < bVal) return taskSortConfig.direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return taskSortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return t;
    }, [selectedClient, statusFilter, priorityFilter, ownerFilter, tasks, taskSortConfig, taskSearchQuery]);

    const [currentPageTasks, setCurrentPageTasks] = useState(1);
    const paginatedTasks = sortedTasks.slice((currentPageTasks - 1) * itemsPerPage, currentPageTasks * itemsPerPage);

    useEffect(() => {
        setCurrentPageTasks(1);
    }, [statusFilter, priorityFilter, ownerFilter, selectedClient, taskSortConfig]);

    // Get notes for selected client
    const clientNotes = useMemo(() => {
        return notes;
    }, [notes]);

    const [currentPageNotes, setCurrentPageNotes] = useState(1);
    const paginatedClientNotes = clientNotes.slice((currentPageNotes - 1) * itemsPerPage, currentPageNotes * itemsPerPage);

    useEffect(() => {
        setCurrentPageNotes(1);
    }, [selectedClient]);

    const filteredServices = useMemo(() => {
        if (!selectedClient?.subscribedServices) return [];
        return selectedClient.subscribedServices;
    }, [selectedClient]);

    const [currentPageServices, setCurrentPageServices] = useState(1);
    const paginatedServices = filteredServices.slice((currentPageServices - 1) * itemsPerPage, currentPageServices * itemsPerPage);

    useEffect(() => {
        setCurrentPageServices(1);
    }, [selectedClient]);

    const handleClientClick = async (client) => {
        // Normalize ID usage
        const clientWithId = { ...client, id: client._id || client.id };
        setSelectedClient(clientWithId);
        setActiveView("tasks");
        setShowCreateTask(false);
        setShowEditTask(null);
        setShowAddNote(false);
        setTaskSearchQuery("");
        resetNewTaskForm();

        // Fetch Notes
        try {
            const clientNotes = await getNotes(clientWithId.id);
            setNotes(clientNotes);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load notes");
        }
    };

    const handleBackToList = () => {
        setSelectedClient(null);
        setActiveView("tasks");
        setNotes([]);
        setTaskSearchQuery("");
    };

    const resetNewTaskForm = () => {
        setNewTask({
            title: "",
            owner: "Sarah Mitchell",
            dueDate: "",
            planForWeek: currentWeekNumber.toString(),
            description: "",
            isHighPriority: false,
            isCompleted: false,
            attachment: null
        });
        setSelectedFile(null);
    };

    const handleCreateTask = async () => {
        if (!newTask.title) {
            toast.error("Task title is required");
            return;
        }

        setIsSubmitting(true);
        try {
            const taskPayload = {
                title: newTask.title,
                description: newTask.description,
                status: newTask.status || 'In Progress',
                priority: newTask.isHighPriority ? 'High' : 'Medium',
                client: {
                    id: selectedClient.id,
                    name: selectedClient.name,
                    company: selectedClient.company
                },
                clientId: selectedClient.id, // redundancy for easier query
                assignee: {
                    name: newTask.owner,
                    id: currentUser._id
                },
                owner: newTask.owner,
                dueDate: newTask.dueDate,
                planForWeek: newTask.planForWeek,
            };

            if (selectedFile) {
                const formData = new FormData();
                formData.append('file', selectedFile);
                const uploadRes = await uploadTaskAttachment(formData);
                if (uploadRes.success) {
                    taskPayload.attachment = { name: uploadRes.name, url: uploadRes.url };
                } else {
                    toast.error("Failed to upload attachment");
                    setIsSubmitting(false);
                    return;
                }
            }

            const savedTask = await upsertTask(taskPayload);
            if (savedTask) {
                setTasks(prev => [savedTask, ...prev]);
                setShowCreateTask(false);
                resetNewTaskForm();
                toast.success("Task created");
            } else {
                toast.error("Failed to create task");
            }
        } catch (error) {
            console.error(error);
            toast.error("An error occurred");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateTask = async () => {
        if (!showEditTask.title) {
            toast.error("Task title is required");
            return;
        }

        setIsSubmitting(true);
        try {
            const taskPayload = {
                ...showEditTask,
                id: showEditTask._id || showEditTask.id,
                title: showEditTask.title,
                description: showEditTask.description,
                status: showEditTask.status,
                priority: showEditTask.priority,
                client: {
                    id: selectedClient.id,
                    name: selectedClient.name,
                    company: selectedClient.company
                },
                clientId: selectedClient.id,
                owner: showEditTask.owner,
                dueDate: showEditTask.dueDate,
                planForWeek: showEditTask.planForWeek || currentWeekNumber.toString(),
            };

            let attachmentData = showEditTask.attachment || null;
            if (selectedFile) {
                const formData = new FormData();
                formData.append('file', selectedFile);
                const uploadRes = await uploadTaskAttachment(formData);
                if (uploadRes.success) {
                    attachmentData = { name: uploadRes.name, url: uploadRes.url };
                } else {
                    toast.error("Failed to upload attachment");
                    setIsSubmitting(false);
                    return;
                }
            }
            if (attachmentData) {
                taskPayload.attachment = attachmentData;
            }

            const updatedTask = await upsertTask(taskPayload);
            if (updatedTask) {
                setTasks(prev => prev.map(t => (t._id === updatedTask._id || t.id === updatedTask.id) ? updatedTask : t));
                setShowEditTask(null);
                setSelectedFile(null);
                toast.success("Task updated");
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to update task");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAddNote = async () => {
        if (!newNote.trim()) return;

        try {
            const notePayload = {
                clientId: selectedClient.id,
                author: currentUser?.name || "Admin",
                authorId: currentUser?._id || currentUser?.id,
                content: newNote,
                date: new Date()
            };

            const savedNote = await upsertNote(notePayload);
            if (savedNote) {
                setNotes(prev => [savedNote, ...prev]);
                setShowAddNote(false);
                setNewNote("");
                toast.success("Note added");
            } else {
                toast.error("Failed to add note");
            }
        } catch (error) {
            console.error(error);
            toast.error("Error adding note");
        }
    };

    const handleSendMail = async () => {
        if (!mailSubject || !mailBody) {
            toast.error("Subject and message are required");
            return;
        }

        if (!currentUser?.email) {
            toast.error("Admin email not available. Please refresh the page.");
            return;
        }

        if (!selectedClient?.email) {
            toast.error("Client email not found.");
            return;
        }

        setIsSubmitting(true);
        try {
            // Convert plain text newlines to HTML <br> for proper email rendering
            const htmlBody = mailBody.replace(/\n/g, '<br>');

            const result = await sendClientEmail({
                to: selectedClient.email,
                subject: mailSubject,
                body: htmlBody,
                fromAdmin: {
                    name: currentUser.name,
                    email: currentUser.email
                }
            });

            if (result.success) {
                toast.success(`Mail sent to ${selectedClient.email}`);
                setShowMailForm(false);
                setMailSubject("");
                setMailBody("");
            } else {
                toast.error(result.error || "Failed to send email");
            }
        } catch (error) {
            console.error("Error sending mail:", error);
            toast.error("An unexpected error occurred while sending email");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary" /></div>;
    }

    if (!currentUser) {
        return <div className="p-6 text-center text-muted-foreground">User information not available.</div>;
    }

    // Client List View
    if (!selectedClient) {
        return (
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="font-heading text-2xl font-bold mb-2">My Clients</h1>
                        <p className="text-muted-foreground">Manage your assigned clients and their accounts.</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-3">
                    <Input
                        placeholder="Search clients..."
                        className="w-[250px]"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <Select value={clientPlanFilter} onValueChange={setClientPlanFilter}>
                        <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder="Plan" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Plans</SelectItem>
                            <SelectItem value="Platinum">Platinum</SelectItem>
                            <SelectItem value="Premium">Premium</SelectItem>
                            <SelectItem value="Elite">Elite</SelectItem>
                        </SelectContent>
                    </Select>
                    {/* <Select value={clientSupportFilter} onValueChange={setClientSupportFilter}>
                        <SelectTrigger className="w-[160px]">
                            <SelectValue placeholder="Support Level" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Support</SelectItem>
                            <SelectItem value="Normal">Normal Support</SelectItem>
                            <SelectItem value="Within 2 Hours">Express Support</SelectItem>
                        </SelectContent>
                    </Select> */}
                </div>

                {/* Clients Table */}
                <div className="bg-card rounded-xl border overflow-hidden">
                    <ScrollableContainer maxHeight="60vh">
                        <Table wrapperClassName="overflow-visible">
                            <TableHeader className="sticky top-0 z-10 bg-card shadow-sm border-b">
                                <TableRow>
                                    <TableHead>
                                        <Button variant="ghost" size="sm" onClick={() => handleSort(setClientSortConfig, 'name')} className="p-0 hover:bg-transparent font-bold uppercase text-[11px] tracking-wider">
                                            Client {getSortIcon(clientSortConfig, 'name')}
                                        </Button>
                                    </TableHead>
                                    <TableHead>
                                        <Button variant="ghost" size="sm" onClick={() => handleSort(setClientSortConfig, 'email')} className="p-0 hover:bg-transparent font-bold uppercase text-[11px] tracking-wider">
                                            Email {getSortIcon(clientSortConfig, 'email')}
                                        </Button>
                                    </TableHead>
                                    <TableHead className="font-bold uppercase text-[11px] tracking-wider">Phone</TableHead>
                                    <TableHead>
                                        <Button variant="ghost" size="sm" onClick={() => handleSort(setClientSortConfig, 'plan')} className="p-0 hover:bg-transparent font-bold uppercase text-[11px] tracking-wider">
                                            Plan {getSortIcon(clientSortConfig, 'plan')}
                                        </Button>
                                    </TableHead>
                                    <TableHead>
                                        <Button variant="ghost" size="sm" onClick={() => handleSort(setClientSortConfig, 'activeTasks')} className="p-0 hover:bg-transparent font-bold uppercase text-[11px] tracking-wider">
                                            Active Tasks {getSortIcon(clientSortConfig, 'activeTasks')}
                                        </Button>
                                    </TableHead>
                                    <TableHead>
                                        <Button variant="ghost" size="sm" onClick={() => handleSort(setClientSortConfig, 'status')} className="p-0 hover:bg-transparent font-bold uppercase text-[11px] tracking-wider">
                                            Status {getSortIcon(clientSortConfig, 'status')}
                                        </Button>
                                    </TableHead>
                                    <TableHead className="text-right font-bold uppercase text-[11px] tracking-wider">Actions</TableHead>
                                </TableRow>
                            </TableHeader>

                            <TableBody>
                                {paginatedClients.map((client, idx) => (
                                    <TableRow key={client.id || client._id || `client-${idx}`} className="cursor-pointer hover:bg-accent/50" onClick={() => handleClientClick(client)}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                                                    {client.name.split(' ').map(n => n[0]).join('')}
                                                </div>
                                                <div>
                                                    <p className="font-medium capitalize">{client.name}</p>
                                                    <p className="text-xs text-muted-foreground capitalize">{client.company}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">{client.email}</TableCell>
                                        <TableCell className="text-muted-foreground">{client.phone}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1.5">
                                                <Badge variant={client.plan === "Platinum" ? "default" : client.plan === "Premium" ? "secondary" : "outline"} className="w-fit">
                                                    {client.plan || "N/A"}
                                                </Badge>
                                                {client.supportType === "Within 2 Hours" && (
                                                    <Badge className="bg-amber-100 hover:bg-amber-100 text-amber-600 border-amber-200 text-[10px] font-bold py-0 h-5 flex items-center gap-1 w-fit shadow-sm">
                                                        <Clock className="w-3 h-3" />
                                                        <span>⚡ EXPRESS (2H)</span>
                                                    </Badge>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="font-medium">{client.activeTasks}</span>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={client.status === "active" ? "default" : "outline"} className="bg-green-500/10 text-green-600 border-green-500/20">
                                                Active
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleClientClick(client); }}>
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </ScrollableContainer>
                </div>

                <DataPagination
                    currentPage={currentPageClients}
                    totalPages={Math.ceil(sortedClients.length / itemsPerPage)}
                    onPageChange={setCurrentPageClients}
                />
            </div>
        );
    }

    // Client Detail View
    return (
        <div className="flex flex-col h-[calc(100vh-80px)] overflow-hidden">
            {/* Sticky Header */}
            <div className="bg-card/95 backdrop-blur-md border-b shadow-sm -mx-4 px-4 py-2.5 shrink-0">
                {/* Top row: Back + Name + Search + Actions */}
                <div className="flex items-center gap-3 max-w-full">
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={handleBackToList}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex items-center gap-2 min-w-0 shrink-0">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary font-heading font-bold text-xs uppercase shrink-0 ring-2 ring-primary/10">
                            {selectedClient.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div className="min-w-0">
                            <h1 className="font-heading text-base font-bold capitalize truncate leading-tight">{selectedClient.name}</h1>
                            <p className="text-[10px] text-muted-foreground truncate leading-tight">{selectedClient.company || selectedClient.email}</p>
                        </div>
                    </div>

                    {/* Spacer */}
                    <div className="flex-1" />

                    {/* Action Buttons */}
                    <div className="flex gap-1.5 shrink-0 pr-2">
                        <Button variant="outline" size="sm" className="h-8 px-3" onClick={() => setShowMailForm(true)}>
                            <Mail className="h-3.5 w-3.5 mr-1" />
                            Mail
                        </Button>
                    </div>
                </div>

                {/* Tab Navigation Row */}
                <div className="flex gap-1 mt-2 overflow-x-auto no-scrollbar">
                    {[
                        { key: "tasks", label: "Tasks", icon: CheckSquare, count: clientTasks.length },
                        { key: "notes", label: "Notes", icon: StickyNote, count: notes.length },
                        { key: "services", label: "Services", icon: Layers, count: selectedClient.subscribedServices?.length || 0 },
                    ].map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveView(tab.key)}
                            className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full transition-all duration-200 shrink-0",
                                activeView === tab.key
                                    ? "bg-primary text-primary-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                            )}
                        >
                            <tab.icon className="h-3.5 w-3.5" />
                            {tab.label}
                            <span className={cn(
                                "text-[10px] min-w-[18px] h-[18px] flex items-center justify-center rounded-full px-1",
                                activeView === tab.key
                                    ? "bg-primary-foreground/20 text-primary-foreground"
                                    : "bg-muted text-muted-foreground"
                            )}>
                                {tab.count}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-4 flex-1 min-h-0 overflow-hidden mt-4">
                {/* Left Side - Tasks or Notes */}
                <div className="lg:col-span-2 flex flex-col min-h-0 overflow-hidden space-y-3">
                    {activeView === "tasks" ? (
                        <>
                            {/* Task Actions */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex flex-wrap gap-2">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Search tasks..."
                                            className="w-[180px] pl-9"
                                            value={taskSearchQuery}
                                            onChange={(e) => setTaskSearchQuery(e.target.value)}
                                        />
                                    </div>
                                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                                        <SelectTrigger className="w-[130px]">
                                            <SelectValue placeholder="Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Status</SelectItem>
                                            <SelectItem value="In Progress">In Progress</SelectItem>
                                            <SelectItem value="Under Review">Under Review</SelectItem>
                                            <SelectItem value="Completed">Completed</SelectItem>
                                            <SelectItem value="Cancelled">Cancelled</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                                        <SelectTrigger className="w-[130px]">
                                            <SelectValue placeholder="Priority" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Priority</SelectItem>
                                            <SelectItem value="high">High</SelectItem>
                                            <SelectItem value="medium">Medium</SelectItem>
                                            <SelectItem value="low">Low</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Select value={ownerFilter} onValueChange={setOwnerFilter}>
                                        <SelectTrigger className="w-[160px]">
                                            <SelectValue placeholder="Manager" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Managers</SelectItem>
                                            {admins.map((admin, idx) => (
                                                <SelectItem key={admin._id || admin.id || `admin-${idx}`} value={admin.name}>{admin.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button onClick={() => setShowCreateTask(true)}>
                                    <Plus className="h-4 w-4 mr-1" />
                                    New Task
                                </Button>
                            </div>

                            {/* Create Task Form - rendered as a modal below */}

                            {/* Tasks Table */}
                            <div className="flex flex-col  max-h-[calc(100vh-200px)] border rounded-xl overflow-hidden bg-card">
                                <div className="flex-1 min-h-0 overflow-y-auto">
                                    <Table className="relative w-full">
                                        <TableHeader className="sticky top-0 z-10 bg-card shadow-sm border-b">
                                            <TableRow>
                                                <TableHead>
                                                    <Button variant="ghost" size="sm" onClick={() => handleSort(setTaskSortConfig, 'title')} className="p-0 hover:bg-transparent font-bold uppercase text-[11px] tracking-wider">
                                                        Task {getSortIcon(taskSortConfig, 'title')}
                                                    </Button>
                                                </TableHead>
                                                <TableHead>
                                                    <Button variant="ghost" size="sm" onClick={() => handleSort(setTaskSortConfig, 'owner')} className="p-0 hover:bg-transparent font-bold uppercase text-[11px] tracking-wider">
                                                        Owner {getSortIcon(taskSortConfig, 'owner')}
                                                    </Button>
                                                </TableHead>
                                                <TableHead>
                                                    <Button variant="ghost" size="sm" onClick={() => handleSort(setTaskSortConfig, 'priority')} className="p-0 hover:bg-transparent font-bold uppercase text-[11px] tracking-wider">
                                                        Priority {getSortIcon(taskSortConfig, 'priority')}
                                                    </Button>
                                                </TableHead>
                                                <TableHead>
                                                    <Button variant="ghost" size="sm" onClick={() => handleSort(setTaskSortConfig, 'status')} className="p-0 hover:bg-transparent font-bold uppercase text-[11px] tracking-wider">
                                                        Status {getSortIcon(taskSortConfig, 'status')}
                                                    </Button>
                                                </TableHead>
                                                <TableHead>
                                                    <Button variant="ghost" size="sm" onClick={() => handleSort(setTaskSortConfig, 'dueDate')} className="p-0 hover:bg-transparent font-bold uppercase text-[11px] tracking-wider">
                                                        Due Date {getSortIcon(taskSortConfig, 'dueDate')}
                                                    </Button>
                                                </TableHead>
                                                <TableHead className="text-right font-bold uppercase text-[11px] tracking-wider">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>

                                        <TableBody>
                                            {paginatedTasks.length > 0 ? paginatedTasks.map((task, index) => (
                                                <TableRow key={`${task._id || task.id}-${index}`}>
                                                    <TableCell>
                                                        <div>
                                                            <p className="font-medium capitalize">{task.title}</p>
                                                            <p className="text-xs text-muted-foreground capitalize">{task.category || 'General'}</p>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-muted-foreground capitalize">
                                                        {typeof task.owner === 'string' ? task.owner : (task.assignee?.name || "Unassigned")}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant={task.priority === "High" ? "destructive" : task.priority === "Medium" ? "secondary" : "outline"}>
                                                            {task.priority || "Medium"}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Select
                                                            defaultValue={task.status}
                                                            onValueChange={async (v) => {
                                                                try {
                                                                    await upsertTask({ id: task._id || task.id, status: v, planForWeek: task.planForWeek || currentWeekNumber.toString() });
                                                                    setTasks(prev => prev.map(t => (t._id === task._id || t.id === task.id) ? { ...t, status: v } : t));
                                                                    toast.success("Status updated");
                                                                } catch (error) {
                                                                    console.error("Failed to update status", error);
                                                                    toast.error("Failed to update status");
                                                                }
                                                            }}
                                                        >
                                                            <SelectTrigger className="w-[130px] h-8">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="In Progress">In Progress</SelectItem>
                                                                <SelectItem value="Under Review">Under Review</SelectItem>
                                                                <SelectItem value="Completed">Completed</SelectItem>
                                                                <SelectItem value="Cancelled">Cancelled</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </TableCell>
                                                    <TableCell className="text-muted-foreground">{task.dueDate}</TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-1">
                                                            <Button variant="ghost" size="sm" onClick={() => {
                                                                const normalizedTask = {
                                                                    ...task,
                                                                    relatedTo: (task.clientId || task.client?.id)?.toString(),
                                                                    isHighPriority: task.priority === 'High',
                                                                    isCompleted: task.status === 'Completed'
                                                                };
                                                                setShowEditTask(normalizedTask);
                                                            }}>
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            )) : (
                                                <TableRow>
                                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                                        No tasks found for this client.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                                {sortedTasks.length > itemsPerPage && (
                                    <div className="p-2">
                                        <DataPagination
                                            currentPage={currentPageTasks}
                                            totalPages={Math.ceil(sortedTasks.length / itemsPerPage)}
                                            onPageChange={setCurrentPageTasks}
                                        />
                                    </div>
                                )}
                            </div>
                        </>
                    ) : activeView === "notes" ? (
                        <>
                            {/* Notes View */}
                            <div className="flex items-center justify-between shrink-0">
                                <div className="flex items-center gap-2">
                                    <h3 className="font-heading font-semibold">Client Notes</h3>
                                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                                        {clientNotes.length} {clientNotes.length === 1 ? 'note' : 'notes'}
                                    </span>
                                </div>
                                <Button size="sm" onClick={() => setShowAddNote(true)}>
                                    <Plus className="h-4 w-4 mr-1" />
                                    Add Note
                                </Button>
                            </div>

                            {/* Add Note Form */}
                            {showAddNote && (
                                <div className="bg-card rounded-xl border shadow-lg p-4 animate-in slide-in-from-top-2 shrink-0">
                                    <textarea
                                        className="w-full px-3 py-2 border rounded-lg bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
                                        rows={3}
                                        placeholder="Add a note about this client..."
                                        value={newNote}
                                        onChange={(e) => setNewNote(e.target.value)}
                                    />
                                    <div className="flex justify-end gap-2 mt-3">
                                        <Button variant="outline" size="sm" onClick={() => setShowAddNote(false)}>Cancel</Button>
                                        <Button size="sm" onClick={handleAddNote}>
                                            <Save className="h-4 w-4 mr-1" />
                                            Save Note
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* Notes List */}
                            <div className="flex flex-col flex-1 min-h-0 overflow-hidden h-[600px] border rounded-xl bg-card">
                                <div className="flex-1 overflow-y-auto min-h-0 space-y-3 p-4">
                                    {paginatedClientNotes.length > 0 ? paginatedClientNotes.map((note, idx) => (
                                        <div key={note._id || note.id || `note-${idx}`} className="bg-muted/10 rounded-xl border p-4 hover:shadow-md transition-shadow duration-200">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[10px] font-bold uppercase">
                                                        {note.author.split(' ').map(n => n[0]).join('')}
                                                    </div>
                                                    <span className="font-medium text-sm capitalize">{note.author}</span>
                                                </div>
                                                <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{note.date}</span>
                                            </div>
                                            <p className="text-sm text-muted-foreground leading-relaxed ml-10">{note.content}</p>
                                        </div>
                                    )) : (
                                        <div className="flex flex-col items-center justify-center py-12 text-center h-full">
                                            <StickyNote className="h-10 w-10 text-muted-foreground/20 mb-3" />
                                            <p className="text-sm font-medium text-muted-foreground">
                                                No notes yet
                                            </p>
                                            <p className="text-xs text-muted-foreground/60 mt-1">
                                                Add the first note for this client
                                            </p>
                                        </div>
                                    )}
                                </div>
                                {clientNotes.length > itemsPerPage && (
                                    <div className="p-4 border-t shrink-0">
                                        <DataPagination
                                            currentPage={currentPageNotes}
                                            totalPages={Math.ceil(clientNotes.length / itemsPerPage)}
                                            onPageChange={setCurrentPageNotes}
                                        />
                                    </div>
                                )}
                            </div>
                        </>
                    ) : activeView === "services" && (
                        <div className="bg-card rounded-xl border flex flex-col flex-1 min-h-0 overflow-hidden h-[600px]">
                            <div className="flex items-center justify-between p-4 pb-3 shrink-0">
                                <div className="flex items-center gap-2">
                                    <Layers className="h-4 w-4 text-primary" />
                                    <h3 className="font-heading font-semibold text-sm">Add-on Services</h3>
                                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                                        {filteredServices.length} {filteredServices.length === 1 ? 'service' : 'services'}
                                    </span>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto min-h-0 px-4 pb-2">
                                {!paginatedServices || paginatedServices.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-12 text-center h-full">
                                        <Layers className="h-10 w-10 text-muted-foreground/20 mb-3" />
                                        <p className="text-sm font-medium text-muted-foreground">
                                            No add-on services subscribed yet
                                        </p>
                                    </div>
                                ) : (
                                    <div className="grid gap-3">
                                        {paginatedServices.map((service) => (
                                            <div key={service._id || service.serviceId} className="p-4 bg-accent/30 rounded-xl border flex items-center justify-between hover:shadow-sm transition-shadow">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-semibold text-sm">{service.name}</p>
                                                        {service.type === 'priority' && (
                                                            <Badge variant="default" className="bg-amber-500 hover:bg-amber-600 h-5 px-1.5 text-[9px] font-bold">
                                                                ⚡ PRIORITY
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <p className="text-[10px] text-muted-foreground">
                                                        Subscribed: {service.subscribedDate ? new Date(service.subscribedDate).toLocaleDateString() : 'N/A'}
                                                    </p>
                                                </div>
                                                {service.type === 'priority' && service.status !== 'completed' && (
                                                    <div className="px-3">
                                                        <CountdownTimer startDate={service.subscribedDate} status={service.status} />
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-3">
                                                    <Select
                                                        defaultValue={service.status}
                                                        onValueChange={async (newStatus) => {
                                                            const res = await updateSubscribedServiceStatus(selectedClient._id || selectedClient.id, service._id, newStatus);
                                                            if (res) {
                                                                toast.success(`Service status updated to ${newStatus}`);
                                                                setSelectedClient(res); // Update local state
                                                                setClients(prev => prev.map(c => (c._id === res._id || c.id === res.id) ? res : c));
                                                            } else {
                                                                toast.error("Failed to update status");
                                                            }
                                                        }}
                                                    >
                                                        <SelectTrigger className="w-[140px] h-9 text-xs">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="active">Active</SelectItem>
                                                            <SelectItem value="in-progress">In Progress</SelectItem>
                                                            <SelectItem value="completed">Completed</SelectItem>
                                                            <SelectItem value="cancelled">Cancelled</SelectItem>
                                                            <SelectItem value="expired">Expired</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <Badge className={cn(
                                                        "capitalize text-[10px] px-2",
                                                        service.status === 'completed' ? "bg-green-100 text-green-700 border-green-200" :
                                                            service.status === 'in-progress' ? "bg-blue-100 text-blue-700 border-blue-200" :
                                                                service.status === 'cancelled' ? "bg-red-100 text-red-700 border-red-200" :
                                                                    "bg-accent text-accent-foreground"
                                                    )}>
                                                        {service.status}
                                                    </Badge>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            {filteredServices.length > itemsPerPage && (
                                <div className="p-4 border-t shrink-0">
                                    <DataPagination
                                        currentPage={currentPageServices}
                                        totalPages={Math.ceil(filteredServices.length / itemsPerPage)}
                                        onPageChange={setCurrentPageServices}
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Right Side - Client Details (scrollable) */}
                <div className="overflow-y-auto space-y-3 pb-4" style={{ scrollbarWidth: 'thin' }}>
                    {/* Client Profile Card */}
                    <div className="bg-card rounded-xl border shadow-sm p-4">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary font-heading font-bold text-lg uppercase ring-2 ring-primary/10">
                                {selectedClient.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h2 className="font-heading font-semibold text-lg capitalize truncate">{selectedClient.name}</h2>
                                <p className="text-sm text-muted-foreground capitalize truncate">{selectedClient.company || 'Personal'}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <Badge variant={selectedClient.status === "active" ? "default" : "outline"}
                                        className={selectedClient.status === "active" ? "bg-green-500/10 text-green-600 border-green-500/20 text-[10px]" : "text-[10px]"}>
                                        {selectedClient.status === "active" ? "Active" : selectedClient.status === "pending" ? "Pending" : selectedClient.status || "Active"}
                                    </Badge>
                                    <Badge variant={selectedClient.plan === "Platinum" ? "default" : selectedClient.plan === "Premium" ? "secondary" : "outline"}
                                        className={`text-[10px] ${selectedClient.plan === "Free" ? "bg-emerald-100 text-emerald-700 border-emerald-200" : !selectedClient.plan ? "bg-gray-100 text-gray-500 border-gray-200" : ""}`}>
                                        {selectedClient.plan || "None"} Plan
                                    </Badge>
                                </div>
                            </div>
                        </div>

                        {/* Contact Info */}
                        <div className="space-y-2">
                            <h4 className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Contact</h4>
                            <button
                                onClick={() => setShowMailForm(true)}
                                className="flex items-center gap-2 text-xs hover:text-primary transition-colors text-left"
                            >
                                <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                <span className="truncate">{selectedClient.email}</span>
                            </button>
                            {selectedClient.phone && (
                                <a
                                    href={`https://wa.me/${selectedClient.phone?.replace(/[^0-9]/g, '')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-xs hover:text-green-600 transition-colors"
                                >
                                    <Phone className="h-3.5 w-3.5 text-green-500 shrink-0" />
                                    <span>{selectedClient.phone}</span>
                                </a>
                            )}
                        </div>
                    </div>

                    {/* Subscription & Plan */}
                    <div className="bg-card rounded-xl border p-4">
                        <h4 className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider mb-2">Subscription & Plan</h4>
                        <div className="grid grid-cols-2 gap-y-2 gap-x-2 text-xs">
                            <div className="text-muted-foreground">Plan:</div>
                            <div className="font-medium">{selectedClient.plan || "None"}</div>

                            <div className="text-muted-foreground">Support SLA:</div>
                            <div className="font-medium">{selectedClient.supportType || "-"}</div>

                            <div className="text-muted-foreground">Sub. Start:</div>
                            <div className="font-medium">
                                {selectedClient.subscriptionStart
                                    ? new Date(selectedClient.subscriptionStart).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                                    : '-'}
                            </div>

                            <div className="text-muted-foreground">Sub. End:</div>
                            <div className="font-medium">
                                {selectedClient.subscriptionEnd
                                    ? new Date(selectedClient.subscriptionEnd).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                                    : '-'}
                            </div>
                        </div>
                    </div>

                    {/* Task Summary */}
                    <div className="bg-card rounded-xl border p-4">
                        <h4 className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider mb-2">Task Summary</h4>
                        <div className="grid grid-cols-2 gap-2 text-center">
                            <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                                <p className="text-lg font-bold text-blue-600">
                                    {clientTasks.filter(t => (t.status || "").toLowerCase().replace(/-/g, ' ') === "in progress").length}
                                </p>
                                <p className="text-[10px] text-muted-foreground">In Progress</p>
                            </div>
                            <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/20">
                                <p className="text-lg font-bold text-amber-600">
                                    {clientTasks.filter(t => (t.status || "").toLowerCase().replace(/-/g, ' ') === "under review").length}
                                </p>
                                <p className="text-[10px] text-muted-foreground">Under Review</p>
                            </div>
                            <div className="p-2 bg-green-500/10 rounded-lg border border-green-500/20">
                                <p className="text-lg font-bold text-green-600">
                                    {clientTasks.filter(t => (t.status || "").toLowerCase() === "completed").length}
                                </p>
                                <p className="text-[10px] text-muted-foreground">Completed</p>
                            </div>
                            <div className="p-2 bg-red-500/10 rounded-lg border border-red-500/20">
                                <p className="text-lg font-bold text-red-600">
                                    {clientTasks.filter(t => (t.status || "").toLowerCase() === "cancelled").length}
                                </p>
                                <p className="text-[10px] text-muted-foreground">Cancelled</p>
                            </div>
                        </div>
                    </div>

                    {/* Management & Operations */}
                    <div className="bg-card rounded-xl border p-4">
                        <h4 className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider mb-2">Management & Operations</h4>
                        <div className="grid grid-cols-2 gap-y-2 gap-x-2 text-xs">
                            <div className="text-muted-foreground">Assigned POC:</div>
                            <div className="font-medium capitalize">
                                {selectedClient.manager === "Unassigned" || !selectedClient.manager ? (
                                    <Badge variant="outline" className="border-destructive text-destructive text-[10px]">Unassigned</Badge>
                                ) : selectedClient.manager}
                            </div>

                            <div className="text-muted-foreground">Sales Manager:</div>
                            <div className="font-medium truncate capitalize">{selectedClient.salesManager || "-"}</div>

                            <div className="text-muted-foreground">Listing Manager:</div>
                            <div className="font-medium truncate capitalize">{selectedClient.listingManager || "-"}</div>

                            <div className="text-muted-foreground">Ads Manager:</div>
                            <div className="font-medium truncate capitalize">{selectedClient.adsManager || "-"}</div>

                            <div className="text-muted-foreground">Supervisor:</div>
                            <div className="font-medium truncate capitalize">{selectedClient.supervisor || "-"}</div>
                        </div>
                    </div>

                    {/* Account Details */}
                    <div className="bg-card rounded-xl border p-4">
                        <h4 className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider mb-2">Account Details</h4>
                        <div className="grid grid-cols-2 gap-y-2 gap-x-2 text-xs">
                            <div className="text-muted-foreground">Customer ID/Token:</div>
                            <div className="font-medium font-mono text-[10px] truncate">{selectedClient.merchantToken || "-"}</div>

                            <div className="text-muted-foreground">SP Central Req ID:</div>
                            <div className="font-medium truncate">{selectedClient.spCentralRequestId || "-"}</div>

                            <div className="text-muted-foreground">Stage:</div>
                            <div className="font-medium">
                                {selectedClient.stage ? (
                                    <Badge variant="outline" className="text-[10px] bg-muted/50">{selectedClient.stage}</Badge>
                                ) : "-"}
                            </div>

                            <div className="text-muted-foreground">Marketplace:</div>
                            <div className="font-medium">{selectedClient.marketplace || "-"}</div>

                            <div className="text-muted-foreground">Lead Source:</div>
                            <div className="font-medium">{selectedClient.leadSource || "-"}</div>

                            <div className="text-muted-foreground">GST No:</div>
                            <div className="font-medium font-mono text-[10px]">{selectedClient.gstNo || "-"}</div>

                            <div className="text-muted-foreground">User Permission:</div>
                            <div className="font-medium truncate">
                                {selectedClient.userPermission ? (
                                    selectedClient.userPermission.startsWith('http') ? (
                                        <a href={selectedClient.userPermission} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Link ↗</a>
                                    ) : selectedClient.userPermission
                                ) : "-"}
                            </div>

                            <div className="text-muted-foreground">Account Access:</div>
                            <div className="font-medium truncate">
                                {selectedClient.accountAccessUrl ? (
                                    <a href={selectedClient.accountAccessUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Link ↗</a>
                                ) : "-"}
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-card rounded-xl border p-4">
                        <h4 className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider mb-2">Quick Actions</h4>
                        <div className="space-y-1.5">
                            <Button variant="outline" size="sm" className="w-full justify-start h-8 text-xs" onClick={() => { setActiveView("tasks"); setShowCreateTask(true); }}>
                                <Plus className="h-3.5 w-3.5 mr-2" />
                                Create New Task
                            </Button>
                            <Button variant="outline" size="sm" className="w-full justify-start h-8 text-xs" onClick={() => { setActiveView("notes"); setShowAddNote(true); }}>
                                <StickyNote className="h-3.5 w-3.5 mr-2" />
                                Add Note
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mail Modal */}
            {showMailForm && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowMailForm(false)}>
                    <div className="bg-card rounded-xl border p-6 w-full max-w-lg animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-heading font-semibold text-lg">Send Email to Client</h3>
                            <Button variant="ghost" size="sm" onClick={() => setShowMailForm(false)}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        <div className="space-y-4">
                            <div className="grid gap-2">
                                <label className="text-sm font-medium">To:</label>
                                <Input value={selectedClient.email} disabled className="bg-muted" />
                            </div>
                            <div className="grid gap-2">
                                <label className="text-sm font-medium">From:</label>
                                <Input value={`${currentUser.name} (${currentUser.email})`} disabled className="bg-muted" />
                            </div>
                            <div className="grid gap-2">
                                <label className="text-sm font-medium">Subject:</label>
                                <Input
                                    placeholder="Enter subject"
                                    value={mailSubject}
                                    onChange={(e) => setMailSubject(e.target.value)}
                                />
                            </div>
                            <div className="grid gap-2">
                                <label className="text-sm font-medium">Message:</label>
                                <textarea
                                    className="px-3 py-2 border rounded-lg bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[150px]"
                                    placeholder="Type your message here..."
                                    value={mailBody}
                                    onChange={(e) => setMailBody(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 mt-6">
                            <Button variant="outline" onClick={() => setShowMailForm(false)} disabled={isSubmitting}>Cancel</Button>
                            <Button onClick={handleSendMail} disabled={isSubmitting}>
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        <Mail className="h-4 w-4 mr-2" />
                                        Send Email
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Task Modal */}
            {showCreateTask && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => { setShowCreateTask(false); resetNewTaskForm(); }}>
                    <div className="bg-card rounded-xl border p-6 w-full max-w-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-heading font-semibold text-lg">Create New Task</h3>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground">Owner</span>
                                    <Select value={newTask.owner} onValueChange={(v) => setNewTask({ ...newTask, owner: v })}>
                                        <SelectTrigger className="w-[180px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {admins.map((admin, idx) => (
                                                <SelectItem key={admin._id || admin.id || `admin-${idx}`} value={admin.name}>{admin.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => { setShowCreateTask(false); resetNewTaskForm(); }}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-5">
                            {/* Task Name */}
                            <div className="flex items-center gap-4">
                                <label className="text-sm font-medium w-32 text-right">Task Name</label>
                                <Input
                                    className="flex-1"
                                    placeholder="Enter task name"
                                    value={newTask.title}
                                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                                />
                            </div>

                            {/* Due Date */}
                            <div className="flex items-center gap-4">
                                <label className="text-sm font-medium w-32 text-right">Due Date</label>
                                <Input
                                    type="date"
                                    className="flex-1"
                                    value={newTask.dueDate}
                                    onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                                />
                            </div>

                            {/* Plan for the week */}
                            <div className="flex items-center gap-4">
                                <label className="text-sm font-medium w-32 text-right">Plan for the week</label>
                                <Select value={newTask.planForWeek} onValueChange={(v) => setNewTask({ ...newTask, planForWeek: v })}>
                                    <SelectTrigger className="flex-1">
                                        <SelectValue placeholder="Select week" />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-[300px]">
                                        {weekNumbers.map(week => (
                                            <SelectItem key={week.value} value={week.value} disabled={week.disabled}>{week.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Related To - Auto-selected */}
                            <div className="flex items-center gap-4">
                                <label className="text-sm font-medium w-32 text-right">Related To</label>
                                <div className="flex-1 px-3 py-2 bg-muted/50 rounded-lg border text-sm">
                                    {selectedClient.company}
                                    <span className="text-muted-foreground ml-2">(Auto-selected)</span>
                                </div>
                            </div>

                            {/* Description */}
                            <div className="flex items-start gap-4">
                                <label className="text-sm font-medium w-32 text-right pt-2">Description</label>
                                <textarea
                                    className="flex-1 px-3 py-2 border rounded-lg bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    rows={3}
                                    placeholder="A few words about this task"
                                    value={newTask.description}
                                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                                />
                            </div>

                            {/* Attachment */}
                            <div className="flex items-center gap-4">
                                <label className="text-sm font-medium w-32 text-right">Attachment</label>
                                <Input
                                    type="file"
                                    className="flex-1 cursor-pointer"
                                    onChange={(e) => setSelectedFile(e.target.files[0])}
                                />
                            </div>

                            {/* Status */}
                            <div className="flex items-center gap-4">
                                <label className="text-sm font-medium w-32 text-right">Status</label>
                                <Select value={newTask.status || "In Progress"} onValueChange={(v) => setNewTask({ ...newTask, status: v })}>
                                    <SelectTrigger className="flex-1">
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="In Progress">In Progress</SelectItem>
                                        <SelectItem value="Under Review">Under Review</SelectItem>
                                        <SelectItem value="Completed">Completed</SelectItem>
                                        <SelectItem value="Cancelled">Cancelled</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Checkboxes */}
                            <div className="flex items-center gap-4">
                                <label className="text-sm font-medium w-32 text-right"></label>
                                <div className="flex-1 space-y-3">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 rounded border-gray-300"
                                            checked={newTask.isHighPriority}
                                            onChange={(e) => setNewTask({ ...newTask, isHighPriority: e.target.checked })}
                                        />
                                        <span className="text-sm">Mark as High Priority</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
                            <Button
                                variant="secondary"
                                onClick={(e) => {
                                    e.preventDefault();
                                    const stripHtml = (html) => {
                                        return (html || '')
                                            .replace(/<[^>]*>?/gm, '')
                                            .replace(/&nbsp;/g, ' ')
                                            .replace(/&amp;/g, '&')
                                            .replace(/&lt;/g, '<')
                                            .replace(/&gt;/g, '>')
                                            .replace(/&quot;/g, '"')
                                            .replace(/&#39;/g, "'")
                                            .trim();
                                    };
                                    const textToCopy = `Task: ${newTask.title || 'N/A'}\nStatus: ${newTask.status || 'In Progress'}\nPriority: ${newTask.isHighPriority ? 'High' : 'Medium'}\nOwner: ${newTask.owner || 'N/A'}\nDue Date: ${newTask.dueDate || 'N/A'}\nDescription:\n${stripHtml(newTask.description) || 'N/A'}`.trim();
                                    navigator.clipboard.writeText(textToCopy);
                                    toast.success("Task details copied!");
                                }}
                            >
                                <Copy className="h-4 w-4 mr-1" />
                                Copy Task
                            </Button>
                            <Button variant="outline" onClick={() => { setShowCreateTask(false); resetNewTaskForm(); }}>Cancel</Button>
                            <Button onClick={handleCreateTask} disabled={isSubmitting}>
                                {isSubmitting ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                                Create Task
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Task Modal */}
            {showEditTask && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowEditTask(null)}>
                    <div className="bg-card rounded-xl border p-6 w-full max-w-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-heading font-semibold text-lg">Edit Task</h3>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground">Owner</span>
                                    <Select value={showEditTask.owner} onValueChange={(v) => setShowEditTask({ ...showEditTask, owner: v })}>
                                        <SelectTrigger className="w-[180px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {admins.map((admin, idx) => (
                                                <SelectItem key={admin._id || admin.id || `admin-${idx}`} value={admin.name}>{admin.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => setShowEditTask(null)}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-5">
                            <div className="flex items-center gap-4">
                                <label className="text-sm font-medium w-32 text-right">Task Name</label>
                                <Input
                                    className="flex-1"
                                    value={showEditTask.title}
                                    onChange={(e) => setShowEditTask({ ...showEditTask, title: e.target.value })}
                                />
                            </div>

                            <div className="flex items-center gap-4">
                                <label className="text-sm font-medium w-32 text-right">Due Date</label>
                                <Input
                                    type="date"
                                    className="flex-1"
                                    value={showEditTask.dueDate || ""}
                                    onChange={(e) => setShowEditTask({ ...showEditTask, dueDate: e.target.value })}
                                />
                            </div>

                            <div className="flex items-center gap-4">
                                <label className="text-sm font-medium w-32 text-right">Plan for the week</label>
                                <Select
                                    value={showEditTask.planForWeek || (typeof getCurrentWeek === 'function' ? getCurrentWeek() : "1")}
                                    onValueChange={(v) => setShowEditTask({ ...showEditTask, planForWeek: v })}
                                >
                                    <SelectTrigger className="flex-1">
                                        <SelectValue placeholder="Select week" />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-[300px]">
                                        {weekNumbers.map(week => (
                                            <SelectItem key={week.value} value={week.value}>{week.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-center gap-4">
                                <label className="text-sm font-medium w-32 text-right">Related To</label>
                                <div className="flex-1 px-3 py-2 bg-muted/50 rounded-lg border text-sm capitalize">
                                    {selectedClient.company || selectedClient.name}
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <label className="text-sm font-medium w-32 text-right pt-2">Description</label>
                                <textarea
                                    className="flex-1 px-3 py-2 border rounded-lg bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    rows={3}
                                    value={showEditTask.description || ""}
                                    onChange={(e) => setShowEditTask({ ...showEditTask, description: e.target.value })}
                                />
                            </div>

                            <div className="flex items-center gap-4">
                                <label className="text-sm font-medium w-32 text-right">Attachment</label>
                                <div className="flex-1 space-y-2">
                                    <Input
                                        type="file"
                                        className="cursor-pointer"
                                        onChange={(e) => setSelectedFile(e.target.files[0])}
                                    />
                                    {showEditTask.attachment && (
                                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                                            Current: <a href={showEditTask.attachment.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline group flex items-center gap-1">{showEditTask.attachment.name} <Eye className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" /></a>
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <label className="text-sm font-medium w-32 text-right"></label>
                                <div className="flex-1 space-y-3">
                                    <div className="flex items-center gap-6">
                                        <div className="flex-1">
                                            <label className="text-sm font-medium mb-1 block">Priority</label>
                                            <Select
                                                value={showEditTask.priority}
                                                onValueChange={(v) => setShowEditTask({ ...showEditTask, priority: v })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="High">High</SelectItem>
                                                    <SelectItem value="Medium">Medium</SelectItem>
                                                    <SelectItem value="Low">Low</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="flex-1">
                                            <label className="text-sm font-medium mb-1 block">Status</label>
                                            <Select
                                                value={showEditTask.status}
                                                onValueChange={(v) => setShowEditTask({ ...showEditTask, status: v })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="In Progress">In Progress</SelectItem>
                                                    <SelectItem value="Under Review">Under Review</SelectItem>
                                                    <SelectItem value="Completed">Completed</SelectItem>
                                                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
                            <Button variant="outline" onClick={() => { setShowEditTask(null); setSelectedFile(null); }}>Cancel</Button>
                            <Button onClick={handleUpdateTask} disabled={isSubmitting}>
                                {isSubmitting ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                                Save Changes
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminClientsTab;
