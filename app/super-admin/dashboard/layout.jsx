"use client";

import { useState, useEffect, useCallback, useRef, createContext } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Users, UsersRound, UserCog, CheckSquare,
  IndianRupee, Settings, Menu, X, LogOut, Shield, Globe, Loader2, MessageSquare, Tag,
  ChevronLeft, ChevronRight, Briefcase, FileText, Calculator, LineChart, Receipt
} from "lucide-react";
import Logo from "@/components/ui/Logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import NotificationDropdown from "@/components/ui/NotificationDropdown";
import NotificationSetupDialog from "@/components/ui/NotificationSetupDialog";
import { markNotificationAsRead, markAllNotificationsAsRead, deleteNotification, clearAllNotifications } from "@/lib/actions/notification";
import { getUserByEmail, updateUser } from "@/lib/actions/user";
import useNotifications from "@/hooks/useNotifications";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { signOut, useSession } from "next-auth/react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import dynamic from "next/dynamic";
// Dynamic tabs have been moved to their respective nested routes for better code splitting and performance

export const SuperAdminDashboardContext = createContext();

const navigation = [
  { name: "Dashboard", id: "Dashboard", href: "/super-admin/dashboard", icon: LayoutDashboard },
  { name: "Responses", id: "Responses", href: "/super-admin/dashboard/responses", icon: MessageSquare }, // Added Responses
  { name: "Clients", id: "Clients", href: "/super-admin/dashboard/clients", icon: Briefcase },
  { name: "Teams", id: "Teams", href: "/super-admin/dashboard/teams", icon: Users },
  { name: "Admin Users", id: "Admins", href: "/super-admin/dashboard/admins", icon: UserCog },
  { name: "Tasks", id: "Tasks", href: "/super-admin/dashboard/tasks", icon: CheckSquare },
  { name: "Files", id: "Files", href: "/super-admin/dashboard/files", icon: FileText },
  { name: "Website CMS", id: "Website", href: "/super-admin/dashboard/website", icon: Globe },
  { name: "Coupons", id: "Coupons", href: "/super-admin/dashboard/coupons", icon: Tag },
  { name: "Invoices", id: "Invoices", href: "/super-admin/dashboard/invoices", icon: Receipt },
  { name: "Price Calculator", id: "PriceCalculator", href: "/super-admin/dashboard/price-calculator", icon: Calculator },
  { name: "Analytics", id: "Analytics", href: "/super-admin/dashboard/analytics", icon: LineChart },
  // { name: "Settings", id: "Settings_App", href: "/super-admin/dashboard/settings", icon: Settings },
];

export default function SuperAdminDashboardLayout({ children }) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const activeTabObj = navigation.find(n => n.href === pathname) || navigation[0];
  const activeTab = activeTabObj.id;
  const [currentUser, setCurrentUser] = useState(null);
  const { notifications, setNotifications } = useNotifications(currentUser?._id);
  const [showNotificationSetup, setShowNotificationSetup] = useState(false);
  const { subscribeUser, unsubscribeUser, isSupported, permission } = usePushNotifications(currentUser?._id);
  const loadedForEmailRef = useRef(null);

  const userEmail = session?.user?.email;

  useEffect(() => {
    if (!userEmail || loadedForEmailRef.current === userEmail) return;
    loadedForEmailRef.current = userEmail;

    const loadInitialData = async () => {
      setLoading(true);
      try {
        // Fetch actual logged in super-admin
        const admin = await getUserByEmail(userEmail);
        if (admin) {
          setCurrentUser(admin);
          if (!admin.notificationSettingsConfigured) {
            setShowNotificationSetup(true);
          }
        }
      } catch (error) {
        console.error("Error loading super admin dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [userEmail]);

  // Push Notification Prompt
  // Replaced by NotificationSetupDialog

  // Real-time notifications handled by useNotifications hook above

  const handleMarkAsRead = async (id) => {
    try {
      await markNotificationAsRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true, isRead: true } : n));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!currentUser) return;
    try {
      await markAllNotificationsAsRead(currentUser._id);
      setNotifications(prev => prev.map(n => ({ ...n, read: true, isRead: true })));
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const handleDeleteNotification = async (id) => {
    try {
      await deleteNotification(id);
      setNotifications(prev => prev.filter(n => n._id !== id));
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const handleClearAll = async () => {
    if (!currentUser) return;
    try {
      await clearAllNotifications(currentUser._id);
      setNotifications([]);
    } catch (error) {
      console.error("Error clearing all notifications:", error);
    }
  };

  const handleSettingsChange = async (newSettings) => {
    if (!currentUser) return;
    try {
      const oldPushEnabled = currentUser.notificationSettings?.pushNotifications;
      const newPushEnabled = newSettings.pushNotifications;

      let finalSettings = { ...newSettings };

      if (!oldPushEnabled && newPushEnabled) {
        if (subscribeUser) {
          const result = await subscribeUser();
          if (result && !result.success) {
            finalSettings.pushNotifications = false;
            toast.error(result.error || "Please allow browser notifications.");
          }
        }
      } else if (oldPushEnabled && !newPushEnabled) {
        if (unsubscribeUser) await unsubscribeUser();
      }

      setCurrentUser(prev => ({ ...prev, notificationSettings: finalSettings }));
      await updateUser(currentUser._id, { notificationSettings: finalSettings });
    } catch (error) {
      console.error("Error updating notification settings:", error);
    }
  };

  // Navigate to the relevant tab when a notification is clicked
  const handleNotificationClick = (notification) => {
    let targetTab = null;

    // Parse link hash (e.g., #Tasks -> Tasks)
    if (notification.link) {
      if (notification.link.startsWith('#')) {
        targetTab = notification.link.substring(1);
      } else if (notification.link.includes('tab=')) {
        try {
          const url = new URL(notification.link, 'http://localhost');
          const tab = url.searchParams.get('tab');
          if (tab) {
            targetTab = tab.charAt(0).toUpperCase() + tab.slice(1);
          }
        } catch (e) {
          console.error("Error parsing link:", e);
        }
      }
    }

    // Fallback: map notification type to tab
    if (!targetTab) {
      const typeToTab = {
        task: 'Tasks',
        invoice: 'Invoices',
        info: 'Dashboard',
        success: 'Dashboard',
        warning: 'Dashboard',
        error: 'Dashboard',
        feedback: 'Responses',
        contact: 'Responses',
        career: 'Responses'
      };
      targetTab = typeToTab[notification.type] || 'Dashboard';
    }

    // Validate the tab exists in navigation
    const validTab = navigation.find(n => n.id === targetTab);
    if (validTab) {
      router.push(validTab.href);
    }
  };

  const handleNotificationSetupComplete = (updatedUser) => {
    setCurrentUser(updatedUser);
    setShowNotificationSetup(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse font-medium">Loading Super Admin Dashboard...</p>
      </div>
    );
  }

  const userInitials = currentUser?.name?.split(" ").map(n => n[0]).join("") || "SA";

  return (
    <div className="min-h-screen bg-[#F4F4F5] max-w-full">
      <NotificationSetupDialog
        user={currentUser}
        open={showNotificationSetup}
        onComplete={handleNotificationSetupComplete}
        onSettingsChange={handleSettingsChange}
      />

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar - Fixed on desktop */}
      <aside
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          "fixed inset-y-0 left-0 z-[100] bg-sidebar text-sidebar-foreground border-r border-sidebar-border transform sidebar-transition ease-in-out",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          sidebarCollapsed ? "lg:w-20" : "w-64"
        )}
      >
        <div className="flex flex-col h-full scrollbar-none">
          {/* Collapse/Expand Toggle - Desktop Only */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden lg:flex absolute -right-3 top-20 bg-primary text-white w-6 h-6 rounded-full items-center justify-center shadow-md z-50 hover:scale-110 transition-transform"
          >
            {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>

          {/* Logo */}
          <div className="h-16 flex items-center px-4 border-b border-white/10 shrink-0 overflow-hidden">
            <div className="flex items-center gap-2 min-w-max ">
              <Logo variant="white" hideText={sidebarCollapsed} useImage={true} />
              {(!sidebarCollapsed) && (
                <Badge className="bg-primary text-primary-foreground text-[10px] px-1.5 h-5">
                  <Shield className="h-3 w-3 mr-1" />
                  Super admin
                </Badge>
              )}
            </div>
            <button className="lg:hidden ml-auto text-white" onClick={() => setSidebarOpen(false)}>
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto pt-6 scrollbar-none">
            {navigation.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => {
                    setSidebarOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center rounded-xl text-sm font-semibold transition-all duration-300 group relative overflow-hidden",
                    isActive
                      ? "bg-primary text-white shadow-[0_8px_20px_-6px_rgba(136,8,8,0.5)] active-glow"
                      : "text-sidebar-foreground/60 hover:bg-white/5 hover:text-white",
                    (!sidebarCollapsed) ? "px-3 py-2.5 gap-3" : "px-0 py-3 justify-center"
                  )}
                  title={sidebarCollapsed && !isHovered ? item.name : ""}
                >
                  <item.icon className={cn(
                    "h-5 w-5 flex-shrink-0 transition-transform duration-200",
                    isActive ? "scale-110" : "group-hover:scale-110"
                  )} />
                  <span className={cn(
                    "transition-all duration-300 whitespace-nowrap overflow-hidden",
                    (!sidebarCollapsed) ? "opacity-100 w-auto" : "opacity-0 w-0"
                  )}>
                    {item.name}
                  </span>

                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r-full shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
                  )}

                  {/* Tooltip for collapsed state */}
                  {sidebarCollapsed && (
                    <div className="fixed left-20 ml-2 p-2 bg-white/60 backdrop-blur-xl text-primary text-[11px] font-bold rounded-xl opacity-0 pointer-events-none group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300 z-[999] whitespace-nowrap shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)] border border-white/40 flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
                        <item.icon className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <span className="tracking-wide uppercase font-bold">{item.name}</span>
                      <div className="absolute left-[-4px] top-1/2 -translate-y-1/2 w-2 h-2 bg-white/60 backdrop-blur-xl rotate-45 border-l border-b border-white/40" />
                    </div>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User Section */}
          <div className="p-4 border-t border-white/10 shrink-0 bg-sidebar/50">
            <div className="flex items-center gap-3 mb-4 overflow-hidden min-w-max">
              <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/20 flex items-center justify-center font-bold text-primary shrink-0 transition-all duration-300">
                {userInitials}
              </div>
              <div className={cn(
                "flex-1 min-w-0 text-white transition-all duration-300",
                (!sidebarCollapsed) ? "opacity-100 w-auto" : "opacity-0 w-0"
              )}>
                <p className="text-sm font-bold truncate capitalize">{currentUser?.name || session?.user?.name || "Admin"}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  <p className="text-[10px] text-primary font-bold uppercase tracking-wider">Super Admin</p>
                </div>
              </div>
            </div>
            <button
              className={cn(
                "w-full flex items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white hover:bg-red-500/20 hover:border-red-500/30 transition-all duration-200 group",
                (!sidebarCollapsed || isHovered) ? "px-3 py-2" : "p-2.5"
              )}
              onClick={() => signOut({ callbackUrl: "/" })}
            >
              <LogOut className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
              <span className={cn(
                "ml-2 text-sm font-medium transition-all duration-300 whitespace-nowrap overflow-hidden",
                (!sidebarCollapsed || isHovered) ? "opacity-100 w-auto" : "opacity-0 w-0"
              )}>
                Sign Out
              </span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content - Offset by sidebar width on desktop */}
      <div className={cn(
        "min-h-screen flex flex-col content-transition ease-in-out",
        sidebarOpen ? "" : (sidebarCollapsed ? "lg:ml-20" : "lg:ml-64")
      )}>
        {/* Top Bar - Sticky */}
        <header className="h-16 bg-card border-b flex items-center justify-between px-4 lg:px-6 sticky top-0 z-40">
          <button className="lg:hidden p-2" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>

          <div className="hidden lg:block">
            <h1 className="text-lg font-heading font-semibold">
              {navigation.find(n => n.id === activeTab)?.name || "Dashboard"}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <NotificationDropdown
              notifications={notifications}
              onMarkAsRead={handleMarkAsRead}
              onMarkAllAsRead={handleMarkAllAsRead}
              onDelete={handleDeleteNotification}
              onClearAll={handleClearAll}
              settings={currentUser?.notificationSettings}
              onSettingsChange={handleSettingsChange}
              onNotificationClick={handleNotificationClick}
            />
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-4 w-full">
          <SuperAdminDashboardContext.Provider value={{ currentUser }}>
            {children}
          </SuperAdminDashboardContext.Provider>
        </main>
      </div>
    </div>
  );
}
