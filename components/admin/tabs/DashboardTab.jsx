"use client";
import { useState, useEffect } from "react";
import { Users, CheckSquare, Clock, CheckCircle2, AlertCircle, Loader2, ListChecks } from "lucide-react";
import StatCard from "@/components/dashboard/StatCard";
import StatusBadge from "@/components/dashboard/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getClients, getTasks, upsertTask } from "@/lib/actions/admin";
import TaskDetailsDialog from "@/components/dashboard/TaskDetailsDialog";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

const AdminDashboardTab = ({ setActiveTab, currentUser }) => {
    const { data: session } = useSession();
    const [clients, setClients] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showViewTask, setShowViewTask] = useState(null);

    useEffect(() => {
        async function loadData() {
            if (!currentUser) {
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                const isSuperAdmin = currentUser.role === 'super-admin' || currentUser.role === 'superadmin' || currentUser.role === 'super_admin';

                const clientsRes = await getClients(isSuperAdmin ? {} : { managerId: currentUser._id });
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

                const t = await getTasks(taskFilter);

                // Deduplicate to avoid React key errors
                const uniqueClients = Array.from(new Map(c.map(item => [String(item._id), item])).values());
                const uniqueTasks = Array.from(new Map(t.map(item => [String(item._id || item.id), item])).values());

                setClients(uniqueClients);
                setTasks(uniqueTasks);
            } catch (error) {
                console.error("Failed to load dashboard data", error);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [currentUser]);

    // Data is already filtered by API
    const myTasks = tasks;

    // Calculate stats
    const activeTasksCount = myTasks.filter(t => (t.status || '').toLowerCase() === "in progress").length;
    const pendingTasksCount = myTasks.filter(t => (t.status || '').toLowerCase() === "under review").length;
    const completedTasksCount = myTasks.filter(t => (t.status || '').toLowerCase() === "completed").length;

    // Enrich clients with active task count
    const myClients = clients.map(client => {
        const clientTaskCount = tasks.filter(t =>
            (t.clientId === client._id || t.client?.id === client._id) &&
            !["completed", "cancelled"].includes((t.status || '').toLowerCase())
        ).length;
        return { ...client, activeTasks: clientTaskCount, id: client._id };
    });

    // Get recent tasks (limit 4)
    const recentTasks = [...myTasks]
        .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
        .slice(0, 4);

    if (loading) {
        return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary" /></div>;
    }

    if (!currentUser) {
        return <div className="p-6 text-center text-muted-foreground">User information not available.</div>;
    }

    return (
        <div className="space-y-6">
            {/* Welcome Banner */}
            <div className="bg-gradient-primary text-white rounded-xl p-8 shadow-lg relative overflow-hidden">
                <div className="relative z-10">
                    <h1 className="text-3xl font-bold mb-2 capitalize">Welcome back, {currentUser?.name || session?.user?.name || "Admin"}!</h1>
                    <div className="flex flex-col gap-1 mb-2">
                        <p className="text-white/90 font-medium text-sm">{currentUser?.email || session?.user?.email}</p>
                        <p className="text-white/80 max-w-md">You have {activeTasksCount + pendingTasksCount} active tasks and {myClients.length} assigned clients.</p>
                    </div>
                </div>
                {/* Decorative background element */}
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
            </div>

            {/* Stats Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
                <StatCard title="Total Clients" value={myClients.length} icon={<Users className="h-5 w-5" />} />
                <StatCard title="Total Tasks" value={myTasks.length} icon={<ListChecks className="h-5 w-5" />} />
                <StatCard title="Active" value={activeTasksCount} icon={<CheckSquare className="h-5 w-5 text-blue-500" />} />
                <StatCard title="Pending" value={pendingTasksCount} icon={<Clock className="h-5 w-5 text-orange-500" />} />
                <StatCard title="Completed" value={completedTasksCount} icon={<CheckCircle2 className="h-5 w-5 text-green-500" />} />
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
                {/* Recent Tasks */}
                <div className="bg-card rounded-xl border p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-heading font-semibold">Recent Tasks</h2>
                        <button onClick={() => setActiveTab("Tasks")} className="text-sm text-primary hover:underline">View All</button>
                    </div>
                    <div className="space-y-3">
                        {recentTasks.length > 0 ? (
                            recentTasks.map((task) => (
                                <div
                                    key={task._id || task.id}
                                    className="flex items-center justify-between py-3 border-b last:border-0 cursor-pointer hover:bg-muted/50 transition-colors px-2 rounded-lg -mx-2"
                                    onClick={() => setShowViewTask(task)}
                                >
                                    <div>
                                        <p className="font-medium text-sm capitalize">{task.title}</p>
                                        <p className="text-xs text-muted-foreground capitalize">{task.client?.name || "General"}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant={task.priority === "High" ? "destructive" : task.priority === "Medium" ? "secondary" : "outline"} className="text-xs">
                                            {task.priority || "Medium"}
                                        </Badge>
                                        <div onClick={(e) => e.stopPropagation()}>
                                            <Select
                                                defaultValue={task.status}
                                                onValueChange={async (v) => {
                                                    try {
                                                        await upsertTask({ id: task._id || task.id, status: v });
                                                        setTasks(prev => prev.map(t => (t._id === task._id || t.id === task.id) ? { ...t, status: v } : t));
                                                        toast.success("Status updated");
                                                    } catch (error) {
                                                        console.error(error);
                                                        toast.error("Failed to update status");
                                                    }
                                                }}
                                            >
                                                <SelectTrigger className="w-[110px] h-7 text-xs">
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
                            ))
                        ) : (
                            <p className="text-sm text-muted-foreground text-center py-4">No recent tasks found.</p>
                        )}
                    </div>
                </div>

                {/* My Clients */}
                <div className="bg-card rounded-xl border p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-heading font-semibold">My Clients</h2>
                        <button onClick={() => setActiveTab("Clients")} className="text-sm text-primary hover:underline">View All</button>
                    </div>
                    <div className="space-y-3">
                        {myClients.slice(0, 5).map((client) => (
                            <div key={client.id} className="flex items-center justify-between py-3 border-b last:border-0">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-sm uppercase">
                                        {client.name ? client.name.split(' ').map(n => n[0]).join('') : 'C'}
                                    </div>
                                    <div>
                                        <p className="font-medium text-sm capitalize">{client.name}</p>
                                        <p className="text-xs text-muted-foreground capitalize">{client.company}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-xs capitalize">{client.plan || 'Free'}</Badge>
                                    <span className="text-xs text-muted-foreground">{client.activeTasks} tasks</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Alerts - simplified logic */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="font-medium text-yellow-800">Status Overview</p>
                        <p className="text-sm text-yellow-700 mt-1">
                            You have {pendingTasksCount} tasks pending attention.
                        </p>
                    </div>
                </div>
            </div>


            <TaskDetailsDialog
                open={!!showViewTask}
                onOpenChange={(open) => !open && setShowViewTask(null)}
                task={showViewTask}
            />
        </div >
    );
};

export default AdminDashboardTab;
