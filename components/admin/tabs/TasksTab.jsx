"use client";
import { useState, useMemo, useEffect } from "react";
import { Plus, Edit, Eye, X, Save, Loader2, Copy, ArrowUp, ArrowDown, ChevronsUpDown, Search, CheckSquare, AlertCircle } from "lucide-react";
import { ScrollableContainer } from "@/components/ui/scrollable-container";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import TaskDetailsDialog from "@/components/dashboard/TaskDetailsDialog";
import { getClients, getTasks, upsertTask, deleteTask, bulkDeleteTasks, getTeamMembers, uploadTaskAttachment } from "@/lib/actions/admin";
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
import { Trash2, Clock } from "lucide-react";
import DataPagination from "@/components/ui/DataPagination";
import CountdownTimer from "@/components/ui/CountdownTimer";
import { cn, getWeekNumber } from "@/lib/utils";





const AdminTasksTab = ({ currentUser }) => {
    const [clients, setClients] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [teamMembers, setTeamMembers] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showCreateTask, setShowCreateTask] = useState(false);
    const [showEditTask, setShowEditTask] = useState(null);
    const [showViewTask, setShowViewTask] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [taskToDelete, setTaskToDelete] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);

    // Filters
    const [statusFilter, setStatusFilter] = useState("all");
    const [clientFilter, setClientFilter] = useState("all");
    const [priorityFilter, setPriorityFilter] = useState("all");
    const [supportFilter, setSupportFilter] = useState("all");
    const [dateRange, setDateRange] = useState({ start: "", end: "" });
    const [selectedTasks, setSelectedTasks] = useState([]);
    const [activeTaskTab, setActiveTaskTab] = useState("active");
    const [searchQuery, setSearchQuery] = useState("");

    const fetchTasks = async () => {
        if (!currentUser) return;

        try {
            const isSuperAdmin = currentUser.role === 'super-admin' || currentUser.role === 'superadmin' || currentUser.role === 'super_admin';

            const [clientsRes, team] = await Promise.all([
                getClients(isSuperAdmin ? {} : { managerId: currentUser._id }),
                getTeamMembers()
            ]);

            const c = clientsRes.clients || [];
            const clientIds = c.map(client => client._id);

            const taskFilter = isSuperAdmin
                ? {}
                : {
                    $or: [
                        { 'assignee.id': currentUser._id },
                        { 'client.id': { $in: clientIds } },
                        { clientId: { $in: clientIds } },
                        { ownerId: currentUser._id },
                        { owner: currentUser.name }
                    ]
                };

            // Projection for performance: Fetch only visible/needed fields for the list
            const projection = {
                title: 1, category: 1, isHighPriority: 1,
                client: 1, clientId: 1, assignee: 1, owner: 1,
                priority: 1, status: 1, dueDate: 1, createdAt: 1,
                updatedAt: 1, planForWeek: 1
            };

            const t = await getTasks(taskFilter, projection);

            const uniqueClients = Array.from(new Map(c.map(item => [String(item._id), item])).values());
            const uniqueTasks = Array.from(new Map(t.map(item => [String(item._id || item.id), item])).values());

            setClients(uniqueClients.map(client => ({ ...client, id: client._id })));
            setTeamMembers(team);
            setTasks(uniqueTasks);
        } catch (error) {
            console.error("Failed to load data", error);
            toast.error("Failed to refresh tasks");
        }
    };

    useEffect(() => {
        if (currentUser) {
            setLoading(true);
            fetchTasks().finally(() => setLoading(false));
        }
    }, [currentUser]);

    const getInitials = (name) => {
        return name ? name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : '??';
    }

    const getClientSupport = (clientId) => {
        const client = clients.find(c => (c.id || c._id)?.toString() === clientId?.toString());
        return client?.supportType || "Normal";
    };
    const currentWeekNumber = useMemo(() => getWeekNumber(), []);

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

    // New task form
    const [newTask, setNewTask] = useState({
        title: "",
        owner: currentUser?.name || "Admin",
        ownerId: currentUser?._id,
        dueDate: "",
        planForWeek: currentWeekNumber.toString(),
        relatedTo: "", // Client ID
        description: "",
        isHighPriority: false,
        isCompleted: false,
        attachment: null
    });

    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const getSortIcon = (key) => {
        if (sortConfig.key !== key) return <ChevronsUpDown className="ml-1 h-3 w-3 opacity-40 shrink-0" />;
        return sortConfig.direction === 'asc'
            ? <ArrowUp className="ml-1 h-3 w-3 text-primary shrink-0" />
            : <ArrowDown className="ml-1 h-3 w-3 text-primary shrink-0" />;
    };

    // Filter and Sort tasks
    const sortedTasks = useMemo(() => {
        let result = tasks.filter(task => {
            const taskStatus = (task.status || '').toLowerCase();
            const filterStatus = statusFilter.toLowerCase();
            const matchesStatus = statusFilter === "all" || taskStatus === filterStatus;
            const matchesClient = clientFilter === "all" || task.client?.name?.toLowerCase().includes(clientFilter.toLowerCase());
            const matchesPriority = priorityFilter === "all" || task.priority?.toLowerCase() === priorityFilter.toLowerCase();
            const matchesSupport = supportFilter === "all" || getClientSupport(task.clientId) === supportFilter;
            const matchesSearch = !searchQuery ||
                task.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                task.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                task.client?.name?.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesTab = activeTaskTab === "active"
                ? taskStatus === "in progress" || taskStatus === "under review"
                : taskStatus === "completed" || taskStatus === "cancelled";

            let matchesDate = true;
            if (dateRange.start || dateRange.end) {
                const taskDate = new Date(task.dueDate || task.updatedAt);
                taskDate.setHours(0, 0, 0, 0);

                if (dateRange.start) {
                    const startDate = new Date(dateRange.start);
                    startDate.setHours(0, 0, 0, 0);
                    if (taskDate < startDate) matchesDate = false;
                }
                if (dateRange.end && matchesDate) {
                    const endDate = new Date(dateRange.end);
                    endDate.setHours(0, 0, 0, 0);
                    if (taskDate > endDate) matchesDate = false;
                }
            }

            return matchesStatus && matchesClient && matchesPriority && matchesDate && matchesSupport && matchesSearch && matchesTab;
        });

        if (sortConfig.key) {
            result.sort((a, b) => {
                let aVal = a[sortConfig.key] || "";
                let bVal = b[sortConfig.key] || "";

                if (sortConfig.key === 'priority') {
                    const priorityOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
                    aVal = priorityOrder[aVal] || 0;
                    bVal = priorityOrder[bVal] || 0;
                } else if (sortConfig.key === 'client') {
                    aVal = a.client?.company || a.client?.name || "";
                    bVal = b.client?.company || b.client?.name || "";
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
    }, [statusFilter, clientFilter, priorityFilter, dateRange, supportFilter, tasks, sortConfig, activeTaskTab, searchQuery]);

    // Task stats
    const taskStats = useMemo(() => {
        return {
            total: tasks.length,
            inProgress: tasks.filter(t => (t.status || '').toLowerCase() === 'in progress').length,
            completed: tasks.filter(t => (t.status || '').toLowerCase() === 'completed').length,
            highPriority: tasks.filter(t => t.priority === 'High').length,
        };
    }, [tasks]);

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 9;

    const totalPages = Math.ceil(sortedTasks.length / itemsPerPage);
    const paginatedTasks = sortedTasks.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [statusFilter, clientFilter, priorityFilter, dateRange, sortConfig, activeTaskTab, searchQuery]);

    const clearFilters = () => {
        setStatusFilter("all");
        setClientFilter("all");
        setPriorityFilter("all");
        setSupportFilter("all");
        setSearchQuery("");
        setDateRange({ start: "", end: "" });
    };

    const resetNewTaskForm = () => {
        setNewTask({
            title: "",
            owner: currentUser?.name || "Admin",
            ownerId: currentUser?._id,
            dueDate: "",
            planForWeek: getWeekNumber().toString(),
            relatedTo: "",
            description: "",
            isHighPriority: false,
            isCompleted: false,
            attachment: null
        });
        setSelectedFile(null);
    };

    const handleClientChange = (clientId) => {
        setNewTask(prev => ({ ...prev, relatedTo: clientId }));
    };

    const handleEditClientChange = (clientId) => {
        setShowEditTask(prev => ({ ...prev, relatedTo: clientId }));
    };

    const handleCreateTask = async () => {
        if (!newTask.title || !newTask.relatedTo) {
            toast.error("Task title and client are required");
            return;
        }

        const selectedClient = clients.find(c => (c.id || c._id)?.toString() === newTask.relatedTo);
        setIsSubmitting(true);

        try {
            let attachmentData = null;
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

            const taskPayload = {
                title: newTask.title,
                description: newTask.description,
                status: newTask.status || 'In Progress',
                priority: newTask.isHighPriority ? 'High' : 'Medium',
                client: {
                    id: selectedClient?.id,
                    name: selectedClient?.name,
                    company: selectedClient?.company
                },
                clientId: selectedClient?.id,
                assignee: {
                    name: newTask.owner,
                    id: newTask.ownerId || currentUser._id
                },
                owner: newTask.owner,
                dueDate: newTask.dueDate,
                planForWeek: newTask.planForWeek,
                ...(attachmentData && { attachment: attachmentData }),
            };

            const savedTask = await upsertTask(taskPayload);
            if (savedTask) {
                await fetchTasks();
                setShowCreateTask(false);
                resetNewTaskForm();
                toast.success("Task created");
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to create task");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateTask = async () => {
        if (!showEditTask.title || !showEditTask.relatedTo) {
            toast.error("Task title and client are required");
            return;
        }

        const selectedClient = clients.find(c => (c.id || c._id)?.toString() === showEditTask.relatedTo);
        setIsSubmitting(true);

        try {
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

            const taskPayload = {
                ...showEditTask,
                id: showEditTask._id || showEditTask.id,
                title: showEditTask.title,
                description: showEditTask.description,
                status: showEditTask.status,
                priority: showEditTask.priority,
                client: {
                    id: selectedClient?.id,
                    name: selectedClient?.name,
                    company: selectedClient?.company
                },
                clientId: selectedClient?.id,
                assignee: {
                    name: showEditTask.owner,
                    id: showEditTask.assignee?.id || showEditTask.ownerId || currentUser._id
                },
                owner: showEditTask.owner,
                dueDate: showEditTask.dueDate,
                planForWeek: showEditTask.planForWeek || currentWeekNumber.toString(),
                ...(attachmentData && { attachment: attachmentData }),
            };

            const updatedTask = await upsertTask(taskPayload);
            if (updatedTask) {
                await fetchTasks();
                setShowEditTask(null);
                toast.success("Task updated");
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to update task");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleBulkDelete = async () => {
        if (selectedTasks.length === 0) return;
        try {
            const res = await bulkDeleteTasks(selectedTasks);
            if (res.success) {
                await fetchTasks();
                setSelectedTasks([]);
                toast.success(`${selectedTasks.length} tasks deleted`);
            } else {
                toast.error("Failed to delete tasks");
            }
        } catch (error) {
            console.error(error);
            toast.error("Error bulk deleting tasks");
        }
    };

    const toggleTaskSelection = (taskId) => {
        setSelectedTasks(prev => {
            if (prev.includes(taskId)) {
                return prev.filter(id => id !== taskId);
            } else {
                return [...prev, taskId];
            }
        });
    };

    const toggleAllSelection = () => {
        if (selectedTasks.length === sortedTasks.length) {
            setSelectedTasks([]);
        } else {
            setSelectedTasks(sortedTasks.map(t => t._id || t.id));
        }
    };

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


    if (loading) {
        return (
            <div className="h-64 flex flex-col items-center justify-center">
                <Loader2 className="h-8 w-8 text-primary animate-spin mb-2" />
                <p className="text-muted-foreground">Loading tasks...</p>
            </div>
        );
    }

    if (!currentUser) {
        return <div className="p-6 text-center text-muted-foreground">User information not available.</div>;
    }

    return (
        <div className="h-[calc(100vh-85px)] flex flex-col space-y-1 overflow-hidden">
            {/* Header Toolbar */}
            <div className="flex items-center justify-between gap-4 shrink-0 bg-background/50 p-1 rounded-lg">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-1 bg-primary rounded-full" />
                        <h1 className="text-sm font-bold tracking-tight">Status Board</h1>
                    </div>
                    {/* Tab Selection */}
                    <div className="flex bg-muted p-0.5 rounded-lg border shadow-inner">
                        <button
                            onClick={() => { setActiveTaskTab("active"); setSelectedTasks([]); setStatusFilter("all"); }}
                            className={cn(
                                "px-4 py-1.5 text-xs font-bold rounded-md transition-all duration-200",
                                activeTaskTab === "active" ? "bg-card text-primary shadow-sm ring-1 ring-black/5" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            Active Tasks
                        </button>
                        <button
                            onClick={() => { setActiveTaskTab("completed"); setSelectedTasks([]); setStatusFilter("all"); }}
                            className={cn(
                                "px-4 py-1.5 text-xs font-bold rounded-md transition-all duration-200",
                                activeTaskTab === "completed" ? "bg-card text-primary shadow-sm ring-1 ring-black/5" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            Completed & Cancelled
                        </button>
                    </div>
                </div>
                <div className="flex gap-2">
                    {selectedTasks.length > 0 && currentUser?.role === 'super-admin' && (
                        <Button variant="destructive" size="sm" className="h-8 text-xs font-bold shadow-lg shadow-destructive/20 animate-in zoom-in-95" onClick={handleBulkDelete}>
                            <Trash2 className="h-3.5 w-3.5 mr-1" />
                            Delete Selected ({selectedTasks.length})
                        </Button>
                    )}
                    <Button size="sm" className="h-8 text-xs shadow-sm bg-primary hover:bg-primary/90" onClick={() => setShowCreateTask(true)}>
                        <Plus className="h-3.5 w-3.5 mr-1" />
                        Create Task
                    </Button>
                </div>
            </div>

            {/* Compact Unified Filters */}
            <div className="flex flex-wrap items-center gap-3 bg-card p-2 rounded-xl border shadow-sm shrink-0">
                <div className="relative flex-1 min-w-[200px]">
                    <Input
                        placeholder="Search tasks, clients..."
                        className="h-9 pl-9 text-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        <Search className="h-4 w-4" />
                    </div>
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[130px] h-9 text-sm">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        {activeTaskTab === "active" ? (
                            <>
                                <SelectItem value="in progress">In Progress</SelectItem>
                                <SelectItem value="under review">Under Review</SelectItem>
                            </>
                        ) : (
                            <>
                                <SelectItem value="completed">Completed</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                            </>
                        )}
                    </SelectContent>
                </Select>

                <Select value={clientFilter} onValueChange={setClientFilter}>
                    <SelectTrigger className="w-[130px] h-9 text-sm">
                        <SelectValue placeholder="Client" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Clients</SelectItem>
                        {clients.map(c => (
                            <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger className="w-[130px] h-9 text-sm">
                        <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Priority</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                </Select>

                <div className="h-6 w-px bg-border/50 mx-1 hidden sm:block" />

                <div className="flex items-center gap-2 bg-muted/30 p-1 rounded-md border border-dashed">
                    <span className="text-[10px] font-bold uppercase text-muted-foreground px-1">Dates:</span>
                    <Input
                        type="date"
                        className="w-[125px] h-7 text-xs border-none bg-transparent focus-visible:ring-0 p-0"
                        value={dateRange.start}
                        onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                    />
                    <span className="text-muted-foreground px-1">-</span>
                    <Input
                        type="date"
                        className="w-[125px] h-7 text-xs border-none bg-transparent focus-visible:ring-0 p-0"
                        value={dateRange.end}
                        onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                    />
                </div>
            </div>

            {/* Create Task Form */}
            {showCreateTask && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-hidden" onClick={() => setShowCreateTask(false)}>
                    <ScrollableContainer className="bg-card rounded-xl border p-6 animate-in slide-in-from-top-2 w-full max-w-2xl" maxHeight="90vh" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-heading font-semibold text-lg">Task Information</h3>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground mr-1">Owner:</span>
                                    <Select
                                        value={newTask.ownerId}
                                        onValueChange={(id) => {
                                            const member = teamMembers.find(m => m._id === id);
                                            if (member) {
                                                setNewTask(prev => ({ ...prev, ownerId: id, owner: member.name }));
                                            }
                                        }}
                                    >
                                        <SelectTrigger className="w-[180px] h-8 text-sm">
                                            <SelectValue placeholder={newTask.owner} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {teamMembers.map(member => (
                                                <SelectItem key={member._id} value={member._id}>{member.name}</SelectItem>
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
                            <div className="flex items-center gap-4">
                                <label className="text-sm font-medium w-32 text-right">Task Name</label>
                                <Input
                                    className="flex-1"
                                    placeholder="Enter task name"
                                    value={newTask.title}
                                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                                />
                            </div>

                            <div className="flex items-center gap-4">
                                <label className="text-sm font-medium w-32 text-right">Due Date</label>
                                <Input
                                    type="date"
                                    className="flex-1"
                                    value={newTask.dueDate}
                                    onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                                />
                            </div>

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

                            <div className="flex items-center gap-4">
                                <label className="text-sm font-medium w-32 text-right">Related To</label>
                                <Select value={newTask.relatedTo} onValueChange={handleClientChange}>
                                    <SelectTrigger className="flex-1">
                                        <SelectValue placeholder="Select client" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {clients.map(c => (
                                            <SelectItem key={c.id} value={c.id.toString()}>{c.company || c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

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
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    const textToCopy = `Task: ${newTask.title || 'N/A'}\nStatus: ${newTask.status || 'In Progress'}\nPriority: ${newTask.isHighPriority ? 'High' : (newTask.priority || 'Medium')}\nOwner: ${newTask.owner || 'N/A'}\nDue Date: ${newTask.dueDate || 'N/A'}\nPlan for the week: ${newTask.planForWeek || 'N/A'}\nDescription:\n${stripHtml(newTask.description) || 'N/A'}`.trim();
                                    navigator.clipboard.writeText(textToCopy);
                                    toast.success("Task details copied to clipboard!");
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
                    </ScrollableContainer>
                </div>
            )}

            {/* Tasks Table Area - Fills remaining space */}
            <div className="flex-1 min-h-0 bg-card rounded-xl border relative overflow-hidden shadow-sm">
                <ScrollableContainer maxHeight="100%">
                    <Table className="border-separate border-spacing-0" wrapperClassName="overflow-visible">
                        <TableHeader className="relative z-10">
                            <TableRow className="hover:bg-transparent border-none">
                                {currentUser?.role === 'super-admin' && (
                                    <TableHead className="sticky top-0 z-20 bg-card/95 backdrop-blur-sm px-4 border-b">
                                        <input
                                            type="checkbox"
                                            className="h-4 w-4 rounded border-gray-300 transition-all cursor-pointer accent-primary"
                                            checked={selectedTasks.length === sortedTasks.length && sortedTasks.length > 0}
                                            onChange={toggleAllSelection}
                                        />
                                    </TableHead>
                                )}
                                <TableHead className="sticky top-0 z-20 bg-card/95 backdrop-blur-sm font-bold uppercase text-[11px] tracking-wider border-b">
                                    <button onClick={() => handleSort('title')} className="flex items-center hover:text-primary transition-colors">
                                        Task {getSortIcon('title')}
                                    </button>
                                </TableHead>
                                <TableHead className="sticky top-0 z-20 bg-card/95 backdrop-blur-sm font-bold uppercase text-[11px] tracking-wider border-b">
                                    <button onClick={() => handleSort('client')} className="flex items-center hover:text-primary transition-colors">
                                        Client {getSortIcon('client')}
                                    </button>
                                </TableHead>
                                <TableHead className="sticky top-0 z-20 bg-card/95 backdrop-blur-sm font-bold uppercase text-[11px] tracking-wider border-b">
                                    <button onClick={() => handleSort('owner')} className="flex items-center hover:text-primary transition-colors">
                                        Owner {getSortIcon('owner')}
                                    </button>
                                </TableHead>
                                <TableHead className="sticky top-0 z-20 bg-card/95 backdrop-blur-sm font-bold uppercase text-[11px] tracking-wider border-b">
                                    <button onClick={() => handleSort('priority')} className="flex items-center hover:text-primary transition-colors">
                                        Priority {getSortIcon('priority')}
                                    </button>
                                </TableHead>
                                <TableHead className="sticky top-0 z-20 bg-card/95 backdrop-blur-sm font-bold uppercase text-[11px] tracking-wider border-b">
                                    <button onClick={() => handleSort('status')} className="flex items-center hover:text-primary transition-colors">
                                        Status {getSortIcon('status')}
                                    </button>
                                </TableHead>
                                <TableHead className="sticky top-0 z-20 bg-card/95 backdrop-blur-sm font-bold uppercase text-[11px] tracking-wider border-b">
                                    <button onClick={() => handleSort('dueDate')} className="flex items-center hover:text-primary transition-colors">
                                        Due Date {getSortIcon('dueDate')}
                                    </button>
                                </TableHead>
                                <TableHead className="sticky top-0 z-20 bg-card/95 backdrop-blur-sm font-bold uppercase text-[11px] tracking-wider text-right border-b whitespace-nowrap">Actions</TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {paginatedTasks.length > 0 ? (
                                paginatedTasks.map((task, index) => (
                                    <TableRow
                                        key={task._id ? `${task._id}-${index}` : index}
                                        className={cn(
                                            "group hover:bg-muted/30 transition-colors cursor-default",
                                            selectedTasks.includes(task._id || task.id) && "bg-primary/5"
                                        )}
                                    >
                                        {currentUser?.role === 'super-admin' && (
                                            <TableCell className="px-4">
                                                <input
                                                    type="checkbox"
                                                    className="h-4 w-4 rounded border-gray-300 transition-all cursor-pointer accent-primary"
                                                    checked={selectedTasks.includes(task._id || task.id)}
                                                    onChange={() => toggleTaskSelection(task._id || task.id)}
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            </TableCell>
                                        )}
                                        <TableCell>
                                            <div className="flex flex-col" onClick={() => setShowViewTask(task)} style={{ cursor: 'pointer' }}>
                                                <p className="font-semibold text-foreground group-hover:text-primary transition-colors capitalize">{task.title}</p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <Badge variant="outline" className="text-[9px] py-0 px-1 font-medium bg-muted/50">
                                                        {task.category || "General"}
                                                    </Badge>
                                                    {task.isHighPriority && (
                                                        <span className="flex h-1.5 w-1.5 rounded-full bg-destructive animate-pulse" />
                                                    )}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-sm text-foreground capitalize">{task.client?.company || task.client?.name || "N/A"}</span>
                                                </div>
                                                {getClientSupport(task.clientId || task.client?.id) === "Within 2 Hours" && (
                                                    <Badge className="bg-amber-100 hover:bg-amber-100 text-amber-600 border-amber-200 text-[9px] py-0 h-4 flex items-center gap-1 w-fit shadow-sm font-bold">
                                                        <Clock className="w-2.5 h-2.5" />
                                                        <span>⚡ 2H EXPRESS</span>
                                                    </Badge>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                                                    {getInitials(task.assignee?.name || task.owner)}
                                                </div>
                                                <span className="text-sm text-muted-foreground capitalize">
                                                    {typeof task.owner === 'string' ? task.owner : (task.assignee?.name || "Unassigned")}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                className={cn(
                                                    "px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                                                    task.priority === "High" ? "bg-destructive/10 text-destructive border-destructive/20" :
                                                        task.priority === "Medium" ? "bg-amber-100 text-amber-700 border-amber-200" :
                                                            "bg-slate-100 text-slate-600 border-slate-200"
                                                )}
                                                variant="outline"
                                            >
                                                {task.priority}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Select
                                                defaultValue={task.status}
                                                onValueChange={async (v) => {
                                                    const originalStatus = task.status;
                                                    // Optimistic Update
                                                    setTasks(prev => prev.map(t =>
                                                        (t._id === task._id || t.id === task.id) ? { ...t, status: v } : t
                                                    ));

                                                    try {
                                                        const result = await upsertTask({ id: task._id || task.id, status: v });
                                                        if (!result) throw new Error("Update failed");
                                                        toast.success(`Status updated to ${v}`);
                                                    } catch (error) {
                                                        console.error(error);
                                                        // Rollback on error
                                                        setTasks(prev => prev.map(t =>
                                                            (t._id === task._id || t.id === task.id) ? { ...t, status: originalStatus } : t
                                                        ));
                                                        toast.error("Failed to update status");
                                                    }
                                                }}
                                            >
                                                <SelectTrigger className="w-[130px] h-8 text-xs font-medium">
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
                                        <TableCell>
                                            <div className="space-y-1">
                                                <p className="text-sm font-medium">{task.dueDate || "No date"}</p>
                                                <div className="flex flex-col gap-1">
                                                    {getClientSupport(task.clientId || task.client?.id) === "Within 2 Hours" && task.status !== "Completed" && (
                                                        <CountdownTimer startDate={task.createdAt} hours={2} status={task.status} />
                                                    )}
                                                    <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                        <Clock className="h-2.5 w-2.5" />
                                                        Created {task.createdAt ? new Date(task.createdAt).toLocaleDateString() : "Never"}
                                                    </p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0"
                                                    onClick={() => setShowViewTask(task)}
                                                >
                                                    <Eye className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0"
                                                    onClick={() => {
                                                        const normalizedTask = {
                                                            ...task,
                                                            relatedTo: (task.clientId || task.client?.id)?.toString(),
                                                            isHighPriority: task.priority === 'High',
                                                            isCompleted: task.status === 'Completed',
                                                            planForWeek: task.planForWeek || currentWeekNumber.toString()
                                                        };
                                                        setShowEditTask(normalizedTask);
                                                    }}
                                                >
                                                    <Edit className="h-4 w-4 text-muted-foreground hover:text-blue-600 transition-colors" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={8} className="h-96">
                                        <div className="flex flex-col items-center justify-center text-center animate-in fade-in zoom-in-95 duration-500">
                                            <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                                                <CheckSquare className="h-8 w-8 text-muted-foreground/50" />
                                            </div>
                                            <h3 className="text-lg font-semibold text-foreground">No tasks found</h3>
                                            <p className="text-sm text-muted-foreground max-w-[250px] mt-1">
                                                We couldn't find any tasks matching your current filters or search query.
                                            </p>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="mt-4"
                                                onClick={clearFilters}
                                            >
                                                Clear All Filters
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </ScrollableContainer>
            </div>

            {/* Minimalist Pagination & Stats Footer - Always at bottom */}
            <div className="flex flex-wrap items-center justify-between gap-4 px-0 shrink-0 mt-auto py-0">
                {/* Result Indicator */}
                <div className="flex items-center gap-3 min-w-[120px]">
                    <p className="text-[14px] text-muted-foreground">
                        Showing <span className="font-bold text-foreground">
                            {Math.min(sortedTasks.length, (currentPage - 1) * itemsPerPage + 1)}-{Math.min(sortedTasks.length, currentPage * itemsPerPage)}
                        </span> of <span className="font-bold text-foreground">{sortedTasks.length}</span>
                    </p>
                    {(statusFilter !== "all" || clientFilter !== "all" || priorityFilter !== "all" || searchQuery || dateRange.start || dateRange.end) && (
                        <button
                            onClick={clearFilters}
                            className="text-[10px] text-primary hover:underline font-medium"
                        >
                            Reset
                        </button>
                    )}
                </div>

                {/* Center Stats - Dynamic & Compact */}
                <div className="hidden lg:flex items-center gap-4 px-3 py-1 bg-muted/40 rounded-full border border-border/50">
                    <div className="flex items-center gap-1.5 border-r pr-3">
                        <CheckSquare className="h-3 w-3 text-primary" />
                        <span className="text-[14px] font-medium">Total: <span className="font-bold">{taskStats.total}</span></span>
                    </div>
                    <div className="flex items-center gap-1.5 border-r pr-3 text-blue-600">
                        <Clock className="h-3 w-3" />
                        <span className="text-[14px] font-medium">Active: <span className="font-bold">{taskStats.inProgress}</span></span>
                    </div>
                    <div className="flex items-center gap-1.5 border-r pr-3 text-green-600">
                        <Save className="h-3 w-3" />
                        <span className="text-[14px] font-medium">Done: <span className="font-bold">{taskStats.completed}</span></span>
                    </div>
                    <div className="flex items-center gap-1.5 text-destructive">
                        <AlertCircle className="h-3 w-3" />
                        <span className="text-[14px] font-medium">High: <span className="font-bold">{taskStats.highPriority}</span></span>
                    </div>
                </div>

                {/* Compact Pagination */}
                <div className="min-w-[120px] flex justify-end">
                    <DataPagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                    />
                </div>
            </div>

            {/* Edit Task Modal */}
            {
                showEditTask && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowEditTask(null)}>
                        <div className="bg-card rounded-xl border p-6 w-full max-w-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="font-heading font-semibold text-lg">Edit Task</h3>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-muted-foreground mr-1">Owner:</span>
                                        <Select
                                            value={showEditTask.assignee?.id || showEditTask.ownerId || ""}
                                            onValueChange={(id) => {
                                                const member = teamMembers.find(m => m._id === id);
                                                if (member) {
                                                    setShowEditTask(prev => ({
                                                        ...prev,
                                                        ownerId: id,
                                                        owner: member.name,
                                                        assignee: { ...prev.assignee, id: id, name: member.name }
                                                    }));
                                                }
                                            }}
                                        >
                                            <SelectTrigger className="w-[180px] h-8 text-sm">
                                                <SelectValue placeholder={showEditTask.owner} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {teamMembers.map(member => (
                                                    <SelectItem key={member._id} value={member._id}>{member.name}</SelectItem>
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
                                        value={showEditTask.planForWeek || currentWeekNumber.toString()}
                                        onValueChange={(v) => setShowEditTask({ ...showEditTask, planForWeek: v })}
                                    >
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

                                <div className="flex items-center gap-4">
                                    <label className="text-sm font-medium w-32 text-right">Related To</label>
                                    <Select
                                        value={showEditTask.relatedTo}
                                        onValueChange={handleEditClientChange}
                                    >
                                        <SelectTrigger className="flex-1">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {clients.map(c => (
                                                <SelectItem key={c.id} value={c.id.toString()}>{c.company}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
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

                                {/* Attachment */}
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
                                                    onValueChange={(v) => setShowEditTask({ ...showEditTask, priority: v, isHighPriority: v === 'High' })}
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
                                                    onValueChange={(v) => setShowEditTask({ ...showEditTask, status: v, isCompleted: v === 'Completed' })}
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
                                <Button variant="outline" onClick={() => setShowEditTask(null)}>Cancel</Button>
                                <Button onClick={handleUpdateTask} disabled={isSubmitting}>
                                    {isSubmitting ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                                    Save Changes
                                </Button>
                            </div>
                        </div>
                    </div>
                )
            }


            <TaskDetailsDialog
                open={!!showViewTask}
                onOpenChange={(open) => !open && setShowViewTask(null)}
                task={showViewTask}
            />
        </div >
    );
};

export default AdminTasksTab;
