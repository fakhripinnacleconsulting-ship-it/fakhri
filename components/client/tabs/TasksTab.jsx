"use client";

import { useState, useMemo, useEffect } from "react";
import { Eye, Filter, X, Calendar, User, CheckCircle, Loader2, ListChecks, Clock, XCircle, AlertTriangle } from "lucide-react";
import StatusBadge from "@/components/dashboard/StatusBadge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollableContainer } from "@/components/ui/scrollable-container";
import { ArrowUp, ArrowDown, ChevronsUpDown } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getTasks } from "@/lib/actions/task";
import { toast } from "sonner";
import TaskDetailsDialog from "@/components/dashboard/TaskDetailsDialog";
import { NoPlanState } from "@/components/client/NoPlanState";
import DataPagination from "@/components/ui/DataPagination";

const ClientTasksTab = ({ currentUser }) => {
    const [loading, setLoading] = useState(true);
    const [tasks, setTasks] = useState([]);
    const [showViewTask, setShowViewTask] = useState(null);
    const [showFilters, setShowFilters] = useState(false);
    const [statusFilter, setStatusFilter] = useState("all");
    const [managerFilter, setManagerFilter] = useState("all");
    const [dateRange, setDateRange] = useState({ start: "", end: "" });
    const [sortConfig, setSortConfig] = useState({ key: "dueDate", direction: "desc" });

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

    useEffect(() => {
        const loadTasksData = async () => {
            if (!currentUser) {
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                const response = await getTasks({ "client.id": currentUser._id, limit: 50 });
                const tasksArray = Array.isArray(response) ? response : (response.tasks || []);
                setTasks(tasksArray);
            } catch (error) {
                console.error("Error loading client tasks:", error);
            } finally {
                setLoading(false);
            }
        };

        loadTasksData();
    }, [currentUser]);

    // Get unique managers from tasks
    const managers = useMemo(() => {
        const unique = [...new Set(tasks.map(task => task.assignee?.name).filter(Boolean))];
        return unique;
    }, [tasks]);

    // Parse date string to Date object
    const parseDate = (dateStr) => {
        if (!dateStr) return null;
        return new Date(dateStr);
    };

    // Filter tasks based on selected filters
    const filteredTasks = useMemo(() => {
        let filtered = tasks.filter(task => {
            // Status filter
            const normalize = (s) => (s || "").toLowerCase().trim();
            if (statusFilter !== "all" && normalize(task.status) !== normalize(statusFilter)) {
                return false;
            }

            // Manager filter
            if (managerFilter !== "all" && task.assignee?.name !== managerFilter) {
                return false;
            }

            // Date range filter
            if (dateRange.start || dateRange.end) {
                const taskDate = parseDate(task.dueDate || task.updatedAt);
                if (taskDate) {
                    const tDate = new Date(taskDate);
                    tDate.setHours(0, 0, 0, 0);

                    if (dateRange.start) {
                        const startDate = new Date(dateRange.start);
                        startDate.setHours(0, 0, 0, 0);
                        if (tDate < startDate) return false;
                    }
                    if (dateRange.end) {
                        const eDate = new Date(dateRange.end);
                        eDate.setHours(0, 0, 0, 0);
                        if (tDate > eDate) return false;
                    }
                }
            }

            return true;
        });

        if (sortConfig.key) {
            filtered.sort((a, b) => {
                let aValue = a[sortConfig.key];
                let bValue = b[sortConfig.key];

                if (sortConfig.key === 'assignee') {
                    aValue = a.assignee?.name || '';
                    bValue = b.assignee?.name || '';
                } else if (sortConfig.key === 'dueDate' || sortConfig.key === 'updatedAt') {
                    aValue = new Date(a[sortConfig.key] || 0).getTime();
                    bValue = new Date(b[sortConfig.key] || 0).getTime();
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
    }, [statusFilter, managerFilter, dateRange, tasks, sortConfig]);

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 9;

    const totalPages = Math.ceil(filteredTasks.length / itemsPerPage);
    const paginatedTasks = filteredTasks.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [statusFilter, managerFilter, dateRange]);

    // Count tasks by status
    const taskCounts = useMemo(() => {
        const normalize = (s) => (s || "").toLowerCase().trim();
        const inProgress = tasks.filter(t => normalize(t.status) === "in progress").length;
        const review = tasks.filter(t => normalize(t.status) === "under review").length;
        const completed = tasks.filter(t => normalize(t.status) === "completed").length;
        const cancelled = tasks.filter(t => normalize(t.status) === "cancelled").length;
        return { inProgress, review, completed, cancelled };
    }, [tasks]);

    const clearFilters = () => {
        setStatusFilter("all");
        setManagerFilter("all");
        setDateRange({ start: "", end: "" });
    };

    const hasActiveFilters = statusFilter !== "all" || managerFilter !== "all" || dateRange.start || dateRange.end;

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground animate-pulse">Loading tasks...</p>
            </div>
        );
    }

    if ((!currentUser?.plan || currentUser?.plan === "None") && tasks.length === 0) {
        return (
            <NoPlanState
                title="Manage Your Projects"
                message="To access task management and track your project progress, please choose a subscription plan."
            />
        );
    }

    return (
        <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="font-heading text-2xl font-bold mb-1">Tasks</h1>
                    <p className="text-muted-foreground text-sm">View the status of all tasks assigned to your account.</p>
                </div>
                <Button
                    variant={showFilters ? "default" : "outline"}
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center gap-2"
                    size="sm"
                >
                    <Filter className="h-4 w-4" />
                    Filters
                    {hasActiveFilters && (
                        <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center rounded-full text-xs">
                            !
                        </Badge>
                    )}
                </Button>
            </div>

            {/* Filters Panel */}
            {showFilters && (
                <div className="bg-card rounded-xl border p-4 animate-in slide-in-from-top-2 duration-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-medium flex items-center gap-2 text-sm">
                            <Filter className="h-4 w-4" />
                            Filter Tasks
                        </h3>
                        {hasActiveFilters && (
                            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground hover:text-foreground h-7 text-xs">
                                <X className="h-3.5 w-3.5 mr-1" />
                                Clear All
                            </Button>
                        )}
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Status Filter */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium flex items-center gap-2 text-muted-foreground uppercase tracking-wider">
                                <CheckCircle className="h-3.5 w-3.5" />
                                Status
                            </label>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            >
                                <option value="all">All Status</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Under Review">Under Review</option>
                                <option value="Completed">Completed</option>
                                <option value="Cancelled">Cancelled</option>
                            </select>
                        </div>

                        {/* Manager Filter */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium flex items-center gap-2 text-muted-foreground uppercase tracking-wider">
                                <User className="h-3.5 w-3.5" />
                                Assigned To
                            </label>
                            <select
                                value={managerFilter}
                                onChange={(e) => setManagerFilter(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            >
                                <option value="all">Everyone</option>
                                {managers.map(manager => (
                                    <option key={manager} value={manager}>{manager}</option>
                                ))}
                            </select>
                        </div>

                        {/* Date Range - Start */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium flex items-center gap-2 text-muted-foreground uppercase tracking-wider">
                                <Calendar className="h-3.5 w-3.5" />
                                From Date
                            </label>
                            <input
                                type="date"
                                value={dateRange.start}
                                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                                className="w-full px-3 py-2 border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            />
                        </div>

                        {/* Date Range - End */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium flex items-center gap-2 text-muted-foreground uppercase tracking-wider">
                                <Calendar className="h-3.5 w-3.5" />
                                To Date
                            </label>
                            <input
                                type="date"
                                value={dateRange.end}
                                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                                className="w-full px-3 py-2 border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Task Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div
                    className={`p-4 rounded-xl bg-card border text-center cursor-pointer transition-all duration-200 hover:shadow-md ${statusFilter === 'In Progress' ? 'ring-2 ring-amber-500 shadow-md' : ''}`}
                    onClick={() => setStatusFilter(statusFilter === 'In Progress' ? 'all' : 'In Progress')}
                >
                    <div className="flex items-center justify-center gap-2 mb-1">
                        <Clock className="h-4 w-4 text-amber-600" />
                    </div>
                    <p className="text-2xl font-heading font-bold text-amber-600">{taskCounts.inProgress}</p>
                    <p className="text-xs text-muted-foreground font-medium">In Progress</p>
                </div>
                <div
                    className={`p-4 rounded-xl bg-card border text-center cursor-pointer transition-all duration-200 hover:shadow-md ${statusFilter === 'Under Review' ? 'ring-2 ring-purple-500 shadow-md' : ''}`}
                    onClick={() => setStatusFilter(statusFilter === 'Under Review' ? 'all' : 'Under Review')}
                >
                    <div className="flex items-center justify-center gap-2 mb-1">
                        <AlertTriangle className="h-4 w-4 text-purple-600" />
                    </div>
                    <p className="text-2xl font-heading font-bold text-purple-600">{taskCounts.review}</p>
                    <p className="text-xs text-muted-foreground font-medium">Under Review</p>
                </div>
                <div
                    className={`p-4 rounded-xl bg-card border text-center cursor-pointer transition-all duration-200 hover:shadow-md ${statusFilter === 'Completed' ? 'ring-2 ring-green-500 shadow-md' : ''}`}
                    onClick={() => setStatusFilter(statusFilter === 'Completed' ? 'all' : 'Completed')}
                >
                    <div className="flex items-center justify-center gap-2 mb-1">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                    <p className="text-2xl font-heading font-bold text-green-600">{taskCounts.completed}</p>
                    <p className="text-xs text-muted-foreground font-medium">Completed</p>
                </div>
                <div
                    className={`p-4 rounded-xl bg-card border text-center cursor-pointer transition-all duration-200 hover:shadow-md ${statusFilter === 'Cancelled' ? 'ring-2 ring-red-500 shadow-md' : ''}`}
                    onClick={() => setStatusFilter(statusFilter === 'Cancelled' ? 'all' : 'Cancelled')}
                >
                    <div className="flex items-center justify-center gap-2 mb-1">
                        <XCircle className="h-4 w-4 text-red-600" />
                    </div>
                    <p className="text-2xl font-heading font-bold text-red-600">{taskCounts.cancelled}</p>
                    <p className="text-xs text-muted-foreground font-medium">Cancelled</p>
                </div>
            </div>

            {/* Tasks Table */}
            <div className="bg-card rounded-xl border flex-1 min-h-0 flex flex-col mb-2 overflow-hidden shadow-sm">
                <ScrollableContainer className="flex-1 overflow-auto h-full" maxHeight="60vh">
                    <Table wrapperClassName="overflow-visible">
                        <TableHeader className="sticky top-0 z-10 bg-card shadow-sm border-b">
                            <TableRow className="bg-muted/50 hover:bg-muted/50">
                                <TableHead className="sticky top-0 z-10 bg-muted/50">
                                    <button onClick={() => handleSort('title')} className="flex items-center hover:text-primary transition-colors font-bold uppercase text-[11px] tracking-wider whitespace-nowrap">
                                        Task {getSortIcon('title')}
                                    </button>
                                </TableHead>
                                <TableHead className="sticky top-0 z-10 bg-muted/50">
                                    <button onClick={() => handleSort('category')} className="flex items-center hover:text-primary transition-colors font-bold uppercase text-[11px] tracking-wider whitespace-nowrap">
                                        Category {getSortIcon('category')}
                                    </button>
                                </TableHead>
                                <TableHead className="sticky top-0 z-10 bg-muted/50">
                                    <button onClick={() => handleSort('assignee')} className="flex items-center hover:text-primary transition-colors font-bold uppercase text-[11px] tracking-wider whitespace-nowrap">
                                        Assigned To {getSortIcon('assignee')}
                                    </button>
                                </TableHead>
                                <TableHead className="sticky top-0 z-10 bg-muted/50">
                                    <button onClick={() => handleSort('status')} className="flex items-center hover:text-primary transition-colors font-bold uppercase text-[11px] tracking-wider whitespace-nowrap">
                                        Status {getSortIcon('status')}
                                    </button>
                                </TableHead>
                                <TableHead className="sticky top-0 z-10 bg-muted/50">
                                    <button onClick={() => handleSort('dueDate')} className="flex items-center hover:text-primary transition-colors font-bold uppercase text-[11px] tracking-wider whitespace-nowrap">
                                        Due Date {getSortIcon('dueDate')}
                                    </button>
                                </TableHead>
                                <TableHead className="text-right sticky top-0 z-10 bg-muted/50 font-bold uppercase text-[11px] tracking-wider whitespace-nowrap">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedTasks.length > 0 ? (
                                paginatedTasks.map((task) => (
                                    <TableRow key={task._id} className="hover:bg-accent/30 transition-colors">
                                        <TableCell className="font-medium capitalize">{task.title}</TableCell>
                                        <TableCell className="text-muted-foreground capitalize">{task.category || "General"}</TableCell>
                                        <TableCell className="text-muted-foreground capitalize">{task.assignee?.name || "Unassigned"}</TableCell>
                                        <TableCell>
                                            <StatusBadge status={task.status} />
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A'}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" onClick={() => setShowViewTask(task)} className="hover:bg-primary/10 hover:text-primary">
                                                <Eye className="h-4 w-4 mr-1" />
                                                View
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                                        <div className="flex flex-col items-center gap-2">
                                            <ListChecks className="h-10 w-10 opacity-15" />
                                            <p className="font-medium">No tasks found</p>
                                            <p className="text-sm opacity-70">
                                                {hasActiveFilters ? "Try adjusting your filters." : "No tasks have been assigned yet."}
                                            </p>
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

            {/* Read-only Notice */}
            <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                <ListChecks className="h-4 w-4 text-primary/60" />
                <p>Tasks are managed by your account manager. Contact them for any task-related requests.</p>
            </div>

            <TaskDetailsDialog
                open={!!showViewTask}
                onOpenChange={(open) => !open && setShowViewTask(null)}
                task={showViewTask}
            />
        </div>
    );
};

export default ClientTasksTab;
