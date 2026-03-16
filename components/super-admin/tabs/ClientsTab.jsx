"use client";
import { useState, useMemo, useEffect } from "react";
import {
    CheckSquare, StickyNote, Edit, Save, Calendar, User,
    Filter, ChevronDown, ChevronUp, Clock, ArrowLeft, UserCog, Loader2, Trash2,
    Plus, Eye, X, Mail, Phone, Building2, CreditCard, Check, ChevronsUpDown, Receipt, Layers, Download, Info,
    ArrowUpDown, ArrowUp, ArrowDown, Send, Copy, CalendarPlus, Search, AlertTriangle
} from "lucide-react";
import dynamic from 'next/dynamic';
const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });
import 'react-quill-new/dist/quill.snow.css';
import InvoiceLayout from "@/components/invoice/InvoiceLayout";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollableContainer } from "@/components/ui/scrollable-container";
import { cn } from "@/lib/utils";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import DataPagination from "@/components/ui/DataPagination";
import CountdownTimer from "@/components/ui/CountdownTimer";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
    getUsers,
    getTasks,
    getActiveTaskCounts,
    upsertClient,
    deleteClient,
    bulkDeleteClients,
    deleteTask,
    upsertTask,
    upsertNote,
    getNotes,
    updateSubscribedServiceStatus,
    uploadTaskAttachment,
    getTeamMembers,
    bulkUploadClients,
    validateBulkClientsData,
    bulkExtendSubscription,
    updateClientSubscriptionEnd,
    getTeams,
    getInvoices,
    sendClientEmail
} from "@/lib/actions/admin";
import { toast } from "sonner";



const ManagerCombobox = ({ value, onChange, managers, placeholder, compact = false }) => {
    const [open, setOpen] = useState(false);

    // Find selected manager object if value exists
    const selectedManager = managers.find((m) => m.name === value);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn(
                        "w-full justify-between font-normal h-auto transition-all",
                        compact ? "py-1.5 text-xs px-2" : "py-2"
                    )}
                >
                    {value && value !== "Unassigned" ? (
                        <div className="flex flex-col items-start text-left truncate">
                            <span className={cn("font-medium capitalize truncate", compact ? "text-[11px]" : "text-sm")}>{value}</span>
                            {!compact && selectedManager?.email && (
                                <span className="text-[10px] text-muted-foreground truncate">{selectedManager.email}</span>
                            )}
                        </div>
                    ) : value === "Unassigned" ? (
                        <Badge variant="outline" className={cn("border-destructive/30 text-destructive border-dashed hover:bg-destructive/5 font-semibold", compact ? "text-[10px] py-0 px-1.5" : "text-xs")}>
                            Unassigned
                        </Badge>
                    ) : (
                        <span className="text-muted-foreground">{placeholder || "Select manager..."}</span>
                    )}
                    <ChevronsUpDown className={cn("ml-2 shrink-0 opacity-50", compact ? "h-3 w-3" : "h-4 w-4")} />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="start">
                <Command>
                    <CommandInput placeholder="Search manager..." />
                    <CommandEmpty>No manager found.</CommandEmpty>
                    <CommandList>
                        <CommandGroup>
                            <CommandItem
                                value="Unassigned"
                                onSelect={() => {
                                    onChange("Unassigned");
                                    setOpen(false);
                                }}
                            >
                                <Check
                                    className={cn(
                                        "mr-2 h-4 w-4",
                                        value === "Unassigned" ? "opacity-100" : "opacity-0"
                                    )}
                                />
                                <div className="flex flex-col">
                                    <span>Unassigned</span>
                                </div>
                            </CommandItem>
                            {managers.map((manager) => (
                                <CommandItem
                                    key={manager._id || manager.id}
                                    value={manager.name}
                                    keywords={[manager.name, manager.email]}
                                    onSelect={() => {
                                        onChange(manager.name === value ? "" : manager.name);
                                        setOpen(false);
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4 mt-1",
                                            value === manager.name ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    <div className="flex flex-col">
                                        <span className="font-medium capitalize">{manager.name}</span>
                                        <span className="text-xs text-muted-foreground">{manager.email}</span>
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
};

const TeamCombobox = ({ selectedTeams, onChange, teams, placeholder }) => {
    const [open, setOpen] = useState(false);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between font-normal h-auto min-h-10"
                >
                    {selectedTeams.length > 0
                        ? <div className="flex flex-wrap gap-1">
                            {selectedTeams.map(teamId => {
                                const team = teams.find(t => t._id === teamId);
                                return <Badge key={teamId} variant="secondary" className="mr-1">{team?.name}</Badge>
                            })}
                        </div>
                        : placeholder || "Select teams..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command>
                    <CommandInput placeholder="Search team..." />
                    <CommandEmpty>No team found.</CommandEmpty>
                    <CommandList className="max-h-[300px]">
                        <CommandGroup>
                            {teams.map((team) => (
                                <CommandItem
                                    key={team._id}
                                    value={team.name}
                                    onSelect={() => {
                                        const isSelected = selectedTeams.includes(team._id);
                                        if (isSelected) {
                                            onChange(selectedTeams.filter(id => id !== team._id));
                                        } else {
                                            onChange([...selectedTeams, team._id]);
                                        }
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            selectedTeams.includes(team._id) ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {team.name}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
};

const AdminMultiSelect = ({ selectedAdmins, onChange, admins, placeholder }) => {
    const [open, setOpen] = useState(false);
    const sortedAdmins = [...admins].sort((a, b) => (a.name || "").localeCompare(b.name || ""));

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between font-normal h-auto min-h-10 px-3"
                >
                    {(selectedAdmins || []).length > 0
                        ? <div className="flex flex-wrap gap-1">
                            {selectedAdmins.map(adminId => {
                                const admin = admins.find(a => (a._id || a.id) === adminId);
                                return <Badge key={adminId} variant="secondary" className="mr-1">{admin?.name}</Badge>
                            })}
                        </div>
                        : <span className="text-muted-foreground">{placeholder || "Select admins..."}</span>}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command>
                    <CommandInput placeholder="Search admin..." />
                    <CommandEmpty>No admin found.</CommandEmpty>
                    <CommandList className="max-h-[300px]">
                        <CommandGroup>
                            {sortedAdmins.map((admin) => {
                                const adminId = admin._id || admin.id;
                                const role = (admin.adminRole || "").toLowerCase();
                                const isFixedRole = role.includes('poc') || role.includes('sales manager') || role.includes('ads manager');

                                return (
                                    <CommandItem
                                        key={adminId}
                                        value={`${admin.name} ${admin.adminRole || ""}`}
                                        onSelect={() => {
                                            const isSelected = (selectedAdmins || []).includes(adminId);
                                            // If it's a fixed role and already selected, prevent unselecting
                                            if (isFixedRole && isSelected) {
                                                return;
                                            }

                                            if (isSelected) {
                                                onChange(selectedAdmins.filter(id => id !== adminId));
                                            } else {
                                                onChange([...(selectedAdmins || []), adminId]);
                                            }
                                        }}
                                        className={cn((isFixedRole && (selectedAdmins || []).includes(adminId)) && "opacity-90 cursor-not-allowed")}
                                    >
                                        <Check
                                            className={cn(
                                                "mr-2 h-4 w-4",
                                                (selectedAdmins || []).includes(adminId) ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                        <div className="flex flex-col">
                                            <span className="font-medium">{admin.name}</span>
                                            {admin.adminRole && <span className="text-[10px] text-muted-foreground uppercase">{admin.adminRole}</span>}
                                        </div>
                                    </CommandItem>
                                );
                            })}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
};

const TeamMemberVisibilitySelector = ({ selectedTeams, teams, assignedAdminIds, setAssignedAdminIds, clientData }) => {
    if (!selectedTeams || selectedTeams.length === 0) return null;

    return (
        <div className="flex flex-col gap-2 border p-3 rounded-md mt-2 bg-muted/20 w-full">
            <Label className="text-xs font-semibold uppercase text-muted-foreground flex-shrink-0">Team Member Visibility</Label>
            <p className="text-[10px] text-muted-foreground mb-1 leading-tight flex-shrink-0">Select members to grant them dashboard access to this client. Roles like POC/Sales/Ads are automatically pre-selected.</p>
            <div
                className="max-h-48 overflow-y-auto overflow-x-hidden pr-2 flex flex-col gap-3 mt-1"
                style={{ scrollbarWidth: 'thin', scrollbarColor: 'hsl(var(--muted-foreground)/0.3) transparent' }}
            >
                {selectedTeams.map(teamId => {
                    const team = teams.find(t => t._id === teamId);
                    if (!team) return null;
                    // De-duplicate members just in case lead is also in members array
                    const membersMap = new Map();
                    const allMembers = [team.leadId, ...(team.memberIds || [])].filter(Boolean);
                    allMembers.forEach(m => membersMap.set((m._id || m.id).toString(), m));
                    const members = Array.from(membersMap.values());

                    if (members.length === 0) return null;

                    return (
                        <div key={team._id} className="space-y-1">
                            <span className="text-xs font-medium sticky top-0 bg-muted/20 backdrop-blur-sm z-10 py-0.5">{team.name}</span>
                            <div className="flex flex-wrap gap-2 mt-1">
                                {members.map(member => {
                                    const mId = (member._id || member.id).toString();
                                    const role = (member.adminRole || "").toLowerCase();
                                    const isFixed = role.includes('poc') || role.includes('sales manager') || role.includes('ads manager') ||
                                        (clientData?.manager && member.name === clientData.manager) ||
                                        (clientData?.salesManager && member.name === clientData.salesManager) ||
                                        (clientData?.adsManager && member.name === clientData.adsManager);

                                    const isSelected = (assignedAdminIds || []).includes(mId) || isFixed;

                                    return (
                                        <Badge
                                            key={mId}
                                            variant={isSelected ? 'default' : 'outline'}
                                            className={`font-normal rounded-sm px-2 py-0.5 transition-opacity ${isFixed ? 'opacity-90 cursor-not-allowed' : 'cursor-pointer hover:opacity-80'}`}
                                            onClick={() => {
                                                if (isFixed) return;
                                                const current = assignedAdminIds || [];
                                                setAssignedAdminIds(
                                                    isSelected
                                                        ? current.filter(id => id !== mId)
                                                        : [...current, mId]
                                                );
                                            }}
                                        >
                                            <div className="flex items-center gap-1">
                                                {isSelected && <Check className="h-3 w-3" />}
                                                {member.name} {member.adminRole ? <span className="text-[9px] opacity-70 ml-1">({member.adminRole})</span> : ''}
                                            </div>
                                        </Badge>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const SuperAdminClientsTab = () => {
    const [clients, setClients] = useState([]);
    const [isPlanEditable, setIsPlanEditable] = useState(false); // State to control plan editing
    const [managers, setManagers] = useState([]);
    const [teams, setTeams] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [notes, setNotes] = useState([]); // Add notes state
    const [invoices, setInvoices] = useState([]); // Add invoices state
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [isInvoiceViewOpen, setIsInvoiceViewOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedClient, setSelectedClient] = useState(null);
    const [isUploadingBulk, setIsUploadingBulk] = useState(false);
    const [deletingClientId, setDeletingClientId] = useState(null);
    const [bulkUploadState, setBulkUploadState] = useState({
        isOpen: false,
        progress: 0,
        total: 0,
        current: 0,
        success: 0,
        failed: 0,
        errors: [],
        status: "idle" // "idle", "uploading", "completed"
    });

    useEffect(() => {
        async function loadInitialData() {
            setLoading(true);
            const [clientsRes, teamRes, teamsRes, taskCounts] = await Promise.all([
                getUsers({ role: 'client', limit: 1000 }),
                getTeamMembers(),
                getTeams(),
                getActiveTaskCounts()
            ]);

            if (clientsRes.users) {
                // Attach active task counts to clients
                const clientsWithStats = clientsRes.users.map(client => ({
                    ...client,
                    activeTasks: taskCounts[client._id] || 0
                }));
                setClients(clientsWithStats);
            }
            if (teamRes) {
                const normalizedAdmins = teamRes.map(a => ({
                    ...a,
                    id: a._id || a.id
                }));
                setManagers(normalizedAdmins);
            }
            if (teamsRes) setTeams(teamsRes);
            setLoading(false);
        }
        loadInitialData();
    }, []);

    // Fetch tasks and notes when a client is selected
    useEffect(() => {
        if (selectedClient) {
            async function loadClientData() {
                const [tasksRes, notesRes, invoicesRes] = await Promise.all([
                    getTasks({ "client.id": selectedClient._id }),
                    getNotes(selectedClient._id),
                    getInvoices({ clientId: selectedClient._id, limit: 100 })
                ]);
                if (tasksRes) {
                    const tasksArray = Array.isArray(tasksRes) ? tasksRes : (tasksRes.tasks || []);
                    setTasks(tasksArray);
                }
                if (notesRes) setNotes(notesRes);
                if (invoicesRes) {
                    const invoicesArray = Array.isArray(invoicesRes) ? invoicesRes : (invoicesRes.invoices || []);
                    setInvoices(invoicesArray);
                }
            }
            loadClientData();
        } else {
            setTasks([]);
            setNotes([]);
            setInvoices([]);
        }
    }, [selectedClient]);

    const [activeView, setActiveView] = useState("tasks"); // "tasks" or "notes"
    const [showCreateTask, setShowCreateTask] = useState(false);
    const [showEditTask, setShowEditTask] = useState(null);
    const [showAddNote, setShowAddNote] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [detailsSearchQuery, setDetailsSearchQuery] = useState("");
    const [selectedFile, setSelectedFile] = useState(null);

    // Detail Views Pagination
    const [tasksPage, setTasksPage] = useState(1);
    const [notesPage, setNotesPage] = useState(1);
    const [invoicesPage, setInvoicesPage] = useState(1);
    const [servicesPage, setServicesPage] = useState(1);
    const detailsItemsPerPage = 10;

    // Reset detail pages when search query changes
    useEffect(() => {
        setTasksPage(1);
        setNotesPage(1);
        setInvoicesPage(1);
        setServicesPage(1);
    }, [detailsSearchQuery]);

    // List filters
    const [planFilter, setPlanFilter] = useState("all");
    const [managerFilter, setManagerFilter] = useState("all");
    const [teamFilter, setTeamFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");

    // Mail states
    const [showMailForm, setShowMailForm] = useState(false);
    const [mailSubject, setMailSubject] = useState("");
    const [mailBody, setMailBody] = useState("");
    const [mailIncludeDashboard, setMailIncludeDashboard] = useState(false);
    const [isSendingMail, setIsSendingMail] = useState(false);

    // Bulk Mail states
    const [showBulkMail, setShowBulkMail] = useState(false);
    const [bulkMailSubject, setBulkMailSubject] = useState("");
    const [bulkMailBody, setBulkMailBody] = useState("");
    const [bulkMailIncludeDashboard, setBulkMailIncludeDashboard] = useState(false);
    const [isSendingBulkMail, setIsSendingBulkMail] = useState(false);
    const [supportFilter, setSupportFilter] = useState("all");

    // Sorting state
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

    // Multi-select state
    const [selectedClientIds, setSelectedClientIds] = useState([]);

    // Extend subscription states
    const [showExtendModal, setShowExtendModal] = useState(false);
    const [extendDays, setExtendDays] = useState(30);
    const [isExtending, setIsExtending] = useState(false);
    const [showIndividualExtend, setShowIndividualExtend] = useState(null); // client object
    const [individualExtendDate, setIndividualExtendDate] = useState("");
    const [isIndividualExtending, setIsIndividualExtending] = useState(false);

    // Bulk Delete states
    const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);
    const [bulkDeleteConfirmText, setBulkDeleteConfirmText] = useState("");

    // Helper: get remaining days of plan using subscriptionEnd field
    const getRemainingDays = (client) => {
        if (!client.subscriptionEnd) return null;
        const endDate = new Date(client.subscriptionEnd);
        const now = new Date();
        const diff = endDate - now;
        const remainingDays = Math.ceil(diff / (1000 * 60 * 60 * 24));
        return remainingDays;
    };

    // Sort handler
    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    // Get sort icon
    const getSortIcon = (key) => {
        if (sortConfig.key !== key) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-40" />;
        return sortConfig.direction === 'asc'
            ? <ArrowUp className="h-3 w-3 ml-1 text-primary" />
            : <ArrowDown className="h-3 w-3 ml-1 text-primary" />;
    };

    // Multi-select handlers (defined after paginatedClients below)

    // Task filters
    const [taskStatusFilter, setTaskStatusFilter] = useState("all");
    const [priorityFilter, setPriorityFilter] = useState("all");
    const [ownerFilter, setOwnerFilter] = useState("all");
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

    // New task form
    const [newTask, setNewTask] = useState({
        title: "",
        owner: "",
        ownerId: "",
        dueDate: "",
        planForWeek: currentWeekNumber.toString(),
        description: "",
        isHighPriority: false,
        isCompleted: false,
        attachment: null
    });


    // Add Client State
    const [showAddClient, setShowAddClient] = useState(false);
    const [newClientData, setNewClientData] = useState({
        name: "",
        company: "",
        email: "",
        phone: "",
        plan: "None",
        manager: "Unassigned",
        salesManager: "",
        spCentralRequestId: "",
        marketplace: "",
        userPermission: "",
        accountAccessUrl: "",
        leadSource: "",
        listingManager: "",
        gstNo: "",
        merchantToken: "",
        stage: "None",
        teams: []
    });

    // Edit Client State
    const [showEditClient, setShowEditClient] = useState(false);
    const [editClientData, setEditClientData] = useState(null);

    // New note
    const [newNote, setNewNote] = useState("");

    // Filter clients
    const filteredClients = useMemo(() => {
        let result = clients.filter(client => {
            const matchesSearch = (client.name && client.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (client.company && client.company.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (client.email && client.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (client.merchantToken && client.merchantToken.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (client.stage && client.stage.toLowerCase().includes(searchQuery.toLowerCase()));
            const matchesPlan = planFilter === "all" || (client.plan || "").toLowerCase() === planFilter;
            const matchesManager = managerFilter === "all" ||
                (managerFilter === "unassigned" && (!client.manager || client.manager === "Unassigned")) ||
                client.manager === managerFilter;
            const matchesTeam = teamFilter === "all" || (client.teams && client.teams.some(t => {
                const teamId = typeof t === "object" ? t._id : t;
                return teamId === teamFilter;
            }));
            const matchesStatus = statusFilter === "all" || client.status === statusFilter;
            const matchesSupport = supportFilter === "all" || client.supportType === supportFilter;
            return matchesSearch && matchesPlan && matchesManager && matchesStatus && matchesTeam && matchesSupport;
        });

        // Apply sorting
        if (sortConfig.key) {
            result = [...result].sort((a, b) => {
                let aVal, bVal;
                switch (sortConfig.key) {
                    case 'name':
                        aVal = (a.name || '').toLowerCase();
                        bVal = (b.name || '').toLowerCase();
                        break;
                    case 'subscriptionStart':
                        aVal = a.subscriptionStart ? new Date(a.subscriptionStart).getTime() : 0;
                        bVal = b.subscriptionStart ? new Date(b.subscriptionStart).getTime() : 0;
                        break;
                    case 'subscriptionEnd':
                        aVal = a.subscriptionEnd ? new Date(a.subscriptionEnd).getTime() : 0;
                        bVal = b.subscriptionEnd ? new Date(b.subscriptionEnd).getTime() : 0;
                        break;
                    case 'plan':
                        aVal = (a.plan || '').toLowerCase();
                        bVal = (b.plan || '').toLowerCase();
                        break;
                    case 'poc':
                        aVal = (a.manager || 'zzz').toLowerCase();
                        bVal = (b.manager || 'zzz').toLowerCase();
                        break;
                    case 'status':
                        aVal = (a.status || '').toLowerCase();
                        bVal = (b.status || '').toLowerCase();
                        break;
                    case 'remainingDays': {
                        const aDays = getRemainingDays(a);
                        const bDays = getRemainingDays(b);
                        aVal = aDays !== null ? aDays : -9999;
                        bVal = bDays !== null ? bDays : -9999;
                        break;
                    }
                    default:
                        aVal = '';
                        bVal = '';
                }
                if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return result;
    }, [searchQuery, planFilter, managerFilter, statusFilter, teamFilter, supportFilter, clients, sortConfig]);

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 9;

    const totalPages = Math.ceil(filteredClients.length / itemsPerPage);
    const paginatedClients = filteredClients.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, planFilter, managerFilter, statusFilter, teamFilter, supportFilter]);

    // Multi-select handlers
    const handleSelectClient = (clientId) => {
        setSelectedClientIds(prev =>
            prev.includes(clientId)
                ? prev.filter(id => id !== clientId)
                : [...prev, clientId]
        );
    };

    const handleSelectAll = (checked) => {
        if (checked) {
            // Add current page's clients to existing selection (accumulate across pages)
            const currentPageIds = paginatedClients.map(c => c._id);
            setSelectedClientIds(prev => [...new Set([...prev, ...currentPageIds])]);
        } else {
            // Only remove current page's clients from selection, keep others
            const currentPageIds = new Set(paginatedClients.map(c => c._id));
            setSelectedClientIds(prev => prev.filter(id => !currentPageIds.has(id)));
        }
    };

    const isAllSelected = paginatedClients.length > 0 && paginatedClients.every(c => selectedClientIds.includes(c._id));
    const isSomeSelected = selectedClientIds.length > 0;

    // Get tasks for selected client
    const clientTasks = useMemo(() => {
        if (!selectedClient) return [];
        let filteredTasks = tasks;

        const normalizeValue = (val) => (val || "").toLowerCase().trim().replace(/-/g, ' ');

        if (taskStatusFilter !== "all") {
            const normalizedFilter = normalizeValue(taskStatusFilter);
            filteredTasks = filteredTasks.filter(t => {
                const normalizedStatus = normalizeValue(t.status);
                // "Pending" filter should also include "Under Review" if preferred, 
                // but let's stick to explicit if we add "Under Review" to the filter select
                return normalizedStatus === normalizedFilter;
            });
        }
        if (priorityFilter !== "all") {
            const normalizedFilter = normalizeValue(priorityFilter);
            filteredTasks = filteredTasks.filter(t => normalizeValue(t.priority) === normalizedFilter);
        }
        if (ownerFilter !== "all") {
            filteredTasks = filteredTasks.filter(t => (t.assignee?.name || t.owner || "") === ownerFilter);
        }

        if (detailsSearchQuery) {
            const query = detailsSearchQuery.toLowerCase();
            filteredTasks = filteredTasks.filter(t =>
                (t.title || "").toLowerCase().includes(query) ||
                (t.description || "").toLowerCase().includes(query)
            );
        }

        return filteredTasks;
    }, [selectedClient, taskStatusFilter, priorityFilter, ownerFilter, tasks, detailsSearchQuery]);

    const paginatedClientTasks = useMemo(() => {
        return clientTasks.slice((tasksPage - 1) * detailsItemsPerPage, tasksPage * detailsItemsPerPage);
    }, [clientTasks, tasksPage]);

    // Use notes from state
    const clientNotes = useMemo(() => {
        if (!detailsSearchQuery) return notes;
        return notes.filter(n =>
            (n.content || "").toLowerCase().includes(detailsSearchQuery.toLowerCase()) ||
            (n.author || "").toLowerCase().includes(detailsSearchQuery.toLowerCase())
        );
    }, [notes, detailsSearchQuery]);

    const paginatedClientNotes = useMemo(() => {
        return clientNotes.slice((notesPage - 1) * detailsItemsPerPage, notesPage * detailsItemsPerPage);
    }, [clientNotes, notesPage]);

    const filteredInvoices = useMemo(() => {
        if (!detailsSearchQuery) return invoices;
        return invoices.filter(inv =>
            (inv.invoiceNumber || "").toLowerCase().includes(detailsSearchQuery.toLowerCase()) ||
            (inv.items?.[0]?.description || "").toLowerCase().includes(detailsSearchQuery.toLowerCase()) ||
            (inv.amount || "").toString().includes(detailsSearchQuery.toLowerCase())
        );
    }, [invoices, detailsSearchQuery]);

    const paginatedInvoices = useMemo(() => {
        return filteredInvoices.slice((invoicesPage - 1) * detailsItemsPerPage, invoicesPage * detailsItemsPerPage);
    }, [filteredInvoices, invoicesPage]);

    const filteredServices = useMemo(() => {
        if (!selectedClient?.subscribedServices) return [];
        if (!detailsSearchQuery) return selectedClient.subscribedServices;
        return selectedClient.subscribedServices.filter(s =>
            (s.name || "").toLowerCase().includes(detailsSearchQuery.toLowerCase()) ||
            (s.status || "").toLowerCase().includes(detailsSearchQuery.toLowerCase())
        );
    }, [selectedClient, detailsSearchQuery]);

    const paginatedServices = useMemo(() => {
        return filteredServices.slice((servicesPage - 1) * detailsItemsPerPage, servicesPage * detailsItemsPerPage);
    }, [filteredServices, servicesPage]);

    const handleClientClick = (client) => {
        setSelectedClient(client);
        setActiveView("tasks");
        setShowCreateTask(false);
        setShowEditTask(null);
        setShowAddNote(false);
        setShowEditClient(false);
        setEditClientData(null);
        setTasksPage(1);
        setNotesPage(1);
        setInvoicesPage(1);
        setServicesPage(1);
        setDetailsSearchQuery("");

        // Set default manager for task creation
        const managerId = client.managerId || (client.manager?.id) || null;
        if (managerId) {
            const manager = managers.find(m => m.id === managerId.toString());
            if (manager) {
                setNewTask(prev => ({ ...prev, owner: manager.name, ownerId: manager.id }));
            }
        } else {
            setNewTask(prev => ({ ...prev, owner: "Unassigned", ownerId: "" }));
        }
    };

    const handleBackToList = () => {
        setSelectedClient(null);
        setActiveView("tasks");
    };

    const resetNewTaskForm = () => {
        // Find default manager for current client if possible
        const managerId = selectedClient?.managerId || (selectedClient?.manager?.id) || null;
        let defaultOwner = "Unassigned";
        let defaultOwnerId = "";

        if (managerId) {
            const manager = managers.find(m => m.id === managerId.toString());
            if (manager) {
                defaultOwner = manager.name;
                defaultOwnerId = manager.id;
            }
        }

        setNewTask({
            title: "",
            owner: defaultOwner,
            ownerId: defaultOwnerId,
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
                    id: selectedClient._id,
                    name: selectedClient.name,
                    company: selectedClient.company
                },
                clientId: selectedClient._id,
                assignee: {
                    name: newTask.owner,
                    id: newTask.ownerId
                },
                owner: newTask.owner,
                dueDate: newTask.dueDate,
                planForWeek: newTask.planForWeek || currentWeekNumber.toString(),
                ...(attachmentData && { attachment: attachmentData }),
            };

            const savedTask = await upsertTask(taskPayload);
            if (savedTask) {
                setTasks(prev => [savedTask, ...prev]);

                // Update active tasks count in the main clients list
                setClients(prev => prev.map(c =>
                    c._id === selectedClient._id
                        ? { ...c, activeTasks: (c.activeTasks || 0) + 1 }
                        : c
                ));

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
        if (!showEditTask) return;
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
                owner: showEditTask.owner,
                assignee: {
                    name: showEditTask.owner,
                    id: showEditTask.ownerId || showEditTask.assignee?.id
                },
                dueDate: showEditTask.dueDate,
                planForWeek: showEditTask.planForWeek || currentWeekNumber.toString(),
                ...(attachmentData && { attachment: attachmentData }),
            };

            const updatedTask = await upsertTask(taskPayload);
            if (updatedTask) {
                const oldTask = tasks.find(t => (t._id === updatedTask._id || t.id === updatedTask.id));
                if (oldTask) {
                    const wasActive = !['Completed', 'Cancelled'].includes(oldTask.status);
                    const isNowActive = !['Completed', 'Cancelled'].includes(updatedTask.status);

                    if (wasActive && !isNowActive) {
                        setClients(prev => prev.map(c =>
                            c._id === selectedClient._id
                                ? { ...c, activeTasks: Math.max(0, (c.activeTasks || 0) - 1) }
                                : c
                        ));
                    } else if (!wasActive && isNowActive) {
                        setClients(prev => prev.map(c =>
                            c._id === selectedClient._id
                                ? { ...c, activeTasks: (c.activeTasks || 0) + 1 }
                                : c
                        ));
                    }
                }

                setTasks(prev => prev.map(t => (t._id === updatedTask._id || t.id === updatedTask.id) ? updatedTask : t));
                setShowEditTask(null);
                setSelectedFile(null);
                toast.success("Task updated");
            } else {
                toast.error("Failed to update task");
            }
        } catch (error) {
            console.error(error);
            toast.error("An error occurred");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteTask = async (taskId) => {
        if (!confirm("Are you sure you want to delete this task?")) return;

        try {
            const taskToDelete = tasks.find(t => t._id === taskId || t.id === taskId);
            const res = await deleteTask(taskId);
            if (res.success) {
                if (taskToDelete) {
                    const wasActive = !['Completed', 'Cancelled'].includes(taskToDelete.status);
                    if (wasActive) {
                        setClients(prev => prev.map(c =>
                            c._id === selectedClient._id
                                ? { ...c, activeTasks: Math.max(0, (c.activeTasks || 0) - 1) }
                                : c
                        ));
                    }
                }
                setTasks(prev => prev.filter(t => t._id !== taskId && t.id !== taskId));
                toast.success("Task deleted");
            } else {
                toast.error(res.error || "Failed to delete task");
            }
        } catch (error) {
            console.error(error);
            toast.error("An error occurred");
        }
    };

    const handleAddNote = async () => {
        if (!newNote.trim()) return;
        try {
            const notePayload = {
                clientId: selectedClient._id,
                author: "Super Admin", // Uses generic name for Super Admin
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
        < html >
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
            </html >
    `);
        printWindow.document.close();
    };

    const handleSendMail = async () => {
        if (!mailSubject.trim() || !mailBody.trim()) {
            toast.error("Subject and message are required");
            return;
        }

        setIsSendingMail(true);
        try {
            const res = await sendClientEmail({
                to: selectedClient.email,
                subject: mailSubject,
                body: mailBody,
                fromAdmin: { name: 'Super Admin', email: 'admin@fakhriitservices.com' },
                includeDashboardButton: mailIncludeDashboard
            });

            if (res?.success) {
                toast.success("Email sent successfully");
                setShowMailForm(false);
                setMailSubject("");
                setMailBody("");
            } else {
                toast.error(res?.error || "Failed to send email");
            }
        } catch (error) {
            console.error(error);
            toast.error("An error occurred while sending email");
        } finally {
            setIsSendingMail(false);
        }
    };

    // Bulk mail handler
    const handleSendBulkMail = async () => {
        if (!bulkMailSubject.trim() || !bulkMailBody.trim()) {
            toast.error("Subject and body are required");
            return;
        }
        const selectedClients = clients.filter(c => selectedClientIds.includes(c._id));
        if (selectedClients.length === 0) {
            toast.error("No clients selected");
            return;
        }

        setIsSendingBulkMail(true);
        let successCount = 0;
        let failCount = 0;

        for (const client of selectedClients) {
            // Replace placeholders with individual client data
            const personalizedBody = bulkMailBody
                .replace(/\{name\}/gi, client.name || '')
                .replace(/\{company\}/gi, client.company || 'your company');
            const personalizedSubject = bulkMailSubject
                .replace(/\{name\}/gi, client.name || '')
                .replace(/\{company\}/gi, client.company || 'your company');

            try {
                const res = await sendClientEmail({
                    to: client.email,
                    subject: personalizedSubject,
                    body: personalizedBody,
                    fromAdmin: { name: 'Super Admin', email: 'admin@fakhriitservices.com' },
                    includeDashboardButton: bulkMailIncludeDashboard
                });
                if (res?.success) {
                    successCount++;
                } else {
                    failCount++;
                }
            } catch (err) {
                console.error(`Failed to send to ${client.email} `, err);
                failCount++;
            }
        }

        setIsSendingBulkMail(false);
        setShowBulkMail(false);
        setBulkMailSubject("");
        setBulkMailBody("");
        setSelectedClientIds([]);

        if (successCount > 0) toast.success(`Sent ${successCount} email(s) successfully`);
        if (failCount > 0) toast.error(`Failed to send ${failCount} email(s)`);
    };

    const handleUploadBulkOption = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsUploadingBulk(true);
        toast.info("Uploading and parsing file...");
        try {
            const xlsx = await import("xlsx");
            const reader = new FileReader();
            reader.onload = async (evt) => {
                try {
                    const data = evt.target.result;
                    const workbook = xlsx.read(data, { type: 'binary' });
                    const sheetName = workbook.SheetNames[0];
                    const sheet = workbook.Sheets[sheetName];
                    const parsed = xlsx.utils.sheet_to_json(sheet, { defval: "" });

                    // Helper: parse DD/MM/YYYY or other date formats into ISO string
                    const parseDate = (val) => {
                        if (!val) return '';
                        const str = String(val).trim();
                        // Handle DD/MM/YYYY format
                        const ddmmyyyy = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
                        if (ddmmyyyy) {
                            const [, day, month, year] = ddmmyyyy;
                            const d = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                            if (!isNaN(d.getTime())) return d.toISOString();
                        }
                        // Handle Excel serial date numbers
                        if (typeof val === 'number' && val > 40000 && val < 60000) {
                            const excelEpoch = new Date(1899, 11, 30);
                            const d = new Date(excelEpoch.getTime() + val * 86400000);
                            if (!isNaN(d.getTime())) return d.toISOString();
                        }
                        // Try native parsing as fallback
                        const d = new Date(str);
                        if (!isNaN(d.getTime())) return d.toISOString();
                        return str;
                    };

                    // Helper: format discount (0.2 → "20%", "20%" → "20%", etc.)
                    const parseDiscount = (val) => {
                        if (val === '' || val === null || val === undefined) return '';
                        if (typeof val === 'number') {
                            // Values like 0.2 mean 20%
                            return val < 1 ? `${Math.round(val * 100)}%` : `${val}%`;
                        }
                        return String(val).trim();
                    };

                    // Resolve team names to team IDs
                    const resolveTeamIds = (teamValue) => {
                        if (!teamValue) return [];
                        const teamNames = String(teamValue).split(',').map(t => t.trim()).filter(Boolean);
                        const resolvedIds = [];
                        for (const tName of teamNames) {
                            const matchedTeam = teams.find(t =>
                                t.name && t.name.toLowerCase() === tName.toLowerCase()
                            );
                            if (matchedTeam) resolvedIds.push(matchedTeam._id);
                        }
                        return resolvedIds;
                    };

                    const mappedClients = parsed.map(row => {
                        // Ensure phone & merchant token are always strings
                        const phone = row['Phone Number'] !== '' && row['Phone Number'] !== undefined
                            ? String(row['Phone Number']).trim() : '';
                        const merchantToken = row['Customer ID/Merchant Token'] !== '' && row['Customer ID/Merchant Token'] !== undefined
                            ? String(row['Customer ID/Merchant Token']).trim() : '';
                        const email = row['Email ID'] ? String(row['Email ID']).trim().toLowerCase() : '';

                        return {
                            manager: row['Admin Name'] || 'Unassigned',
                            teams: resolveTeamIds(row['Team']),
                            supervisor: row['Supervisor'] || '',
                            spCentralRequestId: row['SP Central Request ID'] || '',
                            company: row['Company Name'] || '',
                            name: row['Seller Name'] || row['Contact Name'] || 'Unknown Client',
                            email,
                            phone,
                            merchantToken,
                            stage: row['Stage'] || '',
                            marketplace: row['Marketplace'] || '',
                            userPermission: row['User Permission Access Name'] || row['User Permission Access Link'] || '',
                            accountAccessUrl: row['Merchant Account Access Link'] || '',
                            leadSource: row['Lead Source'] || '',
                            salesManager: row['Sales Manager'] || '',
                            plan: row['Plan'] || 'None',
                            supportType: row['Support SLA (TAT)'] || '',
                            launchWeek: row['Launch Week No.'] ? String(row['Launch Week No.']).trim() : '',
                            subscriptionStart: parseDate(row['Subscription Start Date']),
                            subscriptionEnd: parseDate(row['Subscription End Date']),
                            poeUrl: row['POE (Proof Of Engagement)'] || '',
                            discount: parseDiscount(row['Discount']),
                            status: 'active'
                        };
                    }).filter(c => c.email && c.email.trim() !== '');

                    if (mappedClients.length === 0) {
                        toast.error("No valid client rows found (email is required).");
                        setIsUploadingBulk(false);
                        return;
                    }

                    const validation = await validateBulkClientsData(mappedClients);
                    if (!validation.isValid) {
                        setBulkUploadState({
                            isOpen: true,
                            progress: 0,
                            total: mappedClients.length,
                            current: 0,
                            success: 0,
                            failed: mappedClients.length,
                            errors: validation.errors,
                            status: "completed"
                        });
                        setIsUploadingBulk(false);
                        if (e.target) e.target.value = null;
                        return;
                    }

                    setBulkUploadState({
                        isOpen: true,
                        progress: 0,
                        total: mappedClients.length,
                        current: 0,
                        success: 0,
                        failed: 0,
                        errors: [],
                        status: "uploading"
                    });

                    let successCount = 0;
                    let failedCount = 0;
                    let allErrors = [];

                    for (let i = 0; i < mappedClients.length; i++) {
                        const batch = [mappedClients[i]];
                        const res = await bulkUploadClients(batch);

                        if (res?.success > 0) successCount += res.success;
                        if (res?.failed > 0) failedCount += res.failed;
                        if (res?.errors?.length > 0) allErrors = [...allErrors, ...res.errors];

                        setBulkUploadState(prev => ({
                            ...prev,
                            current: i + 1,
                            progress: Math.round(((i + 1) / mappedClients.length) * 100),
                            success: successCount,
                            failed: failedCount,
                            errors: allErrors
                        }));
                    }

                    setBulkUploadState(prev => ({
                        ...prev,
                        status: "completed"
                    }));

                    if (successCount > 0) {
                        toast.success(`Successfully uploaded ${successCount} clients.`);
                        const clientsRes = await getUsers({ role: 'client', limit: 1000 });
                        if (clientsRes.users) setClients(clientsRes.users);
                    }
                    if (failedCount > 0) {
                        toast.error(`Failed to upload ${failedCount} clients.`);
                    }

                } catch (error) {
                    console.error("error processing excel:", error);
                    toast.error("Error processing file contents.");
                    setBulkUploadState(prev => ({ ...prev, isOpen: false }));
                }
                setIsUploadingBulk(false);
                if (e.target) e.target.value = null;
            };
            reader.readAsBinaryString(file);
        } catch (err) {
            console.error(err);
            toast.error("Error uploading file.");
            setIsUploadingBulk(false);
            if (e.target) e.target.value = null;
        }
    };

    const handleAddClient = async () => {
        // Validation for GST
        const gst = (newClientData.gstNo || "").trim().toUpperCase();
        if (gst && gst !== "NA" && gst.length !== 15) {
            toast.error("GST Number must be exactly 15 characters, or 'NA'");
            return;
        }

        const cName = String(newClientData.name || "Client");
        const firstTwo = cName.substring(0, 2).toUpperCase().padEnd(2, 'C');
        const cPhone = String(newClientData.phone || '0000');
        const lastFour = cPhone.length > 4 ? cPhone.slice(-4) : cPhone.padStart(4, '0');
        const generatedPassword = `${firstTwo}${lastFour}`;

        const clientPayload = {
            ...newClientData,
            password: generatedPassword,
            gstNo: gst || "NA",
            assignedAdminIds: [...new Set((newClientData.assignedAdminIds || []).map(id => id.toString()))]
        };

        try {
            const res = await upsertClient(clientPayload);
            if (res) {
                setClients([res, ...clients]);
                setShowAddClient(false);
                toast.success("Client added successfully");
                // Reset form
                setNewClientData({
                    name: "",
                    company: "",
                    email: "",
                    phone: "",
                    plan: "None",
                    manager: "Unassigned",
                    salesManager: "",
                    spCentralRequestId: "",
                    marketplace: "",
                    userPermission: "",
                    accountAccessUrl: "",
                    leadSource: "",
                    listingManager: "",
                    stage: "",
                    discount: "",
                    supportType: "",
                    subscriptionStart: "",
                    subscriptionEnd: "",
                    launchWeek: "",
                    poeUrl: "",
                    adsManager: "",
                    assignedAdminIds: []
                });
            } else {
                toast.error("Failed to add client");
            }
        } catch (error) {
            console.error(error);
            toast.error("An error occurred");
        }
    };

    const handleDeleteClient = async (e, client) => {
        e.stopPropagation();
        if (confirm(`Are you sure you want to delete ${client.name}? This action cannot be undone.`)) {
            setDeletingClientId(client._id);
            try {
                const res = await deleteClient(client._id);
                if (res) {
                    setClients(clients.filter(c => c._id !== client._id));
                    toast.success("Client deleted successfully!");
                    if (selectedClient?._id === client._id) {
                        setSelectedClient(null);
                    }
                } else {
                    toast.error("Failed to delete client");
                }
            } catch (err) {
                console.error("Delete error:", err);
                toast.error("An error occurred while deleting the client");
            } finally {
                setDeletingClientId(null);
            }
        }
    };

    const handleEditClick = () => {
        const teamAdmins = [];
        const clientTeams = selectedClient.teams || [];
        clientTeams.forEach(tId => {
            const team = teams.find(t => t._id === tId);
            if (team) {
                const members = [team.leadId, ...(team.memberIds || [])].filter(Boolean);
                members.forEach(m => {
                    const role = (m.adminRole || "").toLowerCase();
                    if (role.includes('poc') || role.includes('sales manager') || role.includes('ads manager') ||
                        (selectedClient.manager && m.name === selectedClient.manager) ||
                        (selectedClient.salesManager && m.name === selectedClient.salesManager) ||
                        (selectedClient.adsManager && m.name === selectedClient.adsManager)) {
                        if (!teamAdmins.includes(m._id || m.id)) teamAdmins.push((m._id || m.id).toString());
                    }
                });
            }
        });

        const mergedAdmins = [...new Set([
            ...(selectedClient.assignedAdminIds || []).map(id => id.toString()),
            ...teamAdmins
        ])];

        setEditClientData({
            ...selectedClient,
            teams: clientTeams,
            assignedAdminIds: mergedAdmins
        });
        setIsPlanEditable(false);
        setShowEditClient(true);
    };

    const handleSaveClient = async () => {
        // Validation for GST
        const gst = (editClientData.gstNo || "").trim().toUpperCase();
        if (gst && gst !== "NA" && gst.length !== 15) {
            toast.error("GST Number must be exactly 15 characters, or 'NA'");
            return;
        }

        try {
            const updatedClient = {
                ...selectedClient,
                ...editClientData,
                gstNo: gst || "NA",
                assignedAdminIds: [...new Set((editClientData.assignedAdminIds || []).map(id => id.toString()))]
            };
            const res = await upsertClient(updatedClient);
            if (res) {
                // Update local state
                setClients(prev => prev.map(c => c._id === res._id ? res : c));
                setSelectedClient(res);
                setShowEditClient(false);
                toast.success("Client updated successfully");
            } else {
                toast.error("Failed to update client");
            }
        } catch (error) {
            console.error(error);
            toast.error("An error occurred");
        }
    };

    const handleUpdatePOC = async (client, newPOC) => {
        try {
            const managerObj = managers.find(m => m.name === newPOC);
            const updatedClient = {
                ...client,
                manager: newPOC,
                managerId: managerObj ? (managerObj._id || managerObj.id) : null,
                // Do not modify assignedAdminIds here; let the explicit POC fields handle visibility
            };
            const res = await upsertClient(updatedClient);
            if (res) {
                // Update local state
                setClients(prev => prev.map(c => c._id === res._id ? res : c));
                toast.success(`POC updated for ${client.name}`);
            } else {
                toast.error("Failed to update POC");
            }
        } catch (error) {
            console.error(error);
            toast.error("An error occurred while updating POC");
        }
    };



    // Client List View
    if (!selectedClient) {
        if (loading) {
            return (
                <div className="h-64 flex flex-col items-center justify-center bg-card rounded-xl border">
                    <Loader2 className="h-8 w-8 text-primary animate-spin mb-2" />
                    <p className="text-muted-foreground">Fetching clients...</p>
                </div>
            );
        }

        return (
            <div className="space-y-6 flex flex-col h-[calc(100vh-95px)]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 flex-shrink-0">
                    <div>
                        <h1 className="font-heading text-2xl font-bold mb-2">Clients</h1>
                        <p className="text-muted-foreground">Manage all clients and their assignments.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Input
                            placeholder="Search clients..."
                            className="w-[200px] h-9"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {isSomeSelected && (
                            <>
                                <Button variant="outline" size="sm" onClick={() => setShowBulkMail(true)} className="border-primary text-primary hover:bg-primary/10 h-9">
                                    <Mail className="h-4 w-4 mr-2" />
                                    Bulk Mail ({selectedClientIds.length})
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => { setExtendDays(30); setShowExtendModal(true); }} className="border-emerald-500 text-emerald-600 hover:bg-emerald-50 h-9">
                                    <CalendarPlus className="h-4 w-4 mr-2" />
                                    Extend Sub. ({selectedClientIds.length})
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => { setBulkDeleteConfirmText(""); setShowBulkDeleteModal(true); }} className="border-destructive text-destructive hover:bg-destructive/10 h-9">
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete ({selectedClientIds.length})
                                </Button>
                            </>
                        )}
                        <Button size="sm" onClick={() => setShowAddClient(true)} className="h-9">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Client
                        </Button>
                    </div>
                </div>

                {/* Selected count info */}
                {isSomeSelected && (
                    <div className="flex items-center gap-3 text-sm bg-primary/5 border border-primary/20 rounded-lg px-4 py-2">
                        <Check className="h-4 w-4 text-primary" />
                        <span className="text-primary font-medium">{selectedClientIds.length} client(s) selected</span>
                        <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => setSelectedClientIds([])}>
                            Clear
                        </Button>
                    </div>
                )}

                {/* Clients Table - Scrollable with Sticky Header */}
                <div className="bg-card rounded-xl border shadow-2xl overflow-hidden flex-1 flex flex-col min-h-0">
                    <ScrollableContainer
                        className="flex-1 overflow-auto bg-card"
                        style={{ scrollbarWidth: 'thin' }}
                    >
                        <Table wrapperClassName="overflow-visible" style={{ minWidth: '1000px', width: '100%' }}>
                            <TableHeader className="sticky top-0 z-10 bg-card shadow-sm">
                                <TableRow className="border-b-2">
                                    <TableHead className="w-[50px]">
                                        <Checkbox
                                            checked={isAllSelected}
                                            onCheckedChange={handleSelectAll}
                                            aria-label="Select all"
                                        />
                                    </TableHead>
                                    <TableHead>
                                        <button onClick={() => handleSort('name')} className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition-colors text-xs whitespace-nowrap", sortConfig.key === 'name' ? "bg-primary/10 text-primary" : "hover:bg-muted text-muted-foreground hover:text-foreground")}>
                                            Client {getSortIcon('name')}
                                        </button>
                                    </TableHead>
                                    <TableHead>Merchant ID</TableHead>
                                    <TableHead>Stage</TableHead>
                                    <TableHead>
                                        <div className="flex items-center gap-1">
                                            <button onClick={() => handleSort('plan')} className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition-colors text-xs whitespace-nowrap", sortConfig.key === 'plan' ? "bg-primary/10 text-primary" : "hover:bg-muted text-muted-foreground hover:text-foreground")}>
                                                Plan {getSortIcon('plan')}
                                            </button>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button variant="ghost" size="icon" className={cn("h-7 w-7 p-0", planFilter !== "all" && "text-primary bg-primary/10")}>
                                                        <Filter className="h-3.5 w-3.5" />
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-40 p-0" align="start">
                                                    <div className="p-2 flex flex-col gap-1">
                                                        {['all', 'none', 'free', 'platinum', 'premium', 'elite'].map((plan) => (
                                                            <Button
                                                                key={plan}
                                                                variant="ghost"
                                                                size="sm"
                                                                className={cn("justify-start font-normal capitalize", planFilter === plan && "bg-accent text-accent-foreground")}
                                                                onClick={() => setPlanFilter(plan)}
                                                            >
                                                                {plan === 'all' ? 'All Plans' : plan}
                                                                {planFilter === plan && <Check className="h-4 w-4 ml-auto" />}
                                                            </Button>
                                                        ))}
                                                    </div>
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                    </TableHead>
                                    <TableHead>
                                        <button onClick={() => handleSort('subscriptionStart')} className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition-colors text-xs whitespace-nowrap", sortConfig.key === 'subscriptionStart' ? "bg-primary/10 text-primary" : "hover:bg-muted text-muted-foreground hover:text-foreground")}>
                                            Sub. Start {getSortIcon('subscriptionStart')}
                                        </button>
                                    </TableHead>
                                    <TableHead>
                                        <button onClick={() => handleSort('subscriptionEnd')} className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition-colors text-xs whitespace-nowrap", sortConfig.key === 'subscriptionEnd' ? "bg-primary/10 text-primary" : "hover:bg-muted text-muted-foreground hover:text-foreground")}>
                                            Sub. End {getSortIcon('subscriptionEnd')}
                                        </button>
                                    </TableHead>
                                    <TableHead>
                                        <div className="flex items-center gap-1">
                                            <span className="font-semibold text-xs whitespace-nowrap">Assigned POC</span>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button variant="ghost" size="icon" className={cn("h-7 w-7 p-0", managerFilter !== "all" && "text-primary bg-primary/10")}>
                                                        <Filter className="h-3.5 w-3.5" />
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-56 p-0" align="start">
                                                    <div className="p-2 border-b">
                                                        <Label className="text-[10px] uppercase font-bold text-muted-foreground px-2 py-1">Filter by Team</Label>
                                                        <Select value={teamFilter} onValueChange={setTeamFilter}>
                                                            <SelectTrigger className="w-full h-8 text-xs">
                                                                <SelectValue placeholder="Select Team" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="all">All Teams</SelectItem>
                                                                {teams.map((t) => (
                                                                    <SelectItem key={t._id} value={t._id}>{t.name}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <Command>
                                                        <div className="p-2 border-b">
                                                            <Label className="text-[10px] uppercase font-bold text-muted-foreground px-2 py-1">Filter by POC</Label>
                                                        </div>
                                                        <CommandInput placeholder="Filter POC..." />
                                                        <CommandList className="max-h-[250px]">
                                                            <CommandEmpty>No manager found.</CommandEmpty>
                                                            <CommandGroup>
                                                                <CommandItem
                                                                    onSelect={() => setManagerFilter("all")}
                                                                    className="flex items-center justify-between"
                                                                >
                                                                    <span>All Managers</span>
                                                                    {managerFilter === "all" && <Check className="h-4 w-4" />}
                                                                </CommandItem>
                                                                <CommandItem
                                                                    onSelect={() => setManagerFilter("unassigned")}
                                                                    className="flex items-center justify-between"
                                                                >
                                                                    <span>Unassigned</span>
                                                                    {managerFilter === "unassigned" && <Check className="h-4 w-4" />}
                                                                </CommandItem>
                                                                {managers.map((mgr) => (
                                                                    <CommandItem
                                                                        key={mgr.id}
                                                                        onSelect={() => setManagerFilter(mgr.name)}
                                                                        className="flex items-center justify-between"
                                                                    >
                                                                        <span className="capitalize">{mgr.name}</span>
                                                                        {managerFilter === mgr.name && <Check className="h-4 w-4" />}
                                                                    </CommandItem>
                                                                ))}
                                                            </CommandGroup>
                                                        </CommandList>
                                                    </Command>
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                    </TableHead>
                                    <TableHead>Active Tasks</TableHead>
                                    {/* <TableHead>
                                        <div className="flex items-center gap-1">
                                            <span className="font-semibold text-xs whitespace-nowrap">Status</span>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button variant="ghost" size="icon" className={cn("h-7 w-7 p-0", statusFilter !== "all" && "text-primary bg-primary/10")}>
                                                        <Filter className="h-3.5 w-3.5" />
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-40 p-0" align="start">
                                                    <div className="p-2 flex flex-col gap-1">
                                                        {['all', 'active', 'pending', 'disabled'].map((status) => (
                                                            <Button
                                                                key={status}
                                                                variant="ghost"
                                                                size="sm"
                                                                className={cn("justify-start font-normal capitalize", statusFilter === status && "bg-accent text-accent-foreground")}
                                                                onClick={() => setStatusFilter(status)}
                                                            >
                                                                {status === 'all' ? 'All Status' : status}
                                                                {statusFilter === status && <Check className="h-4 w-4 ml-auto" />}
                                                            </Button>
                                                        ))}
                                                    </div>
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                    </TableHead> */}
                                    <TableHead>
                                        <button onClick={() => handleSort('remainingDays')} className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition-colors text-xs whitespace-nowrap", sortConfig.key === 'remainingDays' ? "bg-primary/10 text-primary" : "hover:bg-muted text-muted-foreground hover:text-foreground")}>
                                            Remaining {getSortIcon('remainingDays')}
                                        </button>
                                    </TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedClients.length > 0 ? paginatedClients.map((client) => {
                                    const remainingDays = getRemainingDays(client);
                                    const isSelected = selectedClientIds.includes(client._id);
                                    return (
                                        <TableRow key={client._id} className={cn("cursor-pointer hover:bg-accent/50 transition-colors", isSelected && "bg-primary/5")} onClick={() => handleClientClick(client)}>
                                            <TableCell onClick={(e) => e.stopPropagation()}>
                                                <Checkbox
                                                    checked={isSelected}
                                                    onCheckedChange={() => handleSelectClient(client._id)}
                                                    aria-label={`Select ${client.name} `}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium uppercase shrink-0">
                                                        {client.name.split(' ').map(n => n[0]).join('')}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-medium capitalize truncate">{client.name}</p>
                                                        <p className="text-xs text-muted-foreground capitalize truncate">{client.company || "Personal"}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                <span className="truncate block max-w-[150px]">{client.merchantToken || 'N/A'}</span>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="text-[10px] whitespace-nowrap bg-muted/50">
                                                    {client.stage || 'N/A'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-1.5">
                                                    <Badge variant={client.plan === "Platinum" ? "default" : client.plan === "Premium" ? "secondary" : client.plan === "None" || !client.plan ? "destructive" : "outline"} className={`w - fit ${client.plan === "None" || !client.plan ? "bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-100" : client.plan === "Free" ? "bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100" : ""} `}>
                                                        {client.plan || "None"}
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
                                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                                    {client.subscriptionStart ? new Date(client.subscriptionStart).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                                                </span>
                                            </TableCell>
                                            <TableCell onClick={(e) => e.stopPropagation()}>
                                                <div className="flex items-center gap-1">
                                                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                                                        {client.subscriptionEnd ? new Date(client.subscriptionEnd).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                                                    </span>
                                                    {client.subscriptionStart && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-6 w-6 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setShowIndividualExtend(client);
                                                                setIndividualExtendDate(client.subscriptionEnd ? new Date(client.subscriptionEnd).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
                                                            }}
                                                            title="Extend subscription end date"
                                                        >
                                                            <CalendarPlus className="h-3.5 w-3.5" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell onClick={(e) => e.stopPropagation()}>
                                                <div className="w-[160px]">
                                                    <ManagerCombobox
                                                        value={client.manager || "Unassigned"}
                                                        onChange={(newPOC) => handleUpdatePOC(client, newPOC)}
                                                        managers={managers}
                                                        placeholder="Assign POC"
                                                        compact={true}
                                                    />
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="font-medium">{client.activeTasks || 0}</span>
                                            </TableCell>
                                            {/* <TableCell>
                                                <Badge
                                                    variant={client.status === "active" ? "default" : "outline"}
                                                    className={cn(
                                                        client.status === "active" ? "bg-green-500/10 text-green-600 border-green-500/20" :
                                                            client.status === "disabled" ? "bg-red-500/10 text-red-600 border-red-500/20" :
                                                                "bg-amber-500/10 text-amber-600 border-amber-500/20"
                                                    )}
                                                >
                                                    {client.status === "active" ? "Active" : client.status === "pending" ? "Pending" : "Disabled"}
                                                </Badge>
                                            </TableCell> */}
                                            <TableCell>
                                                {remainingDays !== null ? (
                                                    <div className={cn(
                                                        "flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-md w-fit whitespace-nowrap",
                                                        remainingDays <= 0
                                                            ? "bg-red-100 text-red-700"
                                                            : remainingDays <= 7
                                                                ? "bg-amber-100 text-amber-700"
                                                                : "bg-green-100 text-green-700"
                                                    )}>
                                                        <Clock className="h-3 w-3" />
                                                        {remainingDays <= 0 ? 'Expired' : `${remainingDays}d left`}
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">N/A</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-1">
                                                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleClientClick(client); }}>
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        disabled={deletingClientId === client._id}
                                                        onClick={(e) => handleDeleteClient(e, client)}
                                                        className="text-destructive hover:text-destructive"
                                                    >
                                                        {deletingClientId === client._id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                }) : (
                                    <TableRow>
                                        <TableCell colSpan={12} className="text-center py-6 text-muted-foreground">No clients found</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </ScrollableContainer>
                </div>

                <div className="flex-shrink-0">
                    <DataPagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                    />
                </div>

                {/* Bulk Mail Modal */}
                {
                    showBulkMail && (
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowBulkMail(false)}>
                            <div className="bg-card rounded-xl border shadow-2xl w-full max-w-2xl animate-in zoom-in-95 max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                                <div className="flex items-center justify-between p-6 pb-4 border-b">
                                    <div>
                                        <h3 className="font-heading font-semibold text-lg flex items-center gap-2">
                                            <Send className="h-5 w-5 text-primary" />
                                            Bulk Mail
                                        </h3>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            Sending to {selectedClientIds.length} selected client(s). Use <code className="bg-muted px-1 py-0.5 rounded text-xs">{'{name}'}</code> and <code className="bg-muted px-1 py-0.5 rounded text-xs">{'{company}'}</code> for personalization.
                                        </p>
                                    </div>
                                    <Button variant="ghost" size="sm" onClick={() => setShowBulkMail(false)}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                                <div className="p-6 space-y-4 flex-1 overflow-y-auto">
                                    {/* Recipients preview */}
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium">Recipients</Label>
                                        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 border rounded-lg bg-muted/30">
                                            {clients.filter(c => selectedClientIds.includes(c._id)).map(c => (
                                                <Badge key={c._id} variant="secondary" className="text-xs">
                                                    {c.name} ({c.email})
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium">Subject</Label>
                                        <Input
                                            placeholder="e.g. Important Update for {name} at {company}"
                                            value={bulkMailSubject}
                                            onChange={(e) => setBulkMailSubject(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between mb-1">
                                            <Label className="text-sm font-medium">Message Body</Label>
                                            <Badge variant="outline" className="text-[10px] bg-primary/5 text-primary border-primary/20">Rich Text Mode</Badge>
                                        </div>
                                        <div className="bg-background rounded-lg border overflow-hidden min-h-[350px] flex flex-col shadow-sm focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                                            <ReactQuill
                                                theme="snow"
                                                value={bulkMailBody}
                                                onChange={setBulkMailBody}
                                                placeholder={`Dear { name };\nWe are reaching out regarding your account at { company }.\n\nBest Regards, \nAdmin Team`}
                                                modules={{
                                                    toolbar: [
                                                        [{ 'header': [1, 2, 3, 4, 5, false] }],
                                                        [{ 'font': [] }],
                                                        [{ 'size': [] }],
                                                        ['bold', 'italic', 'underline', 'strike'],
                                                        [{ 'color': [] }, { 'background': [] }],
                                                        [{ 'script': 'sub' }, { 'script': 'super' }],
                                                        [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'indent': '-1' }, { 'indent': '+1' }],
                                                        [{ 'align': [] }],
                                                        ['blockquote', 'code-block'],
                                                        ['link', 'clean']
                                                    ],
                                                }}
                                                className="flex-1"
                                                style={{ height: '300px' }}
                                            />
                                        </div>
                                        <div className="flex items-center gap-2 mt-2 pt-2 border-t">
                                            <Checkbox
                                                id="bulk-dashboard-btn"
                                                checked={bulkMailIncludeDashboard}
                                                onCheckedChange={setBulkMailIncludeDashboard}
                                            />
                                            <Label htmlFor="bulk-dashboard-btn" className="text-xs text-muted-foreground cursor-pointer">
                                                Include "Go to Dashboard" button in each email
                                            </Label>
                                        </div>
                                        <p className="text-[11px] text-muted-foreground italic">Placeholders: {'{name}'} → Client Name, {'{company}'} → Client Company</p>
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2 p-6 pt-4 border-t">
                                    <Button variant="outline" onClick={() => setShowBulkMail(false)} disabled={isSendingBulkMail}>Cancel</Button>
                                    <Button onClick={handleSendBulkMail} disabled={isSendingBulkMail}>
                                        {isSendingBulkMail ? (
                                            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Sending...</>
                                        ) : (
                                            <><Send className="h-4 w-4 mr-2" /> Send to {selectedClientIds.length} Client(s)</>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )
                }

                {/* Add Client Modal (List View) */}
                {
                    showAddClient && (
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowAddClient(false)}>
                            <div className="bg-card rounded-xl border shadow-2xl w-full max-w-4xl animate-in zoom-in-95 h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                                <div className="flex items-center justify-between p-6 pb-2">
                                    <h3 className="font-heading font-semibold text-lg">Add New Client</h3>
                                    <Button variant="ghost" size="sm" onClick={() => setShowAddClient(false)}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                                <Tabs defaultValue="single" className="flex flex-col flex-1 overflow-hidden">
                                    <div className="px-6 pt-2 pb-0">
                                        <TabsList className="grid w-full max-w-[400px] grid-cols-2">
                                            <TabsTrigger value="single" type="button" onClick={e => e.stopPropagation()}>Single Client</TabsTrigger>
                                            <TabsTrigger value="bulk" type="button" onClick={e => e.stopPropagation()}>Bulk Upload</TabsTrigger>
                                        </TabsList>
                                    </div>
                                    <TabsContent value="single" className="flex-1 min-h-0 flex flex-col focus-visible:outline-none">
                                        <ScrollableContainer className="px-6 flex-1 py-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {/* Core Info */}
                                                <div className="bg-muted/30 p-5 rounded-2xl border border-border/50 space-y-5 flex flex-col shadow-sm">
                                                    <div className="flex items-center gap-2 border-b pb-3 text-primary">
                                                        <User className="h-5 w-5" />
                                                        <h4 className="font-semibold tracking-tight">Core Information</h4>
                                                    </div>
                                                    <div className="grid gap-2">
                                                        <label className="text-sm font-medium">Assigned POC</label>
                                                        <ManagerCombobox
                                                            value={newClientData.manager || "Unassigned"}
                                                            onChange={(val) => setNewClientData({ ...newClientData, manager: val })}
                                                            managers={managers}
                                                            placeholder="Select Manager"
                                                        />
                                                    </div>
                                                    <div className="grid gap-2">
                                                        <Label>Assigned Teams</Label>
                                                        <TeamCombobox
                                                            selectedTeams={newClientData.teams || []}
                                                            onChange={(val) => {
                                                                setNewClientData(prev => {
                                                                    const updated = { ...prev, teams: val };
                                                                    // Auto-select admins based on roles in teams
                                                                    let membersToRemove = new Set();
                                                                    (prev.teams || []).filter(t => !val.includes(t)).forEach(tId => {
                                                                        const team = teams.find(t => t._id === tId);
                                                                        if (team) [team.leadId, ...(team.memberIds || [])].filter(Boolean).forEach(m => membersToRemove.add((m._id || m.id).toString()));
                                                                    });
                                                                    val.forEach(tId => {
                                                                        const team = teams.find(t => t._id === tId);
                                                                        if (team) [team.leadId, ...(team.memberIds || [])].filter(Boolean).forEach(m => membersToRemove.delete((m._id || m.id).toString()));
                                                                    });
                                                                    membersToRemove.forEach(idStr => {
                                                                        const admin = managers.find(m => (m._id || m.id).toString() === idStr);
                                                                        if (admin && (admin.name === newClientData.manager || admin.name === newClientData.salesManager || admin.name === newClientData.adsManager)) membersToRemove.delete(idStr);
                                                                    });
                                                                    const currentAssigned = (prev.assignedAdminIds || []).filter(id => !membersToRemove.has(id.toString()));

                                                                    const teamAdmins = [];
                                                                    val.forEach(tId => {
                                                                        const team = teams.find(t => t._id === tId);
                                                                        if (team) {
                                                                            const members = [team.leadId, ...(team.memberIds || [])].filter(Boolean);
                                                                            members.forEach(m => {
                                                                                const role = (m.adminRole || "").toLowerCase();
                                                                                if (role.includes('poc') || role.includes('sales manager') || role.includes('ads manager') ||
                                                                                    (newClientData.manager && m.name === newClientData.manager) ||
                                                                                    (newClientData.salesManager && m.name === newClientData.salesManager) ||
                                                                                    (newClientData.adsManager && m.name === newClientData.adsManager)) {
                                                                                    if (!teamAdmins.includes((m._id || m.id).toString())) teamAdmins.push((m._id || m.id).toString());
                                                                                }
                                                                            });
                                                                        }
                                                                    });
                                                                    const mergedAdmins = [...new Set([...currentAssigned, ...teamAdmins])];
                                                                    return { ...updated, assignedAdminIds: mergedAdmins };
                                                                });
                                                            }}
                                                            teams={teams}
                                                            placeholder="Select Teams"
                                                        />
                                                        <TeamMemberVisibilitySelector
                                                            selectedTeams={newClientData.teams || []}
                                                            teams={teams}
                                                            assignedAdminIds={newClientData.assignedAdminIds || []}
                                                            setAssignedAdminIds={(ids) => setNewClientData(prev => ({ ...prev, assignedAdminIds: ids }))}
                                                            clientData={newClientData}
                                                        />
                                                    </div>
                                                    <div className="grid gap-2">
                                                        <Label>Additional Admins Visibility</Label>
                                                        <AdminMultiSelect
                                                            selectedAdmins={newClientData.assignedAdminIds || []}
                                                            onChange={(val) => setNewClientData({ ...newClientData, assignedAdminIds: val })}
                                                            admins={managers}
                                                            placeholder="Select additional team members"
                                                        />
                                                    </div>
                                                    <div className="grid gap-2">
                                                        <label className="text-sm font-medium">SP Central Request ID</label>
                                                        <Input value={newClientData.spCentralRequestId || ""} onChange={(e) => setNewClientData({ ...newClientData, spCentralRequestId: e.target.value })} />
                                                    </div>

                                                    <div className="grid gap-2">
                                                        <label className="text-sm font-medium">Company Name</label>
                                                        <Input value={newClientData.company || ""} onChange={(e) => setNewClientData({ ...newClientData, company: e.target.value })} placeholder="e.g. Tech Corp" />
                                                    </div>
                                                    <div className="grid gap-2">
                                                        <label className="text-sm font-medium">Seller Name</label>
                                                        <Input value={newClientData.name || ""} onChange={(e) => setNewClientData({ ...newClientData, name: e.target.value })} placeholder="e.g. John Doe" />
                                                    </div>

                                                    <div className="grid gap-2">
                                                        <label className="text-sm font-medium">Email Address</label>
                                                        <Input type="email" value={newClientData.email || ""} onChange={(e) => setNewClientData({ ...newClientData, email: e.target.value })} placeholder="john@example.com" />
                                                    </div>

                                                    <div className="grid gap-2">
                                                        <label className="text-sm font-medium">Phone Number</label>
                                                        <Input value={newClientData.phone || ""} onChange={(e) => setNewClientData({ ...newClientData, phone: e.target.value })} placeholder="+1 (555) 000-0000" />
                                                    </div>
                                                    <div className="grid gap-2">
                                                        <label className="text-sm font-medium">Customer ID/Merchant Token</label>
                                                        <Input value={newClientData.merchantToken || ""} onChange={(e) => setNewClientData({ ...newClientData, merchantToken: e.target.value })} />
                                                    </div>
                                                    <div className="grid gap-2">
                                                        <label className="text-sm font-medium">Stage</label>
                                                        <Select value={newClientData.stage} onValueChange={(v) => setNewClientData({ ...newClientData, stage: v })}>
                                                            <SelectTrigger>
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="None">None</SelectItem>
                                                                <SelectItem value="New Lead Assigned">New Lead Assigned</SelectItem>
                                                                <SelectItem value="Follow up in review">Follow up in review</SelectItem>
                                                                <SelectItem value="Support On Going">Support On Going</SelectItem>
                                                                <SelectItem value="Payment Request">Payment Request</SelectItem>
                                                                <SelectItem value="Optimization Needed">Optimization Needed</SelectItem>
                                                                <SelectItem value="Need Attention - High Priority">Need Attention - High Priority</SelectItem>
                                                                <SelectItem value="At Risk / Escalated">At Risk / Escalated</SelectItem>
                                                                <SelectItem value="Seller Account Suspended">Seller Account Suspended</SelectItem>
                                                                <SelectItem value="Subscription Ended">Subscription Ended</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="grid gap-2">
                                                        <label className="text-sm font-medium">Marketplace</label>
                                                        <Select value={newClientData.marketplace} onValueChange={(v) => setNewClientData({ ...newClientData, marketplace: v })}>
                                                            <SelectTrigger>
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="None">None</SelectItem>
                                                                <SelectItem value="Amazon.in">Amazon.in</SelectItem>
                                                                <SelectItem value="Amazon.com">Amazon.com</SelectItem>
                                                                <SelectItem value="Amazon.ae">Amazon.ae</SelectItem>
                                                                <SelectItem value="Amazon.sa">Amazon.sa</SelectItem>
                                                                <SelectItem value="Flipkart.com">Flipkart.com</SelectItem>
                                                                <SelectItem value="SmartCommerce">SmartCommerce</SelectItem>

                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="grid gap-2">
                                                        <label className="text-sm font-medium">User Permission Access Link</label>
                                                        <Input value={newClientData.userPermission || ""} onChange={(e) => setNewClientData({ ...newClientData, userPermission: e.target.value })} />
                                                    </div>

                                                    <div className="grid gap-2">
                                                        <label className="text-sm font-medium">Merchant Account Access Link</label>
                                                        <Input value={newClientData.merchantAccountAccessLink || ""} onChange={(e) => setNewClientData({ ...newClientData, merchantAccountAccessLink: e.target.value })} />
                                                    </div>
                                                </div>

                                                {/* Additional Details */}
                                                <div className="bg-muted/30 p-5 rounded-2xl border border-border/50 space-y-5 flex flex-col shadow-sm">
                                                    <div className="flex items-center gap-2 border-b pb-3 text-primary">
                                                        <Layers className="h-5 w-5" />
                                                        <h4 className="font-semibold tracking-tight">Additional Details</h4>
                                                    </div>

                                                    <div className="grid gap-2">
                                                        <label className="text-sm font-medium">Lead Source</label>
                                                        <Select value={newClientData.leadSource} onValueChange={(v) => setNewClientData({ ...newClientData, leadSource: v })}>
                                                            <SelectTrigger>
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="None">None</SelectItem>
                                                                <SelectItem value="CTRL">CTRL</SelectItem>
                                                                <SelectItem value="Reference">Reference</SelectItem>
                                                                <SelectItem value="Web Research">Web Research</SelectItem>
                                                                <SelectItem value="Web Download">Web Download</SelectItem>
                                                                <SelectItem value="Webinar">Webinar</SelectItem>
                                                                <SelectItem value="Telecalling">Telecalling</SelectItem>
                                                                <SelectItem value="Whatsapp chat">Whatsapp chat</SelectItem>
                                                                <SelectItem value="Instagram / meta">Instagram / meta</SelectItem>
                                                                <SelectItem value="Instagram / meta">Instagram / meta</SelectItem>

                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="grid gap-2">
                                                        <label className="text-sm font-medium">Sales Manager</label>
                                                        <ManagerCombobox
                                                            value={newClientData.salesManager}
                                                            onChange={(val) => setNewClientData({ ...newClientData, salesManager: val })}
                                                            managers={managers}
                                                            placeholder="Select Sales Manager"
                                                        />
                                                    </div>

                                                    <div className="grid gap-2">
                                                        <label className="text-sm font-medium">GST Number</label>
                                                        <Input
                                                            value={newClientData.gstNo || ""}
                                                            onChange={(e) => {
                                                                const val = e.target.value.toUpperCase();
                                                                if (val.length <= 15) {
                                                                    setNewClientData({ ...newClientData, gstNo: val });
                                                                }
                                                            }}
                                                            placeholder="22AAAAA0000A1Z5 or NA"
                                                        />
                                                        <p className="text-[10px] text-muted-foreground italic">Size 15 for GST, or "NA" for not available.</p>
                                                    </div>

                                                    <div className="grid gap-2">
                                                        <label className="text-sm font-medium">Plan</label>
                                                        <Select value={newClientData.plan} onValueChange={(v) => setNewClientData({ ...newClientData, plan: v })}>
                                                            <SelectTrigger>
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="None">None</SelectItem>
                                                                <SelectItem value="Free">Free</SelectItem>
                                                                <SelectItem value="Platinum">Platinum</SelectItem>
                                                                <SelectItem value="Premium">Premium</SelectItem>
                                                                <SelectItem value="Elite">Elite</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="grid gap-2">
                                                        <label className="text-sm font-medium">Support SLA (TAT)</label>
                                                        <Select value={newClientData.supportType} onValueChange={(v) => setNewClientData({ ...newClientData, supportType: v })}>
                                                            <SelectTrigger>
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="Free">2 hours</SelectItem>
                                                                <SelectItem value="Platinum">Next Day</SelectItem>
                                                                <SelectItem value="Premium">Same Day</SelectItem>
                                                                <SelectItem value="Elite">Custom</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="grid gap-2">
                                                        <label className="text-sm font-medium">Subscription start date</label>
                                                        <Input type="date" value={newClientData.subscriptionStart ? new Date(newClientData.subscriptionStart).toISOString().split('T')[0] : ""} onChange={(e) => setNewClientData({ ...newClientData, subscriptionStart: e.target.value })} />
                                                    </div>
                                                    <div className="grid gap-2">
                                                        <label className="text-sm font-medium">Subscription end date</label>
                                                        <Input type="date" value={newClientData.subscriptionEnd ? new Date(newClientData.subscriptionEnd).toISOString().split('T')[0] : ""} onChange={(e) => setNewClientData({ ...newClientData, subscriptionEnd: e.target.value })} />
                                                    </div>

                                                    <div className="grid gap-2">
                                                        <label className="text-sm font-medium">Launch week</label>
                                                        <Input value={newClientData.launchWeek} onChange={(e) => setNewClientData({ ...newClientData, launchWeek: e.target.value })} placeholder="e.g. Week 1" />
                                                    </div>
                                                    <div className="grid gap-2">
                                                        <label className="text-sm font-medium">POE (Proof OF Engagement)</label>
                                                        <Input value={newClientData.poeUrl} onChange={(e) => setNewClientData({ ...newClientData, poeUrl: e.target.value })} placeholder="e.g. https://..." />
                                                    </div>
                                                    <div className="grid gap-2">
                                                        <label className="text-sm font-medium">Ads Manager</label>
                                                        <ManagerCombobox
                                                            value={newClientData.adsManager}
                                                            onChange={(val) => setNewClientData({ ...newClientData, adsManager: val })}
                                                            managers={managers}
                                                            placeholder="Select Ads Manager"
                                                        />
                                                    </div>

                                                    {/*                                                
                                                <div className="grid gap-2">
                                                    <label className="text-sm font-medium">Account Access URL</label>
                                                    <Input value={newClientData.accountAccessUrl} onChange={(e) => setNewClientData({ ...newClientData, accountAccessUrl: e.target.value })} placeholder="https://..." />
                                                </div>
                                                <div className="grid gap-2">
                                                    <label className="text-sm font-medium">Lead Source</label>
                                                    <Input value={newClientData.leadSource} onChange={(e) => setNewClientData({ ...newClientData, leadSource: e.target.value })} />
                                                </div>
                                                <div className="grid gap-2">
                                                    <label className="text-sm font-medium">Listing Manager</label>
                                                    <ManagerCombobox
                                                        value={newClientData.listingManager}
                                                        onChange={(val) => setNewClientData({ ...newClientData, listingManager: val })}
                                                        managers={managers}
                                                        placeholder="Select Listing Manager"
                                                    />
                                                </div> */}
                                                </div>
                                            </div>
                                        </ScrollableContainer>
                                        <div className="flex justify-end gap-2 p-6 pt-2 border-t mt-auto">
                                            <Button variant="outline" type="button" onClick={() => setShowAddClient(false)}>Cancel</Button>
                                            <Button type="button" onClick={handleAddClient}>
                                                <Plus className="h-4 w-4 mr-1" />
                                                Add Client
                                            </Button>
                                        </div>
                                    </TabsContent>
                                    <TabsContent value="bulk" className="flex-1 p-6 flex flex-col justify-center focus-visible:outline-none">
                                        {!bulkUploadState.isOpen ? (
                                            <div className="border-2 border-dashed border-primary/20 bg-primary/5 rounded-xl p-12 flex flex-col items-center justify-center text-center max-w-2xl mx-auto w-full">
                                                <div className="p-4 bg-primary/10 text-primary rounded-full mb-6 relative">
                                                    {isUploadingBulk ? (
                                                        <Loader2 className="h-8 w-8 animate-spin" />
                                                    ) : (
                                                        <Layers className="h-8 w-8" />
                                                    )}
                                                </div>
                                                <h3 className="font-semibold text-lg mb-2 text-foreground">
                                                    {isUploadingBulk ? "Processing File..." : "Upload Bulk Clients"}
                                                </h3>
                                                <p className="text-sm text-muted-foreground mb-8 max-w-sm">
                                                    Select a highly populated template `.xlsx` list of incoming clients to auto-provision all users at once mapping correct properties.
                                                </p>
                                                <input
                                                    type="file"
                                                    accept=".xlsx, .xls"
                                                    id="inner-bulk-client-upload"
                                                    className="hidden"
                                                    onChange={(e) => {
                                                        handleUploadBulkOption(e);
                                                    }}
                                                />
                                                <Button
                                                    size="lg"
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        document.getElementById('inner-bulk-client-upload').click();
                                                    }}
                                                    disabled={isUploadingBulk}
                                                    className="w-full sm:w-auto shadow-md"
                                                >
                                                    {isUploadingBulk ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <Download className="h-5 w-5 mr-2" />}
                                                    Browse Excel file
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="border-2 border-primary/20 bg-primary/5 rounded-xl p-8 flex flex-col items-center justify-center max-w-2xl mx-auto w-full">
                                                <div className="text-center w-full">
                                                    <h2 className="text-2xl font-bold font-heading mb-2">
                                                        {bulkUploadState.status === "uploading" ? "Uploading Clients..." : "Bulk Upload Complete"}
                                                    </h2>
                                                    <p className="text-muted-foreground text-sm">
                                                        {bulkUploadState.status === "uploading"
                                                            ? `Processing ${bulkUploadState.current} of ${bulkUploadState.total} clients`
                                                            : `Finished processing ${bulkUploadState.total} clients`}
                                                    </p>
                                                </div>

                                                <div className="w-full space-y-2 mt-6">
                                                    <Progress value={bulkUploadState.progress} className="h-3" />
                                                    <div className="flex justify-between text-xs text-muted-foreground font-medium">
                                                        <span>{bulkUploadState.progress}%</span>
                                                        <span>
                                                            <span className="text-green-600 font-semibold">{bulkUploadState.success} Success</span>
                                                            {" • "}
                                                            <span className={bulkUploadState.failed > 0 ? "text-red-500 font-semibold" : "opacity-75"}>{bulkUploadState.failed} Failed</span>
                                                        </span>
                                                    </div>
                                                </div>

                                                {bulkUploadState.errors.length > 0 && (
                                                    <div className="w-full border rounded-lg bg-red-50/50 p-4 max-h-[250px] flex flex-col mt-6">
                                                        <h4 className="flex items-center gap-2 font-semibold text-red-700 text-sm mb-3 shrink-0">
                                                            <Info className="h-4 w-4" />
                                                            Exact Upload Errors
                                                        </h4>
                                                        <ScrollableContainer className="flex-1 pr-2">
                                                            <ul className="space-y-2">
                                                                {bulkUploadState.errors.map((err, idx) => (
                                                                    <li key={idx} className="text-xs text-red-600 bg-white/70 p-2 rounded border border-red-100/50 shadow-sm list-disc ml-4 break-words">
                                                                        {err}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </ScrollableContainer>
                                                    </div>
                                                )}

                                                {bulkUploadState.status === "completed" && (
                                                    <div className="flex gap-4 mt-8 w-full">
                                                        <Button
                                                            className="flex-1"
                                                            type="button"
                                                            variant="outline"
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                // Reset the state to show the upload button again
                                                                setBulkUploadState(prev => ({ ...prev, isOpen: false }));
                                                                const el = document.getElementById('inner-bulk-client-upload');
                                                                if (el) el.value = null;
                                                            }}
                                                        >
                                                            Upload Another File
                                                        </Button>
                                                        <Button
                                                            className="flex-1"
                                                            type="button"
                                                            variant={bulkUploadState.failed > 0 && bulkUploadState.success === 0 ? "destructive" : "default"}
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                setBulkUploadState(prev => ({ ...prev, isOpen: false }));
                                                                setShowAddClient(false);
                                                            }}
                                                        >
                                                            Close Window
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </TabsContent>
                                </Tabs>
                            </div >
                        </div >
                    )
                }

                {/* Bulk Extend Subscription Modal */}
                {showExtendModal && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowExtendModal(false)}>
                        <div className="bg-card rounded-xl border shadow-2xl w-full max-w-md animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-between p-6 pb-4 border-b">
                                <div>
                                    <h3 className="font-heading font-semibold text-lg flex items-center gap-2">
                                        <CalendarPlus className="h-5 w-5 text-emerald-600" />
                                        Extend Subscription
                                    </h3>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Extend subscription end date for {selectedClientIds.length} selected client(s)
                                    </p>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => setShowExtendModal(false)}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">Number of Days to Extend</Label>
                                    <Input
                                        type="number"
                                        min="1"
                                        max="365"
                                        value={extendDays}
                                        onChange={(e) => setExtendDays(parseInt(e.target.value) || 0)}
                                        placeholder="e.g. 30"
                                    />
                                    <p className="text-[11px] text-muted-foreground italic">
                                        Days will be added to each client&apos;s current subscription end date. If a client has no end date or is expired, extension starts from today.
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">Selected Clients</Label>
                                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 border rounded-lg bg-muted/30">
                                        {clients.filter(c => selectedClientIds.includes(c._id)).map(c => (
                                            <Badge key={c._id} variant="secondary" className="text-xs">
                                                {c.name}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                                    <p className="text-sm text-emerald-700 font-medium flex items-center gap-2">
                                        <Calendar className="h-4 w-4" />
                                        Preview: +{extendDays || 0} days will be added
                                    </p>
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 p-6 pt-4 border-t">
                                <Button variant="outline" onClick={() => setShowExtendModal(false)} disabled={isExtending}>Cancel</Button>
                                <Button
                                    className="bg-emerald-600 hover:bg-emerald-700"
                                    disabled={isExtending || !extendDays || extendDays <= 0}
                                    onClick={async () => {
                                        setIsExtending(true);
                                        try {
                                            const res = await bulkExtendSubscription(selectedClientIds, extendDays);
                                            if (res?.success) {
                                                toast.success(`Extended subscription for ${res.updated} client(s) by ${extendDays} days`);
                                                if (res.failed > 0) {
                                                    toast.error(`Failed for ${res.failed} client(s)`);
                                                }
                                                // Refresh client list
                                                const clientsRes = await getUsers({ role: 'client', limit: 1000 });
                                                if (clientsRes.users) setClients(clientsRes.users);
                                                setShowExtendModal(false);
                                                setSelectedClientIds([]);
                                            } else {
                                                toast.error(res?.error || "Failed to extend subscription");
                                            }
                                        } catch (err) {
                                            console.error(err);
                                            toast.error("An error occurred");
                                        } finally {
                                            setIsExtending(false);
                                        }
                                    }}
                                >
                                    {isExtending ? (
                                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Extending...</>
                                    ) : (
                                        <><CalendarPlus className="h-4 w-4 mr-2" /> Extend {selectedClientIds.length} Client(s)</>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Individual Extend Subscription Modal */}
                {showIndividualExtend && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowIndividualExtend(null)}>
                        <div className="bg-card rounded-xl border shadow-2xl w-full max-w-md animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-between p-6 pb-4 border-b">
                                <div>
                                    <h3 className="font-heading font-semibold text-lg flex items-center gap-2">
                                        <CalendarPlus className="h-5 w-5 text-emerald-600" />
                                        Extend Subscription
                                    </h3>
                                    <p className="text-sm text-muted-foreground mt-1 capitalize">
                                        For: <span className="font-medium text-foreground">{showIndividualExtend.name}</span>
                                        {showIndividualExtend.company && <span> ({showIndividualExtend.company})</span>}
                                    </p>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => setShowIndividualExtend(null)}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-muted/50 rounded-lg p-3">
                                        <Label className="text-xs text-muted-foreground">Current Start Date</Label>
                                        <p className="text-sm font-medium mt-1">
                                            {showIndividualExtend.subscriptionStart
                                                ? new Date(showIndividualExtend.subscriptionStart).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                                                : 'Not Set'}
                                        </p>
                                    </div>
                                    <div className="bg-muted/50 rounded-lg p-3">
                                        <Label className="text-xs text-muted-foreground">Current End Date</Label>
                                        <p className="text-sm font-medium mt-1">
                                            {showIndividualExtend.subscriptionEnd
                                                ? new Date(showIndividualExtend.subscriptionEnd).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                                                : 'Not Set'}
                                        </p>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">New Subscription End Date</Label>
                                    <Input
                                        type="date"
                                        value={individualExtendDate}
                                        onChange={(e) => setIndividualExtendDate(e.target.value)}
                                    />
                                </div>
                                {individualExtendDate && showIndividualExtend.subscriptionEnd && (
                                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                                        <p className="text-sm text-emerald-700 font-medium flex items-center gap-2">
                                            <Calendar className="h-4 w-4" />
                                            {(() => {
                                                const diff = Math.ceil((new Date(individualExtendDate) - new Date(showIndividualExtend.subscriptionEnd)) / (1000 * 60 * 60 * 24));
                                                return diff > 0 ? `+${diff} days from current end date` : diff === 0 ? 'Same as current end date' : `${diff} days (reducing)`;
                                            })()}
                                        </p>
                                    </div>
                                )}
                            </div>
                            <div className="flex justify-end gap-2 p-6 pt-4 border-t">
                                <Button variant="outline" onClick={() => setShowIndividualExtend(null)} disabled={isIndividualExtending}>Cancel</Button>
                                <Button
                                    className="bg-emerald-600 hover:bg-emerald-700"
                                    disabled={isIndividualExtending || !individualExtendDate}
                                    onClick={async () => {
                                        setIsIndividualExtending(true);
                                        try {
                                            const res = await updateClientSubscriptionEnd(showIndividualExtend._id, individualExtendDate);
                                            if (res?.success) {
                                                toast.success(`Subscription end date updated for ${showIndividualExtend.name}`);
                                                // Update local state
                                                setClients(prev => prev.map(c => c._id === showIndividualExtend._id ? { ...c, subscriptionEnd: individualExtendDate } : c));
                                                setShowIndividualExtend(null);
                                            } else {
                                                toast.error(res?.error || "Failed to update end date");
                                            }
                                        } catch (err) {
                                            console.error(err);
                                            toast.error("An error occurred");
                                        } finally {
                                            setIsIndividualExtending(false);
                                        }
                                    }}
                                >
                                    {isIndividualExtending ? (
                                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</>
                                    ) : (
                                        <><Save className="h-4 w-4 mr-2" /> Save End Date</>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Bulk Delete Confirmation Modal */}
                {showBulkDeleteModal && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowBulkDeleteModal(false)}>
                        <div className="bg-card rounded-xl border shadow-2xl w-full max-w-lg animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-between p-6 pb-4 border-b">
                                <div>
                                    <h3 className="font-heading font-semibold text-lg flex items-center gap-2 text-destructive">
                                        <AlertTriangle className="h-5 w-5" />
                                        Delete Selected Clients
                                    </h3>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        You are about to permanently delete {selectedClientIds.length} client(s)
                                    </p>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => setShowBulkDeleteModal(false)}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                            <div className="p-6 space-y-4">
                                {/* Warning Banner */}
                                <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
                                    <div className="flex items-start gap-3">
                                        <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
                                        <div className="space-y-1">
                                            <p className="text-sm font-semibold text-destructive">This action is irreversible!</p>
                                            <p className="text-xs text-destructive/80">
                                                All selected client accounts, their associated data references, and admin assignments will be permanently removed from the system. This cannot be undone.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Selected clients list */}
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">Clients to be deleted</Label>
                                    <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-3 border rounded-lg bg-muted/30" style={{ scrollbarWidth: 'thin' }}>
                                        {clients.filter(c => selectedClientIds.includes(c._id)).map(c => (
                                            <Badge key={c._id} variant="outline" className="text-xs border-destructive/30 text-destructive bg-destructive/5">
                                                <Trash2 className="h-3 w-3 mr-1 opacity-60" />
                                                {c.name} {c.company ? `(${c.company})` : ''}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>

                                {/* Typed confirmation */}
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">
                                        Type <span className="font-mono bg-destructive/10 text-destructive px-1.5 py-0.5 rounded text-xs">DELETE</span> to confirm
                                    </Label>
                                    <Input
                                        placeholder="Type DELETE here..."
                                        value={bulkDeleteConfirmText}
                                        onChange={(e) => setBulkDeleteConfirmText(e.target.value)}
                                        className="border-destructive/30 focus-visible:ring-destructive/30"
                                        autoComplete="off"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 p-6 pt-4 border-t">
                                <Button variant="outline" onClick={() => setShowBulkDeleteModal(false)} disabled={isBulkDeleting}>Cancel</Button>
                                <Button
                                    variant="destructive"
                                    disabled={isBulkDeleting || bulkDeleteConfirmText !== 'DELETE'}
                                    onClick={async () => {
                                        setIsBulkDeleting(true);
                                        try {
                                            const res = await bulkDeleteClients(selectedClientIds);
                                            if (res?.success) {
                                                toast.success(`Successfully deleted ${res.deleted} client(s)`);
                                                if (res.failed > 0) {
                                                    toast.error(`Failed to delete ${res.failed} client(s)`);
                                                }
                                                // Remove deleted clients from local state
                                                setClients(prev => prev.filter(c => !selectedClientIds.includes(c._id)));
                                                // Clear selection & close modal
                                                setSelectedClientIds([]);
                                                setShowBulkDeleteModal(false);
                                                setBulkDeleteConfirmText("");
                                                // If currently viewing a deleted client, go back to list
                                                if (selectedClient && selectedClientIds.includes(selectedClient._id)) {
                                                    setSelectedClient(null);
                                                }
                                            } else {
                                                toast.error(res?.error || "Failed to delete clients");
                                            }
                                        } catch (err) {
                                            console.error(err);
                                            toast.error("An error occurred while deleting clients");
                                        } finally {
                                            setIsBulkDeleting(false);
                                        }
                                    }}
                                >
                                    {isBulkDeleting ? (
                                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Deleting...</>
                                    ) : (
                                        <><Trash2 className="h-4 w-4 mr-2" /> Delete {selectedClientIds.length} Client(s)</>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

            </div >
        );
    }

    const handleViewChange = (view) => {
        setActiveView(view);
        setDetailsSearchQuery("");
        setTasksPage(1);
        setNotesPage(1);
        setInvoicesPage(1);
        setServicesPage(1);
    };

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
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-heading font-bold text-xs uppercase shrink-0">
                            {selectedClient.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div className="min-w-0">
                            <h1 className="font-heading text-base font-bold capitalize truncate leading-tight">{selectedClient.name}</h1>
                            <p className="text-[10px] text-muted-foreground truncate leading-tight">{selectedClient.company || selectedClient.email}</p>
                        </div>
                    </div>

                    {/* Search */}
                    <div className="flex-1 max-w-xs mx-2 relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input
                            placeholder={`Search ${activeView}...`}
                            value={detailsSearchQuery}
                            onChange={e => setDetailsSearchQuery(e.target.value)}
                            className="bg-muted/50 w-full h-8 pl-8 pr-8 text-sm rounded-full border-none focus-visible:ring-1"
                        />
                        {detailsSearchQuery && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full"
                                onClick={() => setDetailsSearchQuery("")}
                            >
                                <X className="h-3 w-3" />
                            </Button>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-1.5 shrink-0">
                        <Button variant="outline" size="sm" className="h-8 px-3" onClick={handleEditClick}>
                            <UserCog className="h-3.5 w-3.5 mr-1" />
                            Edit
                        </Button>
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
                        { key: "notes", label: "Notes", icon: StickyNote, count: clientNotes.length },
                        { key: "invoices", label: "Invoices", icon: Receipt, count: filteredInvoices.length },
                        { key: "services", label: "Services", icon: Layers, count: filteredServices.length },
                    ].map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => handleViewChange(tab.key)}
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
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 shrink-0">
                                <div className="flex flex-wrap gap-1.5">
                                    <Select value={taskStatusFilter} onValueChange={setTaskStatusFilter}>
                                        <SelectTrigger className="w-[130px]">
                                            <SelectValue placeholder="Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Status</SelectItem>
                                            <SelectItem value="pending">Pending</SelectItem>
                                            <SelectItem value="in-progress">In Progress</SelectItem>
                                            <SelectItem value="under-review">Under Review</SelectItem>
                                            <SelectItem value="completed">Completed</SelectItem>
                                            <SelectItem value="cancelled">Cancelled</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                                        <SelectTrigger className="w-[120px] h-8 text-[11px]">
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
                                        <SelectTrigger className="w-[140px] h-8 text-[11px]">
                                            <SelectValue placeholder="Manager" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Managers</SelectItem>
                                            {managers.map(m => (
                                                <SelectItem key={m._id || m.id} value={m.name}>{m.name}</SelectItem>
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
                            <div className="bg-card rounded-xl border overflow-hidden flex flex-col flex-1 min-h-0">
                                <div className="flex-1 overflow-y-auto min-h-0">
                                    <Table>
                                        <TableHeader className="sticky top-0 bg-muted z-10">
                                            <TableRow>
                                                <TableHead>Task</TableHead>
                                                <TableHead>Assignee</TableHead>
                                                <TableHead>Priority</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Due Date</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {paginatedClientTasks.length > 0 ? paginatedClientTasks.map((task) => (
                                                <TableRow key={task._id}>
                                                    <TableCell>
                                                        <div>
                                                            <p className="font-medium capitalize">{task.title}</p>
                                                            <p className="text-xs text-muted-foreground capitalize">{task.category || task.service || "General"}</p>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-muted-foreground capitalize">{task.assignee?.name || task.owner || "Unassigned"}</TableCell>
                                                    <TableCell>
                                                        <Badge variant={(task.priority === "High" || task.priority === "Urgent") ? "destructive" : task.priority === "Medium" ? "secondary" : "outline"}>
                                                            {task.priority || "Medium"}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Select
                                                            defaultValue={task.status}
                                                            onValueChange={async (v) => {
                                                                try {
                                                                    const oldStatus = task.status;
                                                                    await upsertTask({ id: task._id || task.id, status: v });

                                                                    setTasks(prev => prev.map(t => (t._id === task._id) ? { ...t, status: v } : t));

                                                                    const wasActive = !['Completed', 'Cancelled'].includes(oldStatus);
                                                                    const isNowActive = !['Completed', 'Cancelled'].includes(v);

                                                                    if (wasActive && !isNowActive) {
                                                                        setClients(prev => prev.map(c =>
                                                                            (c._id === selectedClient._id || c.id === (selectedClient._id || selectedClient.id))
                                                                                ? { ...c, activeTasks: Math.max(0, (c.activeTasks || 0) - 1) }
                                                                                : c
                                                                        ));
                                                                    } else if (!wasActive && isNowActive) {
                                                                        setClients(prev => prev.map(c =>
                                                                            (c._id === selectedClient._id || c.id === (selectedClient._id || selectedClient.id))
                                                                                ? { ...c, activeTasks: (c.activeTasks || 0) + 1 }
                                                                                : c
                                                                        ));
                                                                    }

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
                                                                    isHighPriority: task.priority === 'High',
                                                                    isCompleted: task.status === 'completed' || task.status === 'Completed',
                                                                    planForWeek: task.planForWeek || currentWeekNumber.toString(),
                                                                    ownerId: task.assignee?.id || ""
                                                                };
                                                                setShowEditTask(normalizedTask);
                                                            }}>
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                                onClick={() => handleDeleteTask(task._id || task.id)}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            )) : (
                                                <TableRow>
                                                    <TableCell colSpan={6} className="text-center py-10">
                                                        <CheckSquare className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
                                                        <p className="text-sm text-muted-foreground">
                                                            {detailsSearchQuery ? "No tasks match your search" : "No tasks found for this client"}
                                                        </p>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                                {clientTasks.length > detailsItemsPerPage && (
                                    <div className="p-4 border-t shrink-0">
                                        <DataPagination
                                            currentPage={tasksPage}
                                            totalPages={Math.ceil(clientTasks.length / detailsItemsPerPage)}
                                            onPageChange={setTasksPage}
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
                                <div className="bg-card rounded-xl border shadow-2xl p-4 animate-in slide-in-from-top-2 shrink-0">
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
                            <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
                                <div className="flex-1 overflow-y-auto min-h-0 space-y-3 pr-1">
                                    {paginatedClientNotes.length > 0 ? paginatedClientNotes.map((note) => (
                                        <div key={note._id} className="bg-card rounded-xl border p-4 hover:shadow-md transition-shadow duration-200">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[10px] font-bold uppercase">
                                                        {note.author.split(' ').map(n => n[0]).join('')}
                                                    </div>
                                                    <span className="font-medium text-sm capitalize">{note.author}</span>
                                                </div>
                                                <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{note.date}</span>
                                            </div>
                                            <p className="text-sm text-muted-foreground leading-relaxed ml-9">{note.content}</p>
                                        </div>
                                    )) : (
                                        <div className="flex flex-col items-center justify-center py-12 text-center">
                                            <StickyNote className="h-10 w-10 text-muted-foreground/20 mb-3" />
                                            <p className="text-sm font-medium text-muted-foreground">
                                                {detailsSearchQuery ? "No notes match your search" : "No notes yet"}
                                            </p>
                                            <p className="text-xs text-muted-foreground/60 mt-1">
                                                {detailsSearchQuery ? "Try a different search term" : "Add the first note for this client"}
                                            </p>
                                        </div>
                                    )}
                                </div>
                                {clientNotes.length > detailsItemsPerPage && (
                                    <div className="pt-4 shrink-0">
                                        <DataPagination
                                            currentPage={notesPage}
                                            totalPages={Math.ceil(clientNotes.length / detailsItemsPerPage)}
                                            onPageChange={setNotesPage}
                                        />
                                    </div>
                                )}
                            </div>
                        </>
                    ) : activeView === "invoices" ? (
                        <div className="bg-card rounded-xl border flex flex-col flex-1 min-h-0 overflow-hidden">
                            <div className="flex items-center justify-between p-4 pb-3 shrink-0">
                                <div className="flex items-center gap-2">
                                    <Receipt className="h-4 w-4 text-primary" />
                                    <h3 className="font-heading font-semibold text-sm">Client Invoices</h3>
                                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                                        {filteredInvoices.length} {filteredInvoices.length === 1 ? 'invoice' : 'invoices'}
                                    </span>
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto min-h-0 px-6">
                                <div className="border rounded-lg overflow-hidden">
                                    <Table>
                                        <TableHeader className="sticky top-0 bg-muted z-10">
                                            <TableRow className="bg-muted/50">
                                                <TableHead className="w-[100px]">Invoice #</TableHead>
                                                <TableHead>Date</TableHead>
                                                <TableHead>Service</TableHead>
                                                <TableHead>Amount</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {paginatedInvoices.length > 0 ? paginatedInvoices.map((inv) => (
                                                <TableRow key={inv._id}>
                                                    <TableCell className="font-medium">{inv.invoiceNumber}</TableCell>
                                                    <TableCell>{inv.date}</TableCell>
                                                    <TableCell>{inv.items?.[0]?.description || "Service Plan"}</TableCell>
                                                    <TableCell>₹{parseFloat(String(inv.amount).replace(/[^0-9.]/g, '') || 0).toLocaleString()}</TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleDownload(inv)}
                                                            >
                                                                <Download className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            )) : (
                                                <TableRow>
                                                    <TableCell colSpan={5} className="text-center py-10">
                                                        <Receipt className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
                                                        <p className="text-sm text-muted-foreground">
                                                            {detailsSearchQuery ? "No invoices match your search" : "No invoice history found"}
                                                        </p>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                            {filteredInvoices.length > detailsItemsPerPage && (
                                <div className="p-4 border-t shrink-0">
                                    <DataPagination
                                        currentPage={invoicesPage}
                                        totalPages={Math.ceil(filteredInvoices.length / detailsItemsPerPage)}
                                        onPageChange={setInvoicesPage}
                                    />
                                </div>
                            )}
                        </div>
                    ) : activeView === "services" && (
                        <div className="bg-card rounded-xl border flex flex-col flex-1 min-h-0 overflow-hidden">
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
                                    <div className="flex flex-col items-center justify-center py-12 text-center">
                                        <Layers className="h-10 w-10 text-muted-foreground/20 mb-3" />
                                        <p className="text-sm font-medium text-muted-foreground">
                                            {detailsSearchQuery ? "No services match your search" : "No add-on services subscribed yet"}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="grid gap-3">
                                        {paginatedServices.map((service) => (
                                            <div key={service._id || service.serviceId} className="p-4 bg-accent/30 rounded-xl border flex items-center justify-between">
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
                                                                toast.success(`Service status updated to ${newStatus} `);
                                                                setSelectedClient(res);
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
                            {filteredServices.length > detailsItemsPerPage && (
                                <div className="p-4 border-t shrink-0">
                                    <DataPagination
                                        currentPage={servicesPage}
                                        totalPages={Math.ceil(filteredServices.length / detailsItemsPerPage)}
                                        onPageChange={setServicesPage}
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Right Side - Client Info Card */}
                <div className="space-y-3 overflow-y-auto min-h-0 pr-1">
                    {/* Client Overview Card */}
                    <div className="bg-card rounded-xl border p-4">
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
                                        {selectedClient.status === "active" ? "Active" : selectedClient.status === "pending" ? "Pending" : "Disabled"}
                                    </Badge>
                                    <Badge variant={selectedClient.plan === "Platinum" ? "default" : selectedClient.plan === "Premium" ? "secondary" : "outline"}
                                        className={`text-[10px] ${selectedClient.plan === "Free" ? "bg-emerald-100 text-emerald-700 border-emerald-200" : selectedClient.plan === "None" || !selectedClient.plan ? "bg-gray-100 text-gray-500 border-gray-200" : ""}`}>
                                        {selectedClient.plan || "None"} Plan
                                    </Badge>
                                </div>
                            </div>
                        </div>

                        {/* Remaining Days Indicator */}
                        {(() => {
                            const remaining = getRemainingDays(selectedClient);
                            if (remaining === null) return null;
                            return (
                                <div className={cn(
                                    "flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg mb-3",
                                    remaining <= 0
                                        ? "bg-red-100 text-red-700 border border-red-200"
                                        : remaining <= 7
                                            ? "bg-amber-100 text-amber-700 border border-amber-200"
                                            : "bg-green-100 text-green-700 border border-green-200"
                                )}>
                                    <Clock className="h-4 w-4" />
                                    {remaining <= 0 ? 'Subscription Expired' : `${remaining} days remaining`}
                                </div>
                            );
                        })()}

                        {/* Contact Info */}
                        <div className="space-y-2">
                            <h4 className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Contact</h4>
                            <a href={`mailto:${selectedClient.email}`} className="flex items-center gap-2 text-xs hover:text-primary transition-colors">
                                <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                <span className="truncate">{selectedClient.email}</span>
                            </a>
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
                            <div className="font-medium flex items-center gap-1">
                                {selectedClient.subscriptionEnd
                                    ? new Date(selectedClient.subscriptionEnd).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                                    : '-'}
                                {selectedClient.subscriptionStart && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-5 w-5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                        onClick={() => {
                                            setShowIndividualExtend(selectedClient);
                                            setIndividualExtendDate(selectedClient.subscriptionEnd ? new Date(selectedClient.subscriptionEnd).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
                                        }}
                                        title="Extend end date"
                                    >
                                        <CalendarPlus className="h-3 w-3" />
                                    </Button>
                                )}
                            </div>

                            <div className="text-muted-foreground">Discount:</div>
                            <div className="font-medium">{selectedClient.discount || "-"}</div>

                            <div className="text-muted-foreground">Launch Week:</div>
                            <div className="font-medium">{selectedClient.launchWeek || "-"}</div>

                            <div className="text-muted-foreground">Joined Date:</div>
                            <div className="font-medium">
                                {selectedClient.joinedDate
                                    ? new Date(selectedClient.joinedDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                                    : '-'}
                            </div>
                        </div>
                    </div>
                    {/* Task Summary */}
                    <div className="bg-card rounded-xl border p-4">
                        <h4 className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider mb-2">Task Summary</h4>
                        <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="p-2 bg-yellow-500/10 rounded-lg">
                                <p className="text-lg font-bold text-yellow-600">
                                    {tasks.filter(t => t.status === "in-progress" || t.status === "In Progress").length}
                                </p>
                                <p className="text-[10px] text-muted-foreground">In Progress</p>
                            </div>
                            <div className="p-2 bg-gray-500/10 rounded-lg">
                                <p className="text-lg font-bold text-gray-600">
                                    {tasks.filter(t => t.status === "pending" || t.status === "Pending" || t.status === "Under Review").length}
                                </p>
                                <p className="text-[10px] text-muted-foreground">Pending</p>
                            </div>
                            <div className="p-2 bg-green-500/10 rounded-lg">
                                <p className="text-lg font-bold text-green-600">
                                    {tasks.filter(t => t.status === "completed" || t.status === "Completed").length}
                                </p>
                                <p className="text-[10px] text-muted-foreground">Completed</p>
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

                            <div className="text-muted-foreground">Teams:</div>
                            <div className="font-medium">
                                {selectedClient.teams && selectedClient.teams.length > 0 ? (
                                    <div className="flex flex-wrap gap-1">
                                        {selectedClient.teams.map((t, idx) => {
                                            const teamObj = typeof t === 'object' ? t : teams.find(tm => tm._id === t);
                                            return (
                                                <Badge key={idx} variant="secondary" className="text-[10px]">
                                                    {teamObj?.name || t}
                                                </Badge>
                                            );
                                        })}
                                    </div>
                                ) : "-"}
                            </div>
                        </div>
                    </div>

                    {/* Account Details */}
                    <div className="bg-card rounded-xl border shadow-2xl p-6">
                        <h4 className="text-xs font-bold uppercase text-muted-foreground tracking-wider mb-3">Account Details</h4>
                        <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-sm">
                            <div className="text-muted-foreground">Customer ID/Token:</div>
                            <div className="font-medium font-mono text-xs truncate">{selectedClient.merchantToken || "-"}</div>

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
                            <div className="font-medium font-mono text-xs">{selectedClient.gstNo || "-"}</div>

                            <div className="text-muted-foreground">User Permission:</div>
                            <div className="font-medium truncate">
                                {selectedClient.userPermission ? (
                                    selectedClient.userPermission.startsWith('http') || selectedClient.userPermission.includes('.com') || selectedClient.userPermission.includes('.in') ? (
                                        <a href={selectedClient.userPermission.startsWith('http') ? selectedClient.userPermission : `https://${selectedClient.userPermission}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Link ↗</a>
                                    ) : selectedClient.userPermission
                                ) : "-"}
                            </div>

                            <div className="text-muted-foreground">Account Access:</div>
                            <div className="font-medium truncate">
                                {selectedClient.accountAccessUrl ? (
                                    <a href={selectedClient.accountAccessUrl.startsWith('http') ? selectedClient.accountAccessUrl : `https://${selectedClient.accountAccessUrl}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Link ↗</a>
                                ) : "-"}
                            </div>

                            <div className="text-muted-foreground">POE:</div>
                            <div className="font-medium truncate">
                                {selectedClient.poeUrl ? (
                                    <a href={selectedClient.poeUrl.startsWith('http') ? selectedClient.poeUrl : `https://${selectedClient.poeUrl}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Link ↗</a>
                                ) : "-"}
                            </div>
                        </div>
                    </div>

                    {/* Location Info */}
                    {(selectedClient.address || selectedClient.city || selectedClient.state || selectedClient.location) && (
                        <div className="bg-card rounded-xl border shadow-2xl p-6">
                            <h4 className="text-xs font-bold uppercase text-muted-foreground tracking-wider mb-3">Location</h4>
                            <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-sm">
                                {selectedClient.location && (
                                    <>
                                        <div className="text-muted-foreground">Location:</div>
                                        <div className="font-medium">{selectedClient.location}</div>
                                    </>
                                )}
                                {selectedClient.address && (
                                    <>
                                        <div className="text-muted-foreground">Address:</div>
                                        <div className="font-medium">{selectedClient.address}</div>
                                    </>
                                )}
                                {selectedClient.city && (
                                    <>
                                        <div className="text-muted-foreground">City:</div>
                                        <div className="font-medium">{selectedClient.city}</div>
                                    </>
                                )}
                                {selectedClient.state && (
                                    <>
                                        <div className="text-muted-foreground">State:</div>
                                        <div className="font-medium">{selectedClient.state}</div>
                                    </>
                                )}
                                {selectedClient.pincode && (
                                    <>
                                        <div className="text-muted-foreground">Pincode:</div>
                                        <div className="font-medium">{selectedClient.pincode}</div>
                                    </>
                                )}
                                {selectedClient.country && (
                                    <>
                                        <div className="text-muted-foreground">Country:</div>
                                        <div className="font-medium">{selectedClient.country}</div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Credentials (Super-Admin Only) */}
                    {/* {selectedClient.plainPassword && (
                        <div className="bg-card rounded-xl border shadow-2xl p-6">
                            <h4 className="text-xs font-bold uppercase text-muted-foreground tracking-wider mb-3">Credentials</h4>
                            <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-sm">
                                <div className="text-muted-foreground">Email:</div>
                                <div className="font-medium font-mono text-xs truncate">{selectedClient.email}</div>

                                <div className="text-muted-foreground">Password:</div>
                                <div className="font-medium font-mono text-xs flex items-center gap-1">
                                    <span>{selectedClient.plainPassword}</span>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-5 w-5"
                                        onClick={() => {
                                            navigator.clipboard.writeText(selectedClient.plainPassword);
                                            toast.success("Password copied!");
                                        }}
                                        title="Copy password"
                                    >
                                        <Copy className="h-3 w-3" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )} */}



                    {/* System Info */}
                    <div className="bg-card rounded-xl border shadow-2xl p-6">
                        <h4 className="text-xs font-bold uppercase text-muted-foreground tracking-wider mb-3">System Info</h4>
                        <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-sm">
                            <div className="text-muted-foreground">Client ID:</div>
                            <div className="font-medium font-mono text-[10px] truncate">{selectedClient._id}</div>

                            <div className="text-muted-foreground">Created At:</div>
                            <div className="font-medium text-xs">
                                {selectedClient.createdAt
                                    ? new Date(selectedClient.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                                    : '-'}
                            </div>

                            <div className="text-muted-foreground">Updated At:</div>
                            <div className="font-medium text-xs">
                                {selectedClient.updatedAt
                                    ? new Date(selectedClient.updatedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                                    : '-'}
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    {/* <div className="bg-card rounded-xl border shadow-2xl p-6">
                        <h3 className="font-heading font-semibold mb-4">Quick Actions</h3>
                        <div className="space-y-2">
                            <Button variant="outline" className="w-full justify-start" onClick={() => { setActiveView("tasks"); setShowCreateTask(true); }}>
                                <Plus className="h-4 w-4 mr-2" />
                                Create New Task
                            </Button>
                            <Button variant="outline" className="w-full justify-start" onClick={() => { setActiveView("notes"); setShowAddNote(true); }}>
                                <StickyNote className="h-4 w-4 mr-2" />
                                Add Note
                            </Button>
                            <Button variant="outline" className="w-full justify-start" onClick={() => setShowMailForm(true)}>
                                <Mail className="h-4 w-4 mr-2" />
                                Send Email
                            </Button>
                            <Button variant="outline" className="w-full justify-start" onClick={handleEditClick}>
                                <UserCog className="h-4 w-4 mr-2" />
                                Edit Client
                            </Button>
                        </div>
                    </div> */}
                </div>
            </div >

            {/* Mail Modal */}
            {
                showMailForm && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowMailForm(false)}>
                        <div className="bg-card rounded-xl border shadow-2xl w-full max-w-2xl animate-in zoom-in-95 max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-between p-6 pb-2">
                                <h3 className="font-heading font-semibold text-lg">Send Email to Client</h3>
                                <Button variant="ghost" size="sm" onClick={() => setShowMailForm(false)}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                            <ScrollableContainer className="px-6 flex-1">
                                <div className="py-2">

                                    <div className="space-y-4">
                                        <div className="grid gap-2">
                                            <label className="text-sm font-medium">To:</label>
                                            <Input value={selectedClient.email} disabled className="bg-muted" />
                                        </div>
                                        <div className="grid gap-2">
                                            <label className="text-sm font-medium">Subject:</label>
                                            <Input
                                                placeholder="Enter subject"
                                                value={mailSubject}
                                                onChange={(e) => setMailSubject(e.target.value)}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between mb-1">
                                            <label className="text-sm font-medium">Message:</label>
                                            <Badge variant="outline" className="text-[10px] bg-primary/5 text-primary border-primary/20">Rich Text Mode</Badge>
                                        </div>
                                        <div className="bg-background rounded-lg border overflow-hidden min-h-[350px] flex flex-col shadow-sm focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                                            <ReactQuill
                                                theme="snow"
                                                value={mailBody}
                                                onChange={setMailBody}
                                                placeholder="Type your message here..."
                                                modules={{
                                                    toolbar: [
                                                        [{ 'header': [1, 2, 3, 4, 5, false] }],
                                                        [{ 'font': [] }],
                                                        [{ 'size': [] }],
                                                        ['bold', 'italic', 'underline', 'strike'],
                                                        [{ 'color': [] }, { 'background': [] }],
                                                        [{ 'script': 'sub' }, { 'script': 'super' }],
                                                        [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'indent': '-1' }, { 'indent': '+1' }],
                                                        [{ 'align': [] }],
                                                        ['blockquote', 'code-block'],
                                                        ['link', 'clean']
                                                    ],
                                                }}
                                                className="flex-1"
                                                style={{ height: '300px' }}
                                            />
                                        </div>
                                        <div className="flex items-center gap-2 pt-2">
                                            <Checkbox
                                                id="single-dashboard-btn"
                                                checked={mailIncludeDashboard}
                                                onCheckedChange={setMailIncludeDashboard}
                                            />
                                            <Label htmlFor="single-dashboard-btn" className="text-sm text-muted-foreground cursor-pointer">
                                                Include "Go to Dashboard" button in email
                                            </Label>
                                        </div>
                                    </div>

                                </div>
                            </ScrollableContainer>
                            <div className="flex justify-end gap-2 p-6 pt-4 border-t">
                                <Button variant="outline" onClick={() => setShowMailForm(false)} disabled={isSendingMail}>Cancel</Button>
                                <Button onClick={handleSendMail} disabled={isSendingMail}>
                                    {isSendingMail ? (
                                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Sending...</>
                                    ) : (
                                        <><Mail className="h-4 w-4 mr-2" /> Send Email</>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Create Task Modal */}
            {
                showCreateTask && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => { setShowCreateTask(false); resetNewTaskForm(); }}>
                        <div className="bg-card rounded-xl border shadow-2xl w-full max-w-2xl animate-in zoom-in-95 max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-between p-6 pb-2">
                                <h3 className="font-heading font-semibold text-lg">Create New Task</h3>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-muted-foreground">Owner</span>
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
                                                {managers.map(m => (
                                                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <Button variant="ghost" size="sm" onClick={() => { setShowCreateTask(false); resetNewTaskForm(); }}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                            <ScrollableContainer className="px-6 flex-1">
                                <div className="py-2">
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
                                            <div className="flex-1 min-h-[150px] flex flex-col">
                                                <ReactQuill
                                                    theme="snow"
                                                    value={newTask.description}
                                                    onChange={(val) => setNewTask({ ...newTask, description: val })}
                                                    placeholder="Detailed description of the task..."
                                                    modules={{
                                                        toolbar: [
                                                            ['bold', 'italic', 'underline', 'strike'],
                                                            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                                                            [{ 'color': [] }, { 'background': [] }],
                                                            ['link', 'clean']
                                                        ],
                                                    }}
                                                    className="flex-1 bg-background"
                                                />
                                            </div>
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
                                </div>
                            </ScrollableContainer>
                            <div className="flex justify-end gap-2 p-6 pt-2 border-t">
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
                                        const textToCopy = `Task: ${newTask.title || 'N/A'} \nStatus: ${newTask.status || 'In Progress'} \nPriority: ${newTask.isHighPriority ? 'High' : 'Medium'} \nOwner: ${newTask.owner || 'N/A'} \nDue Date: ${newTask.dueDate || 'N/A'} \nDescription: \n${stripHtml(newTask.description) || 'N/A'} `.trim();
                                        navigator.clipboard.writeText(textToCopy);
                                        toast.success("Task details copied!");
                                    }}
                                >
                                    <Copy className="h-4 w-4 mr-1" />
                                    Copy Task
                                </Button>
                                <Button variant="outline" onClick={() => { setShowCreateTask(false); resetNewTaskForm(); }} disabled={isSubmitting}>Cancel</Button>
                                <Button onClick={handleCreateTask} disabled={isSubmitting}>
                                    {isSubmitting ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                                    Create Task
                                </Button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Edit Task Modal */}
            {
                showEditTask && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowEditTask(null)}>
                        <div className="bg-card rounded-xl border shadow-2xl w-full max-w-2xl animate-in zoom-in-95 max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-between p-6 pb-2">
                                <h3 className="font-heading font-semibold text-lg">Edit Task</h3>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-muted-foreground">Owner</span>
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
                                                {managers.map(m => (
                                                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <Button variant="ghost" size="sm" onClick={() => setShowEditTask(null)}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                            <ScrollableContainer className="px-6 flex-1">
                                <div className="py-2">

                                    <div className="space-y-5">
                                        <div className="flex items-center gap-4">
                                            <label className="text-sm font-medium w-32 text-right">Task Name</label>
                                            <Input className="flex-1" value={showEditTask.title || ""} onChange={(e) => setShowEditTask({ ...showEditTask, title: e.target.value })} />
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <label className="text-sm font-medium w-32 text-right">Due Date</label>
                                            <Input type="date" className="flex-1" value={showEditTask.dueDate || ""} onChange={(e) => setShowEditTask({ ...showEditTask, dueDate: e.target.value })} />
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <label className="text-sm font-medium w-32 text-right">Plan for the week</label>
                                            <Select value={showEditTask.planForWeek || currentWeekNumber.toString()} onValueChange={(v) => setShowEditTask({ ...showEditTask, planForWeek: v })}>
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
                                            <div className="flex-1 px-3 py-2 bg-muted/50 rounded-lg border text-sm">
                                                {selectedClient.company}
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-4">
                                            <label className="text-sm font-medium w-32 text-right pt-2">Description</label>
                                            <div className="flex-1 min-h-[150px] flex flex-col">
                                                <ReactQuill
                                                    theme="snow"
                                                    value={showEditTask.description || ""}
                                                    onChange={(val) => setShowEditTask({ ...showEditTask, description: val })}
                                                    placeholder="Detailed description of the task..."
                                                    modules={{
                                                        toolbar: [
                                                            ['bold', 'italic', 'underline', 'strike'],
                                                            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                                                            [{ 'color': [] }, { 'background': [] }],
                                                            ['link', 'clean']
                                                        ],
                                                    }}
                                                    className="flex-1 bg-background"
                                                />
                                            </div>
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
                            </ScrollableContainer>
                            <div className="flex justify-end gap-2 p-6 pt-2 border-t">
                                <Button variant="outline" onClick={() => { setShowEditTask(null); setSelectedFile(null); }} disabled={isSubmitting}>Cancel</Button>
                                <Button onClick={handleUpdateTask} disabled={isSubmitting}>
                                    {isSubmitting ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                                    Save Changes
                                </Button>
                            </div>
                        </div>
                    </div>
                )
            }


            {/* Edit Client Modal */}
            {
                showEditClient && editClientData && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowEditClient(false)}>
                        <div className="bg-card rounded-xl border shadow-2xl w-full max-w-4xl animate-in zoom-in-95 max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-between p-6 pb-2">
                                <h3 className="font-heading font-semibold text-lg">Edit Client: {editClientData.name}</h3>
                                <Button variant="ghost" size="sm" onClick={() => setShowEditClient(false)}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                            <ScrollableContainer className="px-6 flex-1">
                                <div className="py-2">

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Core Info */}
                                        <div className="bg-muted/30 p-5 rounded-2xl border border-border/50 space-y-5 flex flex-col shadow-sm">
                                            <div className="flex items-center gap-2 border-b pb-3 text-primary">
                                                <User className="h-5 w-5" />
                                                <h4 className="font-semibold tracking-tight">Core Information</h4>
                                            </div>
                                            <div className="grid gap-2">
                                                <label className="text-sm font-medium">Seller Name</label>
                                                <Input value={editClientData.name || ""} disabled className="bg-muted" />
                                            </div>
                                            <div className="grid gap-2">
                                                <label className="text-sm font-medium">Company Name</label>
                                                <Input value={editClientData.company || ""} disabled className="bg-muted" />
                                            </div>
                                            <div className="grid gap-2">
                                                <label className="text-sm font-medium">Email Address</label>
                                                <Input type="email" value={editClientData.email || ""} disabled className="bg-muted" />
                                            </div>
                                            <div className="grid gap-2">
                                                <label className="text-sm font-medium">Phone Number</label>
                                                <Input value={editClientData.phone || ""} disabled className="bg-muted" />
                                            </div>
                                            <div className="grid gap-2">
                                                <label className="text-sm font-medium">GST Number</label>
                                                <Input
                                                    value={editClientData.gstNo || ""}
                                                    onChange={(e) => {
                                                        const val = e.target.value.toUpperCase();
                                                        if (val.length <= 15) {
                                                            setEditClientData({ ...editClientData, gstNo: val });
                                                        }
                                                    }}
                                                    placeholder="22AAAAA0000A1Z5 or NA"
                                                />
                                                <p className="text-[10px] text-muted-foreground italic">Size 15 for GST, or "NA" for not available.</p>
                                            </div>
                                            <div className="grid gap-2">
                                                <div className="flex items-center justify-between">
                                                    <label className="text-sm font-medium">Plan</label>
                                                </div>
                                                <Select
                                                    value={editClientData.plan}
                                                    onValueChange={(v) => setEditClientData({ ...editClientData, plan: v })}
                                                    disabled={!isPlanEditable}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="None">None</SelectItem>
                                                        <SelectItem value="Free">Free</SelectItem>
                                                        <SelectItem value="Platinum">Platinum</SelectItem>
                                                        <SelectItem value="Premium">Premium</SelectItem>
                                                        <SelectItem value="Elite">Elite</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="grid gap-2">
                                                <label className="text-sm font-medium">Stage</label>
                                                <Select value={editClientData.stage} onValueChange={(v) => setEditClientData({ ...editClientData, stage: v })}>
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="None">None</SelectItem>
                                                        <SelectItem value="New Lead Assigned">New Lead Assigned</SelectItem>
                                                        <SelectItem value="Follow up in review">Follow up in review</SelectItem>
                                                        <SelectItem value="Support On Going">Support On Going</SelectItem>
                                                        <SelectItem value="Payment Request">Payment Request</SelectItem>
                                                        <SelectItem value="Optimization Needed">Optimization Needed</SelectItem>
                                                        <SelectItem value="Need Attention - High Priority">Need Attention - High Priority</SelectItem>
                                                        <SelectItem value="At Risk / Escalated">At Risk / Escalated</SelectItem>
                                                        <SelectItem value="Seller Account Suspended">Seller Account Suspended</SelectItem>
                                                        <SelectItem value="Subscription Ended">Subscription Ended</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="grid gap-2">
                                                <label className="text-sm font-medium">Discount</label>
                                                <Select value={editClientData.discount} onValueChange={(v) => setEditClientData({ ...editClientData, discount: v })}>
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="None">None</SelectItem>
                                                        <SelectItem value="5%">5%</SelectItem>
                                                        <SelectItem value="10%">10%</SelectItem>
                                                        <SelectItem value="15%">15%</SelectItem>
                                                        <SelectItem value="20%">20%</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="grid gap-2">
                                                <label className="text-sm font-medium">Assigned POC</label>
                                                <ManagerCombobox
                                                    value={editClientData.manager || "Unassigned"}
                                                    onChange={(val) => setEditClientData({ ...editClientData, manager: val })}
                                                    managers={managers}
                                                    placeholder="Select Manager"
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label>Assigned Teams</Label>
                                                <TeamCombobox
                                                    selectedTeams={editClientData.teams || []}
                                                    onChange={(val) => {
                                                        let membersToRemove = new Set();
                                                        (editClientData.teams || []).filter(t => !val.includes(t)).forEach(tId => {
                                                            const team = teams.find(t => t._id === tId);
                                                            if (team) [team.leadId, ...(team.memberIds || [])].filter(Boolean).forEach(m => membersToRemove.add((m._id || m.id).toString()));
                                                        });
                                                        val.forEach(tId => {
                                                            const team = teams.find(t => t._id === tId);
                                                            if (team) [team.leadId, ...(team.memberIds || [])].filter(Boolean).forEach(m => membersToRemove.delete((m._id || m.id).toString()));
                                                        });
                                                        membersToRemove.forEach(idStr => {
                                                            const admin = managers.find(m => (m._id || m.id).toString() === idStr);
                                                            if (admin && (admin.name === editClientData.manager || admin.name === editClientData.salesManager || admin.name === editClientData.adsManager)) membersToRemove.delete(idStr);
                                                        });
                                                        const currentAssigned = (editClientData.assignedAdminIds || []).filter(id => !membersToRemove.has(id.toString()));

                                                        const teamAdmins = [];
                                                        val.forEach(tId => {
                                                            const team = teams.find(t => t._id === tId);
                                                            if (team) {
                                                                const members = [team.leadId, ...(team.memberIds || [])].filter(Boolean);
                                                                members.forEach(m => {
                                                                    const role = (m.adminRole || "").toLowerCase();
                                                                    if (role.includes('poc') || role.includes('sales manager') || role.includes('ads manager') ||
                                                                        (editClientData.manager && m.name === editClientData.manager) ||
                                                                        (editClientData.salesManager && m.name === editClientData.salesManager) ||
                                                                        (editClientData.adsManager && m.name === editClientData.adsManager)) {
                                                                        if (!teamAdmins.includes((m._id || m.id).toString())) teamAdmins.push((m._id || m.id).toString());
                                                                    }
                                                                });
                                                            }
                                                        });
                                                        const mergedAdmins = [...new Set([...currentAssigned, ...teamAdmins])];
                                                        setEditClientData({ ...editClientData, teams: val, assignedAdminIds: mergedAdmins });
                                                    }}
                                                    teams={teams}
                                                    placeholder="Select Teams"
                                                />
                                                <TeamMemberVisibilitySelector
                                                    selectedTeams={editClientData.teams || []}
                                                    teams={teams}
                                                    assignedAdminIds={editClientData.assignedAdminIds || []}
                                                    setAssignedAdminIds={(val) => setEditClientData({ ...editClientData, assignedAdminIds: val })}
                                                    clientData={editClientData}
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label>Additional Admins Visibility</Label>
                                                <AdminMultiSelect
                                                    selectedAdmins={editClientData.assignedAdminIds || []}
                                                    onChange={(val) => setEditClientData({ ...editClientData, assignedAdminIds: val })}
                                                    admins={managers}
                                                    placeholder="Select additional team members"
                                                />
                                            </div>
                                        </div>

                                        {/* Additional Details */}
                                        <div className="bg-muted/30 p-5 rounded-2xl border border-border/50 space-y-5 flex flex-col shadow-sm">
                                            <div className="flex items-center gap-2 border-b pb-3 text-primary">
                                                <Layers className="h-5 w-5" />
                                                <h4 className="font-semibold tracking-tight">Additional Details</h4>
                                            </div>
                                            <div className="grid gap-2">
                                                <label className="text-sm font-medium">Sales Manager</label>
                                                <ManagerCombobox
                                                    value={editClientData.salesManager || ""}
                                                    onChange={(val) => setEditClientData({ ...editClientData, salesManager: val })}
                                                    managers={managers}
                                                    placeholder="Select Sales Manager"
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <label className="text-sm font-medium">Ads Manager</label>
                                                <ManagerCombobox
                                                    value={editClientData.adsManager || ""}
                                                    onChange={(val) => setEditClientData({ ...editClientData, adsManager: val })}
                                                    managers={managers}
                                                    placeholder="Select Ads Manager"
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <label className="text-sm font-medium">Customer ID/Merchant Token</label>
                                                <Input value={editClientData.merchantToken || ""} onChange={(e) => setEditClientData({ ...editClientData, merchantToken: e.target.value })} />
                                            </div>
                                            <div className="grid gap-2">
                                                <label className="text-sm font-medium">SP Central Request ID</label>
                                                <Input value={editClientData.spCentralRequestId || ""} onChange={(e) => setEditClientData({ ...editClientData, spCentralRequestId: e.target.value })} />
                                            </div>
                                            <div className="grid gap-2">
                                                <label className="text-sm font-medium">Marketplace</label>
                                                <Select value={editClientData.marketplace} onValueChange={(v) => setEditClientData({ ...editClientData, marketplace: v })}>
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="None">None</SelectItem>
                                                        <SelectItem value="Amazon.in">Amazon.in</SelectItem>
                                                        <SelectItem value="Amazon.com">Amazon.com</SelectItem>
                                                        <SelectItem value="Amazon.ae">Amazon.ae</SelectItem>
                                                        <SelectItem value="Amazon.sa">Amazon.sa</SelectItem>
                                                        <SelectItem value="Flipkart.com">Flipkart.com</SelectItem>
                                                        <SelectItem value="SmartCommerce">SmartCommerce</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="grid gap-2">
                                                <label className="text-sm font-medium">User Permission</label>
                                                <Input value={editClientData.userPermission || ""} onChange={(e) => setEditClientData({ ...editClientData, userPermission: e.target.value })} />
                                            </div>
                                            <div className="grid gap-2">
                                                <label className="text-sm font-medium">Account Access URL</label>
                                                <Input value={editClientData.accountAccessUrl || ""} onChange={(e) => setEditClientData({ ...editClientData, accountAccessUrl: e.target.value })} />
                                            </div>
                                            <div className="grid gap-2">
                                                <label className="text-sm font-medium">Lead Source</label>
                                                <Select value={editClientData.leadSource} onValueChange={(v) => setEditClientData({ ...editClientData, leadSource: v })}>
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="None">None</SelectItem>
                                                        <SelectItem value="CTRL">CTRL</SelectItem>
                                                        <SelectItem value="Reference">Reference</SelectItem>
                                                        <SelectItem value="Web Research">Web Research</SelectItem>
                                                        <SelectItem value="Web Download">Web Download</SelectItem>
                                                        <SelectItem value="Webinar">Webinar</SelectItem>
                                                        <SelectItem value="Telecalling">Telecalling</SelectItem>
                                                        <SelectItem value="Whatsapp chat">Whatsapp chat</SelectItem>
                                                        <SelectItem value="Instagram / meta">Instagram / meta</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="grid gap-2">
                                                <label className="text-sm font-medium">Support SLA (TAT)</label>
                                                <Select value={editClientData.supportType} onValueChange={(v) => setEditClientData({ ...editClientData, supportType: v })}>
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Free">2 hours</SelectItem>
                                                        <SelectItem value="Platinum">Next Day</SelectItem>
                                                        <SelectItem value="Premium">Same Day</SelectItem>
                                                        <SelectItem value="Elite">Custom</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="grid gap-2">
                                                <label className="text-sm font-medium">Subscription start date</label>
                                                <Input type="date" value={editClientData.subscriptionStart ? new Date(editClientData.subscriptionStart).toISOString().split('T')[0] : ""} onChange={(e) => setEditClientData({ ...editClientData, subscriptionStart: e.target.value })} />
                                            </div>
                                            <div className="grid gap-2">
                                                <label className="text-sm font-medium">Subscription end date</label>
                                                <Input type="date" value={editClientData.subscriptionEnd ? new Date(editClientData.subscriptionEnd).toISOString().split('T')[0] : ""} onChange={(e) => setEditClientData({ ...editClientData, subscriptionEnd: e.target.value })} />
                                            </div>
                                            <div className="grid gap-2">
                                                <label className="text-sm font-medium">Launch week</label>
                                                <Input value={editClientData.launchWeek || ""} onChange={(e) => setEditClientData({ ...editClientData, launchWeek: e.target.value })} placeholder="e.g. Week 1" />
                                            </div>
                                            <div className="grid gap-2">
                                                <label className="text-sm font-medium">POE (Proof OF Engagement)</label>
                                                <Input value={editClientData.poeUrl || ""} onChange={(e) => setEditClientData({ ...editClientData, poeUrl: e.target.value })} placeholder="e.g. https://..." />
                                            </div>
                                        </div>
                                    </div>

                                </div>
                            </ScrollableContainer>
                            <div className="flex justify-end gap-2 p-6 pt-2 border-t">
                                <Button variant="outline" onClick={() => setShowEditClient(false)}>Cancel</Button>
                                <Button onClick={handleSaveClient}>
                                    <Save className="h-4 w-4 mr-1" />
                                    Save Changes
                                </Button>
                            </div>
                        </div>
                    </div >
                )
            }
            {/* Invoice View Dialog */}
            <Dialog open={isInvoiceViewOpen} onOpenChange={setIsInvoiceViewOpen}>
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
                                        onClick={() => setIsInvoiceViewOpen(false)}
                                    >
                                        Close
                                    </Button>
                                </div>
                            </div>

                            {/* Scrollable Area */}
                            <div
                                className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-200/40 outline-none relative overscroll-contain"
                                tabIndex={0}
                            >
                                <div className="mx-auto shadow-2xl bg-white rounded-sm mb-10 pointer-events-auto relative z-10 select-none">
                                    <InvoiceLayout invoice={selectedInvoice} />
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

            {/* Hidden Print Portal */}
            <div className="opacity-0 pointer-events-none absolute -left-[5000px] h-0 overflow-hidden" aria-hidden="true">
                {selectedInvoice && !isInvoiceViewOpen && (
                    <div id="invoice-hidden-print-portal">
                        <InvoiceLayout invoice={selectedInvoice} />
                    </div>
                )}
            </div>


        </div >
    );
};

export default SuperAdminClientsTab;
