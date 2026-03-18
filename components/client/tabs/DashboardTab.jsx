"use client";

import { useState, useEffect } from "react";
import { LayoutDashboard, CheckSquare, Clock, CheckCircle2, Bell, Mail, Headphones, Loader2, Phone, XCircle, TrendingUp, ArrowRight, Sparkles, CalendarDays, Sun, Moon, Sunrise } from "lucide-react";
import StatCard from "@/components/dashboard/StatCard";
import StatusBadge from "@/components/dashboard/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { getTasks } from "@/lib/actions/task";
import { getUserById } from "@/lib/actions/user";
import { getNotifications } from "@/lib/actions/notification";
import TaskDetailsDialog from "@/components/dashboard/TaskDetailsDialog";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { calculatePeriodDays } from "@/lib/utils";

const ClientDashboardTab = ({ currentUser }) => {
    const router = useRouter();
    const { data: session } = useSession();
    const [loading, setLoading] = useState(true);
    const [client, setClient] = useState(null);
    const [manager, setManager] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [showViewTask, setShowViewTask] = useState(null);

    useEffect(() => {
        const loadDashboardData = async () => {
            if (!currentUser) {
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                setClient(currentUser);

                // Fetch tasks for this client
                const tasksResponse = await getTasks({ "client.id": currentUser._id, limit: 10 });
                const tasksArray = Array.isArray(tasksResponse) ? tasksResponse : (tasksResponse.tasks || []);
                setTasks(tasksArray);

                // Fetch notifications
                const notifs = await getNotifications({ recipientId: currentUser._id, limit: 10 });
                setNotifications(notifs || []);

                // Fetch manager if assigned
                if (currentUser.managerId) {
                    const managerData = await getUserById(currentUser.managerId);
                    setManager(managerData);
                } else if (currentUser.manager) {
                    // Fallback if manager is stored as a string or object
                    setManager(typeof currentUser.manager === 'object' ? currentUser.manager : { name: currentUser.manager });
                }
            } catch (error) {
                console.error("Error loading client dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };

        loadDashboardData();
    }, [currentUser]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground animate-pulse">Loading dashboard data...</p>
            </div>
        );
    }

    if (!client) {
        return (
            <div className="bg-card rounded-xl border p-12 text-center">
                <h2 className="text-xl font-semibold mb-2">Account Not Found</h2>
                <p className="text-muted-foreground">We couldn't load your account details. Please contact support.</p>
            </div>
        );
    }

    // Calculate stats
    const normalize = (s) => (s || "").toLowerCase().trim();
    const activeTasksCount = tasks.filter(t => ["in progress", "under review"].includes(normalize(t.status))).length;
    const completedTasksCount = tasks.filter(t => ["completed"].includes(normalize(t.status))).length;
    const cancelledTasksCount = tasks.filter(t => ["cancelled"].includes(normalize(t.status))).length;

    // Calculate next payment date
    let nextPaymentDate = client.subscriptionEnd ? new Date(client.subscriptionEnd) : null;
    if (!nextPaymentDate && client.plan && client.plan !== "None") {
        const planDays = calculatePeriodDays(client.plan);
        nextPaymentDate = new Date(client.subscriptionStart || client.joinedDate || Date.now());
        const now = new Date();
        while (nextPaymentDate < now) {
            nextPaymentDate.setDate(nextPaymentDate.getDate() + (planDays || 30));
            if (!planDays || planDays <= 0) break;
        }
    }
    const nextPaymentDateString = nextPaymentDate ? nextPaymentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : "---";

    // Get recent tasks
    const recentTasks = tasks.slice(0, 5);

    const managerInitials = manager?.name ? manager.name.split(' ').map(n => n[0]).join('') : "A";

    // Format the manager phone for display
    const formatPhone = (phone) => {
        if (!phone) return null;
        const cleaned = phone.replace(/[^0-9]/g, '');
        if (cleaned.length === 10) return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
        if (cleaned.length > 10) return `+${cleaned.slice(0, cleaned.length - 10)} ${cleaned.slice(-10, -5)} ${cleaned.slice(-5)}`;
        return phone;
    };

    return (
        <div className="space-y-6">
            {/* Welcome Banner */}
            <div className="bg-gradient-primary text-white rounded-2xl p-8 shadow-xl relative overflow-hidden">
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-3">
                        {(() => {
                            const hour = new Date().getHours();
                            if (hour >= 5 && hour < 12) return <><Sunrise className="w-5 h-5 text-amber-300" /> <span className="text-white/80 text-sm font-medium">Good Morning</span></>;
                            if (hour >= 12 && hour < 17) return <><Sun className="w-5 h-5 text-amber-400" /> <span className="text-white/80 text-sm font-medium">Good Afternoon</span></>;
                            if (hour >= 17 && hour < 21) return <><Sparkles className="w-5 h-5 text-blue-200" /> <span className="text-white/80 text-sm font-medium">Good Evening</span></>;
                            return <><Moon className="w-5 h-5 text-indigo-200" /> <span className="text-white/80 text-sm font-medium">Good Night</span></>;
                        })()}
                    </div>
                    <h1 className="text-3xl font-bold mb-2 capitalize">{client?.name || session?.user?.name || "Client"}!</h1>
                    <div className="flex flex-col gap-1.5 mb-2">
                        <p className="text-white/90 font-medium text-sm">{client?.email || session?.user?.email}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                            {client?.supportType === "Within 2 Hours" && (
                                <Badge className="bg-amber-400 text-amber-900 border-none hover:bg-amber-400 font-bold px-3 shadow-lg">
                                    <Clock className="w-3 h-3 mr-1.5" />
                                    ⚡ 2H EXPRESS SUPPORT
                                </Badge>
                            )}
                            <p className="text-white/80 max-w-md">Your account is performing well. Here's your latest overview.</p>
                        </div>
                    </div>
                </div>
                {/* Decorative background elements */}
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-40 h-40 bg-white/5 rounded-full blur-2xl"></div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-xl bg-card border hover:shadow-md transition-all duration-300 group cursor-pointer" onClick={() => router.push("/client/dashboard/plan")}>
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-medium">Active Plan</p>
                            <p className={`text-xl font-heading font-bold capitalize ${!client.plan || client.plan === "None" ? "text-muted-foreground" : client.plan === "Free" ? "text-emerald-600" : "text-primary"}`}>
                                {client.plan && client.plan !== "None" ? client.plan : "None"}
                            </p>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300">
                            <LayoutDashboard className="h-5 w-5" />
                        </div>
                    </div>
                </div>
                <div className="p-5 rounded-xl bg-card border hover:shadow-md transition-all duration-300 group cursor-pointer" onClick={() => router.push("/client/dashboard/billing")}>
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-medium">Next Payment</p>
                            <p className="text-xl font-heading font-bold text-primary">{(client.plan && client.plan !== "None") || client.subscriptionEnd ? nextPaymentDateString : "N/A"}</p>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300">
                            <Clock className="h-5 w-5" />
                        </div>
                    </div>
                </div>
                <div className="p-5 rounded-xl bg-card border hover:shadow-md transition-all duration-300 group cursor-pointer" onClick={() => router.push("/client/dashboard/tasks")}>
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-medium">Active Tasks</p>
                            <p className="text-xl font-heading font-bold text-amber-600">{activeTasksCount}</p>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 group-hover:bg-amber-500 group-hover:text-white transition-all duration-300">
                            <CheckSquare className="h-5 w-5" />
                        </div>
                    </div>
                </div>
                <div className="p-5 rounded-xl bg-card border hover:shadow-md transition-all duration-300 group cursor-pointer" onClick={() => router.push("/client/dashboard/tasks")}>
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-medium">Completed</p>
                            <p className="text-xl font-heading font-bold text-green-600">{completedTasksCount}</p>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-600 group-hover:bg-green-500 group-hover:text-white transition-all duration-300">
                            <TrendingUp className="h-5 w-5" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Account Manager / POC */}
                <div className="bg-card rounded-2xl border p-6 shadow-sm">
                    <h2 className="font-heading font-semibold mb-4 flex items-center gap-2">
                        <div className="w-1.5 h-5 rounded-full bg-primary" />
                        Your POC
                    </h2>
                    {manager ? (
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary font-heading font-bold text-lg border border-primary/10">
                                    {managerInitials}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold capitalize text-base">{manager.name}</p>
                                    <p className="text-sm text-muted-foreground capitalize">{manager.adminRole || manager.role || "Manager"}</p>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <a href={`mailto:${manager.email}`} className="flex items-center gap-3 p-2.5 rounded-lg bg-accent/50 hover:bg-accent transition-colors group">
                                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                        <Mail className="h-3.5 w-3.5 text-primary" />
                                    </div>
                                    <span className="text-sm text-foreground truncate">{manager.email}</span>
                                </a>
                                {manager.phone && (
                                    <a href={`tel:${manager.phone}`} className="flex items-center gap-3 p-2.5 rounded-lg bg-accent/50 hover:bg-accent transition-colors group">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                                            <Phone className="h-3.5 w-3.5 text-emerald-600" />
                                        </div>
                                        <span className="text-sm text-foreground">{formatPhone(manager.phone)}</span>
                                    </a>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="mb-4 text-sm text-muted-foreground py-4 text-center bg-accent/30 rounded-xl">No account manager assigned yet.</div>
                    )}

                    {/* Support Email */}
                    <div className="pt-4 mt-4 border-t">
                        <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-xl border border-primary/10">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                <Headphones className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-1">
                                <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">Need Support?</p>
                                <a href="mailto:support@fakhriitservices.com" className="text-sm text-primary font-medium flex items-center gap-1 hover:underline">
                                    <Mail className="h-3 w-3" />
                                    support@fakhriitservices.com
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Task Summary */}
                <div className="bg-card rounded-2xl border p-6 lg:col-span-2 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-heading font-semibold flex items-center gap-2">
                            <div className="w-1.5 h-5 rounded-full bg-amber-500" />
                            Recent Tasks
                        </h2>
                        <button onClick={() => router.push("/client/dashboard/tasks")} className="text-sm text-primary hover:underline flex items-center gap-1 font-medium">
                            View All <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                    </div>
                    <div className="space-y-1">
                        {recentTasks.length > 0 ? (
                            recentTasks.map((task) => (
                                <div
                                    key={task._id}
                                    className="flex items-center justify-between py-3 border-b last:border-0 cursor-pointer hover:bg-accent/50 transition-colors px-3 rounded-xl -mx-1"
                                    onClick={() => setShowViewTask(task)}
                                >
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                        <div className={`w-2 h-2 rounded-full shrink-0 ${task.status === 'Completed' ? 'bg-green-500' :
                                            task.status === 'In Progress' ? 'bg-amber-500' :
                                                task.status === 'Under Review' ? 'bg-purple-500' :
                                                    'bg-red-500'
                                            }`} />
                                        <span className="text-sm capitalize font-medium truncate">{task.title}</span>
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0">
                                        <span className="text-xs text-muted-foreground hidden sm:block">
                                            {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : (task.eta || 'No date')}
                                        </span>
                                        <StatusBadge status={task.status} />
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="py-8 text-center">
                                <CheckSquare className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
                                <p className="text-sm text-muted-foreground">No recent tasks.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Notifications Section */}
            <div className="bg-card rounded-2xl border p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="font-heading font-semibold flex items-center gap-2">
                        <div className="w-1.5 h-5 rounded-full bg-blue-500" />
                        Recent Notifications
                    </h2>
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                        <Bell className="h-4 w-4 text-blue-500" />
                    </div>
                </div>
                <div className="space-y-1">
                    {notifications.length > 0 ? (
                        notifications.slice(0, 5).map((notification) => (
                            <div key={notification._id} className="flex items-start gap-3 py-3 px-3 border-b last:border-0 rounded-xl hover:bg-accent/30 transition-colors -mx-1">
                                <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${notification.read ? 'bg-gray-300' : 'bg-primary animate-pulse'}`} />
                                <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-medium ${notification.read ? 'text-muted-foreground' : ''}`}>{notification.title}</p>
                                    <p className="text-sm text-muted-foreground truncate">{notification.message}</p>
                                    <p className="text-[11px] text-muted-foreground/70 mt-1 flex items-center gap-1">
                                        <CalendarDays className="h-3 w-3" />
                                        {new Date(notification.createdAt).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="py-8 text-center">
                            <Bell className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
                            <p className="text-sm text-muted-foreground">No recent notifications.</p>
                        </div>
                    )}
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

export default ClientDashboardTab;
