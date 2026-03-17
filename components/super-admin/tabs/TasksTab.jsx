"use client";
import { useState, useEffect, useMemo, useRef } from "react";
import { Plus, Eye, Upload, Edit, Clock, X, Save, Loader2, AlertCircle, Download, Copy, ArrowUp, ArrowDown, ChevronsUpDown, CheckSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import StatusBadge from "@/components/dashboard/StatusBadge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import TaskDetailsDialog from "@/components/dashboard/TaskDetailsDialog";

import {
    getTasks,
    getUsers,
    upsertTask,
    deleteTask,
    bulkDeleteTasks,
    getTeamMembers,
    getClients,
    uploadTaskAttachment,
    getActiveTaskCounts
} from "@/lib/actions/admin";
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
} from "@/components/ui/alert-dialog";

import { Trash2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import DataPagination from "@/components/ui/DataPagination";
import CountdownTimer from "@/components/ui/CountdownTimer";
import { cn, getWeekNumber } from "@/lib/utils";
import { ScrollableContainer } from "@/components/ui/scrollable-container";
import * as XLSX from "xlsx";



const SuperAdminTasksTab = ({ currentUser }) => {
    const [tasks, setTasks] = useState([]);
    const [clients, setClients] = useState([]);
    const [managers, setManagers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateTask, setShowCreateTask] = useState(false);
    const [showEditTask, setShowEditTask] = useState(null);
    const [showViewTask, setShowViewTask] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [taskToDelete, setTaskToDelete] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [selectedTasks, setSelectedTasks] = useState([]);
    const [activeTaskTab, setActiveTaskTab] = useState("active"); // "active" (In Progress/Review) or "completed" (Completed/Cancelled)

    // Bulk Upload State
    const [showBulkPreview, setShowBulkPreview] = useState(false);
    const [showValidationError, setShowValidationError] = useState(false);
    const [isFileReading, setIsFileReading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [bulkTasks, setBulkTasks] = useState([]);
    const [isBulkUploading, setIsBulkUploading] = useState(false);
    const fileInputRef = useRef(null);

    // Filters
    const [statusFilter, setStatusFilter] = useState("all");
    const [managerFilter, setManagerFilter] = useState("all");
    const [priorityFilter, setPriorityFilter] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [supportFilter, setSupportFilter] = useState("all");
    const [dateRange, setDateRange] = useState({ start: "", end: "" });

    const fetchTasks = async (showLoading = false) => {
        if (showLoading) setLoading(true);
        try {
            // We can optimize to fetch only tasks if we want "refresh table only"
            // But to be consistent with "loadData", I'll fetch everything or at least tasks.
            // User asked "refresh the table only". Table depends on `tasks`.
            // But `tasks` might depend on `clients` / `team` for names if not populated?
            // `tasks` usually comes populated from `getTasks`.
            // Let's refetch everything to be safe but lightweight.

            const [tasksRes, clientsRes, teamRes, taskCounts] = await Promise.all([
                getTasks({}),
                getClients({}),
                getTeamMembers(),
                getActiveTaskCounts()
            ]);

            if (tasksRes) {
                const tasksArray = Array.isArray(tasksRes) ? tasksRes : (tasksRes.tasks || []);
                setTasks(tasksArray);
            }
            // Updating clients/managers is also good in case users changed
            if (clientsRes) {
                const clientsArray = Array.isArray(clientsRes) ? clientsRes : (clientsRes.clients || []);
                const normalizedClients = clientsArray.map(c => ({
                    ...c,
                    id: c._id || c.id,
                    activeTasks: taskCounts[c._id?.toString() || c.id?.toString()] || 0
                }));
                setClients(normalizedClients);
            }
            if (teamRes && Array.isArray(teamRes)) {
                const normalizedAdmins = teamRes.map(a => ({
                    ...a,
                    id: a._id || a.id
                }));
                setManagers(normalizedAdmins);
            }
        } catch (error) {
            console.error("Error loading tasks data:", error);
            toast.error("Failed to refresh tasks");
        } finally {
            if (showLoading) setLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks(true);
    }, []);

    // Helper to get initials
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
        owner: "",
        ownerId: "",
        dueDate: "",
        planForWeek: currentWeekNumber.toString(),
        relatedTo: "", // Client ID
        description: "",
        isHighPriority: false,
        isCompleted: false,
        attachment: null
    });

    // Sorting Config
    const [sortConfig, setSortConfig] = useState({ key: "dueDate", direction: "asc" });

    // Handle Sorting
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

    // Filter tasks
    const filteredTasks = useMemo(() => {
        let result = tasks.filter(task => {
            const taskTitle = (task.title || "").toLowerCase();
            const clientCompany = (task.client?.company || "").toLowerCase();
            const clientName = (task.client?.name || "").toLowerCase();
            const searchLower = searchQuery.toLowerCase();
            const taskStatus = (task.status || "").toLowerCase();
            const taskPriority = (task.priority || "").toLowerCase();
            const assigneeName = (task.assignee?.name || "").toLowerCase();

            const taskId = (task.taskId || "").toLowerCase();

            const matchesSearch = taskTitle.includes(searchLower) ||
                clientCompany.includes(searchLower) ||
                clientName.includes(searchLower) ||
                assigneeName.includes(searchLower) ||
                (task.owner || "").toLowerCase().includes(searchLower) ||
                taskId.includes(searchLower);

            const matchesStatus = statusFilter === "all" || taskStatus === statusFilter.toLowerCase();
            const matchesManager = managerFilter === "all" || assigneeName.includes(managerFilter.toLowerCase());
            const matchesPriority = priorityFilter === "all" || taskPriority === priorityFilter.toLowerCase();
            const matchesSupport = supportFilter === "all" || getClientSupport(task.clientId || task.client?.id) === supportFilter;

            const matchesTab = activeTaskTab === "active"
                ? (taskStatus === "in progress" || taskStatus === "under review" || taskStatus === "")
                : (taskStatus === "completed" || taskStatus === "cancelled");

            let matchesDate = true;
            if (dateRange.start || dateRange.end) {
                const taskDate = new Date(task.dueDate || task.updatedAt);
                // Normalize task date to midnight for date-only comparison
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

            return matchesSearch && matchesStatus && matchesManager && matchesPriority && matchesDate && matchesSupport && matchesTab;
        });

        // Apply Sorting
        if (sortConfig.key) {
            result = [...result].sort((a, b) => {
                let aVal, bVal;
                switch (sortConfig.key) {
                    case 'title':
                        aVal = (a.title || '').toLowerCase();
                        bVal = (b.title || '').toLowerCase();
                        break;
                    case 'client':
                        aVal = (a.client?.company || a.client?.name || '').toLowerCase();
                        bVal = (b.client?.company || b.client?.name || '').toLowerCase();
                        break;
                    case 'manager':
                        aVal = (a.assignee?.name || '').toLowerCase();
                        bVal = (b.assignee?.name || '').toLowerCase();
                        break;
                    case 'priority':
                        const priorities = { 'High': 3, 'Medium': 2, 'Low': 1 };
                        aVal = priorities[a.priority] || 0;
                        bVal = priorities[b.priority] || 0;
                        break;
                    case 'status':
                        aVal = (a.status || '').toLowerCase();
                        bVal = (b.status || '').toLowerCase();
                        break;
                    case 'dueDate':
                        aVal = a.dueDate ? new Date(a.dueDate).getTime() : 0;
                        bVal = b.dueDate ? new Date(b.dueDate).getTime() : 0;
                        break;
                    default:
                        aVal = a[sortConfig.key];
                        bVal = b[sortConfig.key];
                }

                if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return result;
    }, [searchQuery, statusFilter, managerFilter, priorityFilter, dateRange, supportFilter, tasks, clients, sortConfig, activeTaskTab]);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 9;

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, statusFilter, managerFilter, priorityFilter, dateRange, activeTaskTab]);

    const totalPages = Math.ceil(filteredTasks.length / itemsPerPage);
    const paginatedTasks = filteredTasks.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const resetNewTaskForm = () => {
        setNewTask({
            title: "",
            owner: "",
            ownerId: "",
            dueDate: "",
            planForWeek: currentWeekNumber.toString(),
            relatedTo: "",
            description: "",
            isHighPriority: false,
            isCompleted: false,
            attachment: null
        });
        setSelectedFile(null);
    };

    const taskStats = useMemo(() => {
        return {
            total: tasks.length,
            inProgress: tasks.filter(t => t.status === "In Progress").length,
            completed: tasks.filter(t => t.status === "Completed").length,
            highPriority: tasks.filter(t => t.priority === "High").length
        };
    }, [tasks]);

    const clearFilters = () => {
        setStatusFilter("all");
        setManagerFilter("all");
        setPriorityFilter("all");
        setSearchQuery("");
        setDateRange({ start: "", end: "" });
        setSupportFilter("all");
    };


    // Auto-select manager when client is selected
    const handleClientChange = (clientId) => {
        const client = clients.find(c => c.id.toString() === clientId);
        let updates = { relatedTo: clientId };

        if (client) {
            // Try to find the manager for this client
            const managerIdOrName = client.managerId || (client.manager?.id) || (typeof client.manager === 'string' ? client.manager : null);
            if (managerIdOrName) {
                let manager = managers.find(m => m.id === managerIdOrName);
                if (!manager) {
                    manager = managers.find(m => m.name === managerIdOrName);
                }

                if (manager) {
                    updates.owner = manager.name;
                    updates.ownerId = manager.id;
                }
            }

            // Check subscription status
            const now = new Date();
            const isPlanActive = client.subscriptionEnd && new Date(client.subscriptionEnd) > now;
            const hasActiveAddons = (client.subscribedServices || []).some(s => ['active', 'in-progress'].includes(s.status));

            if (!isPlanActive && !hasActiveAddons) {
                toast.warning("NOTE: This client's plan has expired and they have no active add-on services. Task creation might fail.");
            }
        }
        setNewTask(prev => ({ ...prev, ...updates }));
    };


    // Auto-select manager when client is selected in Edit Task
    const handleEditClientChange = (clientId) => {
        const client = clients.find(c => c.id.toString() === clientId);
        let updates = { relatedTo: clientId };

        if (client) {
            const managerIdOrName = client.managerId || (client.manager?.id) || (typeof client.manager === 'string' ? client.manager : null);
            if (managerIdOrName) {
                let manager = managers.find(m => m.id === managerIdOrName);
                if (!manager) {
                    manager = managers.find(m => m.name === managerIdOrName);
                }

                if (manager) {
                    updates.owner = manager.name;
                    updates.ownerId = manager.id;
                    updates.assignee = { name: manager.name, id: manager.id };
                }
            }
        }
        setShowEditTask(prev => ({ ...prev, ...updates }));
    };

    const handleCreateTask = async () => {
        if (!newTask.title || !newTask.relatedTo) {
            toast.error("Task title and client are required");
            return;
        }

        const selectedClient = clients.find(c => (c.id || c._id)?.toString() === newTask.relatedTo);

        // Plan Expiry Check
        const now = new Date();
        const isPlanActive = selectedClient?.subscriptionEnd && new Date(selectedClient.subscriptionEnd) > now;
        const hasActiveAddons = (selectedClient?.subscribedServices || []).some(s => ['active', 'in-progress'].includes(s.status));

        if (!isPlanActive && !hasActiveAddons) {
            toast.error("This client's plan has expired and they have no active add-on services. Task creation is disabled.");
            return;
        }
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
                    id: newTask.ownerId
                },
                owner: currentUser?.name || "Super Admin",
                dueDate: newTask.dueDate,
                planForWeek: newTask.planForWeek,
                ...(attachmentData && { attachment: attachmentData }),
            };

            const savedTask = await upsertTask(taskPayload);
            if (savedTask && savedTask.error) {
                toast.error(savedTask.error);
                setIsSubmitting(false);
                return;
            }

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
                    name: showEditTask.assignee?.name || showEditTask.owner,
                    id: showEditTask.ownerId || showEditTask.assignee?.id
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

    const handleDeleteTask = async (id) => {
        try {
            const res = await deleteTask(id);
            if (res.success) {
                await fetchTasks();
                setTaskToDelete(null);
                toast.success("Task deleted");
            } else {
                toast.error("Failed to delete task");
            }
        } catch (error) {
            console.error(error);
            toast.error("Error deleting task");
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
        if (selectedTasks.length === filteredTasks.length) {
            setSelectedTasks([]);
        } else {
            setSelectedTasks(filteredTasks.map(t => t._id || t.id));
        }
    };

    // Bulk Upload Handlers
    const normalizeStatus = (status) => {
        const s = (status || "").toLowerCase().trim();
        if (s.includes("progress") || s.includes("do") || s.includes("todo")) return "In Progress";
        if (s.includes("review")) return "Under Review";
        if (s.includes("complete") || s.includes("done")) return "Completed";
        if (s.includes("cancel")) return "Cancelled";
        return "In Progress";
    };

    const normalizePriority = (priority) => {
        const p = (priority || "").toLowerCase().trim();
        if (p === "high" || p === "urgent") return "High";
        if (p === "low") return "Low";
        return "Medium";
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const fileExtension = file.name.split('.').pop().toLowerCase();
        if (!['xlsx', 'xls'].includes(fileExtension)) {
            toast.error("Please upload only Excel (.xlsx, .xls) files.");
            if (fileInputRef.current) fileInputRef.current.value = "";
            return;
        }

        setIsFileReading(true);
        setUploadProgress(0);

        // Short delay to show progress bar for better UX
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: "array", cellDates: true });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);

                // Map excel data to task format
                const mappedTasks = jsonData.map(row => {
                    const normalizedRow = {};
                    Object.keys(row).forEach(key => {
                        normalizedRow[key.toLowerCase().trim().replace(/\s+/g, '')] = row[key];
                    });

                    let rawDate = normalizedRow['duedate'] || normalizedRow['date'] || "";
                    let formattedDate = "";
                    if (rawDate instanceof Date) {
                        formattedDate = rawDate.toISOString().split('T')[0];
                    } else if (rawDate) {
                        const parsed = new Date(rawDate);
                        if (!isNaN(parsed)) {
                            formattedDate = parsed.toISOString().split('T')[0];
                        } else {
                            formattedDate = rawDate;
                        }
                    }

                    return {
                        title: normalizedRow['title'] || normalizedRow['taskname'] || "",
                        description: normalizedRow['description'] || normalizedRow['desc'] || "",
                        status: normalizeStatus(normalizedRow['status']),
                        priority: normalizePriority(normalizedRow['priority']),
                        dueDate: formattedDate,
                        planForWeek: normalizedRow['weekno'] || normalizedRow['week'] || normalizedRow['planforweek'] || "",
                        clientName: normalizedRow['client'] || normalizedRow['relatedto'] || normalizedRow['company'] || "",
                        ownerName: normalizedRow['owner'] || normalizedRow['manager'] || normalizedRow['assignee'] || ""
                    };
                });

                const hasMissingFields = mappedTasks.some(task =>
                    !task.title || !task.clientName || !task.ownerName || !task.dueDate || !task.planForWeek || !task.description
                );

                if (hasMissingFields) {
                    setBulkTasks(mappedTasks);
                    setShowValidationError(true);
                    setIsFileReading(false);
                    return;
                }

                setBulkTasks(mappedTasks);
                setTimeout(() => {
                    setIsFileReading(false);
                    setShowBulkPreview(true);
                }, 800); // Small delay for the "processing" feel
            } catch (error) {
                console.error("Error parsing Excel:", error);
                toast.error("Failed to parse Excel file");
                setIsFileReading(false);
            }
            if (fileInputRef.current) fileInputRef.current.value = "";
        };
        reader.readAsArrayBuffer(file);
    };

    const handleBulkUploadConfirm = async () => {
        if (bulkTasks.length === 0) return;
        setIsBulkUploading(true);
        setUploadProgress(0);
        let successCount = 0;
        let failCount = 0;

        try {
            if (clients.length === 0) {
                console.error("No clients loaded in state. Cannot perform bulk upload.");
                toast.error("Client data not loaded. Please refresh the page.");
                setIsBulkUploading(false);
                return;
            }

            for (const task of bulkTasks) {
                // Validation for mandatory fields
                if (!task.title || !task.clientName || !task.ownerName || !task.dueDate || !task.planForWeek || !task.description) {
                    console.error("Missing mandatory fields for task:", task);
                    failCount++;
                    continue;
                }

                const searchName = (task.clientName || "").toLowerCase().trim();

                const client = clients.find(c => {
                    const nameMatch = c.name && c.name.toLowerCase().trim() === searchName;
                    const companyMatch = c.company && c.company.toLowerCase().trim() === searchName;
                    return nameMatch || companyMatch;
                });

                const manager = managers.find(m =>
                    m.name && m.name.toLowerCase().trim() === (task.ownerName || "").toLowerCase().trim()
                );

                if (!client) {
                    const isPlaceholder = searchName === "acme corp" || searchName === "existing client name";
                    const errorMessage = isPlaceholder
                        ? `Please replace the demo client "${task.clientName}" with a real client name from your database.`
                        : `Client "${task.clientName}" not found. Ensure it matches exactly with a Client or Company name.`;

                    console.error(`Client NOT FOUND for: "${task.clientName}"`);
                    toast.error(errorMessage);
                    failCount++;
                    continue;
                }

                const taskPayload = {
                    title: task.title,
                    description: task.description,
                    status: task.status,
                    priority: task.priority,
                    dueDate: task.dueDate,
                    planForWeek: task.planForWeek ? String(task.planForWeek) : currentWeekNumber.toString(),
                    clientId: client.id,
                    client: {
                        id: client.id,
                        name: client.name,
                        company: client.company
                    },
                    owner: currentUser?.name || "Super Admin",
                    assignee: manager ? { name: manager.name, id: manager.id } : { name: task.ownerName || "Unassigned", id: null },
                    ownerId: manager ? manager.id : null
                };

                try {
                    const result = await upsertTask(taskPayload);
                    if (result && result.error) {
                        console.error(`Failed to create task for ${client.name}: ${result.error}`);
                        failCount++;
                    } else if (result) {
                        successCount++;
                    } else {
                        failCount++;
                    }
                } catch (err) {
                    console.error("Failed to create specific task", err);
                    failCount++;
                }

                // Update progress after each task
                setUploadProgress(Math.round(((successCount + failCount) / bulkTasks.length) * 100));
            }

            if (successCount > 0) toast.success(`Bulk upload complete: ${successCount} tasks created`);
            if (failCount > 0) toast.error(`${failCount} tasks failed. Check console for details.`);

            setShowBulkPreview(false);
            setBulkTasks([]);
            fetchTasks();
        } catch (error) {
            console.error("Bulk upload error:", error);
            toast.error("Bulk upload failed");
        } finally {
            setIsBulkUploading(false);
        }
    };

    const downloadTemplate = () => {
        if (clients.length === 0) {
            toast.error("Please wait for client data to load before downloading the template.");
            return;
        }

        // Use real client and manager if available for a better experience
        const sampleClient = clients[0].company || clients[0].name;
        const sampleManager = managers.length > 0 ? managers[0].name : "Unassigned";

        const templateData = [
            {
                "Title": "Website Maintenance",
                "Description": "Weekly security updates and backup verification.",
                "Client": sampleClient,
                "Owner": sampleManager,
                "Status": "In Progress",
                "Priority": "High",
                "Due Date": new Date().toISOString().split('T')[0],
                "WeekNo": currentWeekNumber.toString()
            }
        ];

        const worksheet = XLSX.utils.json_to_sheet(templateData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Tasks Template");
        XLSX.writeFile(workbook, "Fakhri_Bulk_Tasks_Template.xlsx");
        toast.success("Template downloaded with sample data");
    };

    if (loading) {
        return (
            <div className="h-64 flex flex-col items-center justify-center">
                <Loader2 className="h-8 w-8 text-primary animate-spin mb-2" />
                <p className="text-muted-foreground">Loading tasks...</p>
            </div>
        );
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
                    {selectedTasks.length > 0 && (
                        <Button variant="destructive" size="sm" className="h-8 text-xs font-bold shadow-lg shadow-destructive/20 animate-in zoom-in-95" onClick={handleBulkDelete}>
                            <Trash2 className="h-3.5 w-3.5 mr-1" />
                            Delete Selected ({selectedTasks.length})
                        </Button>
                    )}
                    <input
                        type="file"
                        accept=".xlsx, .xls"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                    />
                    <Button variant="outline" size="sm" className="h-8 text-xs" onClick={downloadTemplate}>
                        <Download className="h-3.5 w-3.5 mr-1" />
                        Template
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => fileInputRef.current?.click()}>
                        <Upload className="h-3.5 w-3.5 mr-1" />
                        Bulk Upload
                    </Button>
                    <Button size="sm" className="h-8 text-xs shadow-sm bg-primary hover:bg-primary/90" onClick={() => setShowCreateTask(true)}>
                        <Plus className="h-3.5 w-3.5 mr-1" />
                        Create Task
                    </Button>
                </div>
            </div>

            {/* Reading/Uploading Progress Bar (Overlay) */}
            {(isFileReading) && (
                <div className="fixed top-0 left-0 w-full h-1 bg-muted z-[100]">
                    <div
                        className="h-full bg-primary transition-all duration-300 ease-out"
                        style={{ width: `${isFileReading ? 90 : 0}%` }}
                    />
                </div>
            )}



            {/* Compact Unified Filters */}
            <div className="flex flex-wrap items-center gap-3 bg-card p-2 rounded-xl border shadow-sm">
                <div className="relative flex-1 min-w-[200px]">
                    <Input
                        placeholder="Search tasks, clients..."
                        className="h-9 pl-9 text-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        <Plus className="h-4 w-4 rotate-45" />
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

                <Select value={managerFilter} onValueChange={setManagerFilter}>
                    <SelectTrigger className="w-[130px] h-9 text-sm">
                        <SelectValue placeholder="Manager" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Managers</SelectItem>
                        {managers.map(m => (
                            <SelectItem key={m.id} value={m.name}>{m.name}</SelectItem>
                        ))}
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
                                    <span className="text-sm text-muted-foreground">Assigned To</span>
                                    <Select
                                        value={newTask.ownerId}
                                        onValueChange={(id) => {
                                            const member = managers.find(m => m.id === id);
                                            if (member) {
                                                setNewTask(prev => ({ ...prev, ownerId: id, owner: member.name }));
                                            }
                                        }}
                                    >
                                        <SelectTrigger className="w-[180px]">
                                            <SelectValue placeholder={newTask.owner || "Select Manager"} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {managers.map(admin => (
                                                <SelectItem key={admin.id} value={admin.id}>{admin.name}</SelectItem>
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

                            {/* Related To - Dropdown to select client */}
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
                                type="button"
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
                                <TableHead className="sticky top-0 z-20 bg-card/95 backdrop-blur-sm px-4 border-b">
                                    <input
                                        type="checkbox"
                                        className="h-4 w-4 rounded border-gray-300 transition-all cursor-pointer accent-primary"
                                        checked={selectedTasks.length === filteredTasks.length && filteredTasks.length > 0}
                                        onChange={toggleAllSelection}
                                    />
                                </TableHead>
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
                                    <button onClick={() => handleSort('manager')} className="flex items-center hover:text-primary transition-colors">
                                        Assignee {getSortIcon('manager')}
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
                                        <TableCell className="px-4">
                                            <input
                                                type="checkbox"
                                                className="h-4 w-4 rounded border-gray-300 transition-all cursor-pointer accent-primary"
                                                checked={selectedTasks.includes(task._id || task.id)}
                                                onChange={() => toggleTaskSelection(task._id || task.id)}
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
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
                                                        <span>2H EXPRESS</span>
                                                    </Badge>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                                                    {getInitials(task.assignee?.name || "Unassigned")}
                                                </div>
                                                <span className="text-sm text-muted-foreground capitalize">{task.assignee?.name || "Unassigned"}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                className={cn(
                                                    "px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                                                    (task.priority === "High" || task.priority === "Urgent") ? "bg-destructive/10 text-destructive border-destructive/20" :
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
                                                    try {
                                                        await upsertTask({ id: task._id || task.id, status: v });
                                                        await fetchTasks();
                                                        toast.success("Status updated");
                                                    } catch (error) {
                                                        console.error(error);
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
                                                            owner: task.assignee?.name || task.owner,
                                                            ownerId: task.assignee?.id,
                                                            isHighPriority: task.priority === 'High',
                                                            isCompleted: task.status === 'Completed',
                                                            planForWeek: task.planForWeek || currentWeekNumber.toString()
                                                        };
                                                        setShowEditTask(normalizedTask);
                                                    }}
                                                >
                                                    <Edit className="h-4 w-4 text-muted-foreground hover:text-blue-600 transition-colors" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 transition-colors"
                                                    onClick={() => setTaskToDelete(task._id || task.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
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
                            {Math.min(filteredTasks.length, (currentPage - 1) * itemsPerPage + 1)}-{Math.min(filteredTasks.length, currentPage * itemsPerPage)}
                        </span> of <span className="font-bold text-foreground">{filteredTasks.length}</span>
                    </p>
                    {(statusFilter !== "all" || managerFilter !== "all" || priorityFilter !== "all" || searchQuery || dateRange.start || dateRange.end) && (
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



            {/* Validation Error Dialog */}
            {
                showValidationError && (
                    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
                        <div className="bg-card rounded-xl border p-8 w-full max-w-md animate-in zoom-in-95 text-center shadow-2xl">
                            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertCircle className="h-8 w-8 text-destructive" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">Incomplete Task Data</h3>
                            <p className="text-muted-foreground mb-6">
                                Some tasks in your file are missing mandatory fields (Title, Description, Client, Owner, Due Date, or Week No). Please verify all fields are filled.
                            </p>

                            <div className="space-y-3">
                                <Button className="w-full h-12 text-lg font-semibold" onClick={downloadTemplate}>
                                    <Download className="h-5 w-5 mr-2" />
                                    Download Correct Template
                                </Button>
                                <Button variant="outline" className="w-full" onClick={() => setShowValidationError(false)}>
                                    Close and Fix File
                                </Button>
                            </div>

                            <div className="mt-6 pt-6 border-t">
                                <button
                                    onClick={() => { setShowValidationError(false); setShowBulkPreview(true); }}
                                    className="text-sm text-primary hover:underline underline-offset-4"
                                >
                                    Continue to Preview Anyway
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Bulk Preview Modal */}
            {
                showBulkPreview && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowBulkPreview(false)}>
                        <ScrollableContainer className="bg-card rounded-xl border p-6 w-full max-w-4xl animate-in zoom-in-95" maxHeight="90vh" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="font-heading font-semibold text-lg">Preview Bulk Tasks ({bulkTasks.length})</h3>
                                <Button variant="ghost" size="sm" onClick={() => setShowBulkPreview(false)}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>

                            <div className="border rounded-md overflow-hidden mb-6">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Title</TableHead>
                                            <TableHead>Description</TableHead>
                                            <TableHead>Client (CSV)</TableHead>
                                            <TableHead>Manager (CSV)</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Priority</TableHead>
                                            <TableHead>Due Date</TableHead>
                                            <TableHead>Week No</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {bulkTasks.slice(0, 10).map((task, idx) => (
                                            <TableRow key={idx}>
                                                <TableCell className="font-medium whitespace-nowrap">
                                                    {task.title || <span className="text-destructive">Missing</span>}
                                                </TableCell>
                                                <TableCell className="max-w-[200px] truncate">
                                                    {task.description || <span className="text-destructive">Missing</span>}
                                                </TableCell>
                                                <TableCell>
                                                    {task.clientName || <span className="text-destructive">Missing</span>}
                                                    {task.clientName && !clients.find(c =>
                                                        (c.name?.toLowerCase().trim() === task.clientName?.toLowerCase().trim()) ||
                                                        (c.company?.toLowerCase().trim() === task.clientName?.toLowerCase().trim())
                                                    ) && (
                                                            <span className="text-destructive ml-1 text-xs">(Not Found)</span>
                                                        )}
                                                </TableCell>
                                                <TableCell>
                                                    {task.ownerName || <span className="text-destructive">Missing</span>}
                                                    {task.ownerName && !managers.find(m => m.name?.toLowerCase() === task.ownerName?.toLowerCase()) && (
                                                        <span className="text-warning ml-1 text-xs">(Not Found)</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>{task.status}</TableCell>
                                                <TableCell>{task.priority}</TableCell>
                                                <TableCell>{task.dueDate || <span className="text-destructive">Missing</span>}</TableCell>
                                                <TableCell>{task.planForWeek || <span className="text-destructive">Missing</span>}</TableCell>
                                            </TableRow>
                                        ))}
                                        {bulkTasks.length > 10 && (
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-center text-muted-foreground">
                                                    ... and {bulkTasks.length - 10} more rows
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>

                            {isBulkUploading && (
                                <div className="mb-6 space-y-2">
                                    <div className="flex justify-between text-sm font-medium">
                                        <span>Uploading Tasks...</span>
                                        <span>{uploadProgress}%</span>
                                    </div>
                                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-primary transition-all duration-300"
                                            style={{ width: `${uploadProgress}%` }}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Validation Error Summary */}
                            {(() => {
                                const unmatchedClients = [...new Set(bulkTasks.filter(t => t.clientName && !clients.find(c =>
                                    (c.name?.toLowerCase().trim() === t.clientName?.toLowerCase().trim()) ||
                                    (c.company?.toLowerCase().trim() === t.clientName?.toLowerCase().trim())
                                )).map(t => t.clientName))];

                                const unmatchedManagers = [...new Set(bulkTasks.filter(t => t.ownerName && !managers.find(m => m.name?.toLowerCase().trim() === t.ownerName?.toLowerCase().trim())).map(t => t.ownerName))];

                                const hasMissingFields = bulkTasks.some(t => !t.title || !t.clientName || !t.ownerName || !t.dueDate || !t.planForWeek || !t.description);

                                if (unmatchedClients.length > 0 || unmatchedManagers.length > 0 || hasMissingFields) {
                                    return (
                                        <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-left">
                                            <div className="flex items-center gap-2 text-destructive mb-2">
                                                <AlertCircle className="h-4 w-4" />
                                                <span className="font-semibold text-sm">Action Required: Fix the following issues</span>
                                            </div>
                                            <ul className="text-xs space-y-1 text-destructive/90 list-disc list-inside">
                                                {hasMissingFields && <li>Some tasks are missing **Mandatory Fields** (marked in Red above).</li>}
                                                {unmatchedClients.length > 0 && (
                                                    <li>Clients Not Found: <span className="font-bold">{unmatchedClients.join(", ")}</span> (Must match "Clients" tab exactly).</li>
                                                )}
                                                {unmatchedManagers.length > 0 && (
                                                    <li>Managers Not Found: <span className="font-bold">{unmatchedManagers.join(", ")}</span> (Must match "Teams" tab exactly).</li>
                                                )}
                                            </ul>
                                            <button onClick={downloadTemplate} className="mt-3 text-xs flex items-center gap-1 text-primary hover:underline font-medium">
                                                <Download className="h-3 w-3" />
                                                Download correct template for reference
                                            </button>
                                        </div>
                                    );
                                }
                                return null;
                            })()}

                            <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setShowBulkPreview(false)}>Cancel</Button>
                                <Button
                                    onClick={handleBulkUploadConfirm}
                                    disabled={isBulkUploading || bulkTasks.length === 0 || bulkTasks.some(t => !clients.find(c => c.name?.toLowerCase().trim() === t.clientName?.toLowerCase().trim() || c.company?.toLowerCase().trim() === t.clientName?.toLowerCase().trim()))}
                                >
                                    {isBulkUploading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Upload className="h-4 w-4 mr-1" />}
                                    Upload {bulkTasks.length} Tasks
                                </Button>
                            </div>
                        </ScrollableContainer>
                    </div>
                )
            }


            {/* Edit Task Modal */}
            {
                showEditTask && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowEditTask(null)}>
                        <ScrollableContainer className="bg-card rounded-xl border p-6 w-full max-w-2xl animate-in zoom-in-95" maxHeight="90vh" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="font-heading font-semibold text-lg">Edit Task</h3>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-muted-foreground">Assigned To</span>
                                        <Select
                                            value={showEditTask.ownerId || showEditTask.assignee?.id || ""}
                                            onValueChange={(id) => {
                                                const member = managers.find(m => m.id === id);
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
                                            <SelectTrigger className="w-[180px]">
                                                <SelectValue placeholder={showEditTask.owner || "Select Manager"} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {managers.map(admin => (
                                                    <SelectItem key={admin.id} value={admin.id}>{admin.name}</SelectItem>
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
                        </ScrollableContainer>
                    </div>
                )
            }

            {/* Delete Confirmation */}
            <AlertDialog open={!!taskToDelete} onOpenChange={(open) => !open && setTaskToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete this task.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => handleDeleteTask(taskToDelete)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Delete Task
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <TaskDetailsDialog
                open={!!showViewTask}
                onOpenChange={(open) => !open && setShowViewTask(null)}
                task={showViewTask}
            />
        </div>
    );
};

export default SuperAdminTasksTab;
