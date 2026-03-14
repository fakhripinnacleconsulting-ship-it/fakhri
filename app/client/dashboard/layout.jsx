"use client";

import { useState, useEffect, useCallback, useRef, Suspense, createContext } from "react";
import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { LayoutDashboard, CreditCard, CheckSquare, FileText, Receipt, User, Menu, X, LogOut, HelpCircle, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import Logo from "@/components/ui/Logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import WhatsAppButton from "@/components/client/WhatsAppButton";
import CartDropdown from "@/components/client/CartDropdown";
import NotificationDropdown from "@/components/ui/NotificationDropdown";
import { markNotificationAsRead, markAllNotificationsAsRead, deleteNotification, clearAllNotifications } from "@/lib/actions/notification";
import { getUsers, getUserByEmail, getUserById, updateUser } from "@/lib/actions/user";
import useNotifications from "@/hooks/useNotifications";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import ProfileCompletionDialog from "@/components/ui/ProfileCompletionDialog";
import NotificationSetupDialog from "@/components/ui/NotificationSetupDialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import dynamic from "next/dynamic";
import { signOut, useSession } from "next-auth/react";

export const ClientDashboardContext = createContext();

const navigation = [
  { name: "Dashboard", id: "Dashboard", href: "/client/dashboard", icon: LayoutDashboard },
  { name: "My Plan", id: "Plan", href: "/client/dashboard/plan", icon: CreditCard },
  { name: "Tasks", id: "Tasks", href: "/client/dashboard/tasks", icon: CheckSquare },
  { name: "Files", id: "Files", href: "/client/dashboard/files", icon: FileText },
  { name: "Billing", id: "Billing", href: "/client/dashboard/billing", icon: Receipt },
  { name: "Support", id: "Support", href: "/client/dashboard/support", icon: HelpCircle },
  { name: "Profile", id: "Profile", href: "/client/dashboard/profile", icon: User },
];

function ClientDashboardContent({ children }) {
  const { data: session, status: sessionStatus } = useSession();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const activeTabObj = navigation.find(n => n.href === pathname) || navigation[0];
  const activeTab = activeTabObj.id;
  const [user, setUser] = useState(null);
  const { notifications, setNotifications } = useNotifications(user?._id);
  const { subscribeUser, unsubscribeUser, isSupported, permission } = usePushNotifications(user?._id);
  const [managerPhone, setManagerPhone] = useState("");
  const [managerName, setManagerName] = useState("");
  const [showProfileCompletion, setShowProfileCompletion] = useState(false);
  const [showNotificationSetup, setShowNotificationSetup] = useState(false);
  const loadedForEmailRef = useRef(null);

  const userEmail = session?.user?.email;

  useEffect(() => {
    // Only load once per unique email; skip if already loaded for this email
    if (!userEmail || loadedForEmailRef.current === userEmail) return;
    loadedForEmailRef.current = userEmail;

    const loadInitialData = async () => {
      setLoading(true);
      try {
        // Fetch actual logged in client
        let currentUser = await getUserByEmail(userEmail);

        if (currentUser) {
          setUser(currentUser);

          // Check for profile completion
          const requiredFields = ["name", "email", "phone", "company", "location", "gstNo"];
          const isComplete = requiredFields.every(field => currentUser[field] && currentUser[field].trim() !== "");
          if (!isComplete) {
            setShowProfileCompletion(true);
          } else if (!currentUser.notificationSettingsConfigured) {
            setShowNotificationSetup(true);
          }

          // Fetch the client's manager (admin) phone number for WhatsApp
          if (currentUser.managerId) {
            try {
              const managerUser = await getUserById(currentUser.managerId);
              if (managerUser) {
                if (managerUser.name) {
                  setManagerName(managerUser.name);
                }
                if (managerUser.phone) {
                  // Ensure the phone number has country code (default India +91)
                  const phone = managerUser.phone.replace(/[^0-9]/g, '');
                  setManagerPhone(phone);
                }
              }
            } catch (err) {
              console.error('Error fetching manager phone:', err);
            }
          }
        }
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [userEmail]);

  // Push Notification Prompt Prompt
  // Replaced by NotificationSetupDialog


  // Sync tab with URL hash
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.substring(1);
      if (hash) {
        const validTab = navigation.find(n =>
          n.id === hash ||
          n.id.toLowerCase() === hash.toLowerCase() ||
          n.name.toLowerCase() === hash.toLowerCase()
        );
        if (validTab) {
          router.push(validTab.href);
        }
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Handle checkout redirect (can probably redirect instead of setActiveTab now)
  // We'll leave it out since it's hard to dynamically switch route in layout without useEffect router.push
  // But wait, it's safe to just drop or convert to router.push
  // We will let the Billing tab handle order success UI directly via query param

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
    if (!user) return;
    try {
      await markAllNotificationsAsRead(user._id);
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
    if (!user) return;
    try {
      await clearAllNotifications(user._id);
      setNotifications([]);
    } catch (error) {
      console.error("Error clearing all notifications:", error);
    }
  };

  const handleSettingsChange = async (newSettings) => {
    if (!user) return;
    try {
      const oldPushEnabled = user.notificationSettings?.pushNotifications;
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

      setUser(prev => ({ ...prev, notificationSettings: finalSettings }));
      await updateUser(user._id, { notificationSettings: finalSettings });
    } catch (error) {
      console.error("Error updating notification settings:", error);
    }
  };

  // Navigate to the relevant tab when a notification is clicked
  const handleNotificationClick = (notification) => {
    let targetTab = null;

    // Parse link hash (e.g., #Tasks -> Tasks)
    if (notification.link && notification.link.startsWith('#')) {
      targetTab = notification.link.substring(1);
    }

    // Fallback: map notification type to tab
    if (!targetTab) {
      const typeToTab = {
        task: 'Tasks',
        invoice: 'Billing',
        info: 'Dashboard',
        success: 'Dashboard',
        warning: 'Dashboard',
        error: 'Dashboard',
      };
      targetTab = typeToTab[notification.type] || 'Dashboard';
    }

    // Validate the tab exists in navigation
    const validTab = navigation.find(n => n.id === targetTab);
    if (validTab) {
      router.push(validTab.href);
    }
  };

  const handleProfileComplete = (updatedUser) => {
    setUser(updatedUser);
    setShowProfileCompletion(false);

    // After profile is complete, show the setup dialog if notifications are not configured yet
    if (!updatedUser.notificationSettingsConfigured) {
      setShowNotificationSetup(true);
    }
  };

  const handleNotificationSetupComplete = (updatedUser) => {
    setUser(updatedUser);
    setShowNotificationSetup(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse font-medium">Loading Dashboard...</p>
      </div>
    );
  }

  const userInitials = user?.name?.split(" ").map(n => n[0]).join("") || "CL";

  return (
    <div className="min-h-screen bg-[#F4F4F5]">
      {/* Profile Completion Dialog */}
      <ProfileCompletionDialog
        user={user}
        open={showProfileCompletion}
        onComplete={handleProfileComplete}
      />

      {/* Mobile Sidebar Overlay */}
      <NotificationSetupDialog
        user={user}
        open={showNotificationSetup}
        onComplete={handleNotificationSetupComplete}
        onSettingsChange={handleSettingsChange}
      />
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar - Fixed on desktop */}
      <aside
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          "fixed inset-y-0 left-0 z-50 bg-sidebar text-sidebar-foreground border-r border-sidebar-border transform sidebar-transition ease-in-out",
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
          <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border overflow-hidden shrink-0">
            <div className="flex items-center gap-2 min-w-max">
              <Logo variant="white" hideText={sidebarCollapsed} useImage={true} />
              {(!sidebarCollapsed) && (
                <Badge variant="outline" className="text-xs border-white/20 text-sidebar-foreground">Client</Badge>
              )}
            </div>
            <button className="lg:hidden text-sidebar-foreground" onClick={() => setSidebarOpen(false)}>
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
          <div className="p-4 border-t border-sidebar-border shrink-0 bg-sidebar/50">
            <div className="flex items-center gap-3 mb-4 overflow-hidden min-w-max">
              <div className="w-10 h-10 rounded-xl bg-white text-black flex items-center justify-center font-bold shrink-0 transition-all duration-300">
                {userInitials}
              </div>
              <div className={cn(
                "flex-1 min-w-0 text-white transition-all duration-300",
                (!sidebarCollapsed) ? "opacity-100 w-auto" : "opacity-0 w-0"
              )}>
                <p className="text-sm font-bold truncate capitalize">{user?.name || session?.user?.name || "Client"}</p>
                <p className="text-[10px] text-sidebar-foreground/60 truncate mb-1">{user?.email || session?.user?.email}</p>
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  <p className="text-[10px] text-primary font-bold uppercase tracking-wider">{user?.plan && user.plan !== "None" ? `${user.plan} Plan` : "No Active Plan"}</p>
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
          <button
            className="lg:hidden p-2"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="hidden lg:block">
            <h1 className="text-lg font-heading font-semibold">
              {navigation.find(n => n.id === activeTab)?.name || "Dashboard"}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Cart Dropdown */}
            <CartDropdown />

            <NotificationDropdown
              notifications={notifications}
              onMarkAsRead={handleMarkAsRead}
              onMarkAllAsRead={handleMarkAllAsRead}
              onDelete={handleDeleteNotification}
              onClearAll={handleClearAll}
              settings={user?.notificationSettings}
              onSettingsChange={handleSettingsChange}
              onNotificationClick={handleNotificationClick}
            />
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6">
          <ClientDashboardContext.Provider value={{ user, managerPhone, managerName }}>
            {children}
          </ClientDashboardContext.Provider>
        </main>
      </div>

      {/* Floating WhatsApp Button */}
      {managerPhone && (
        <WhatsAppButton
          phoneNumber={managerPhone}
          message={`Hi ${managerName || 'there'}! This is ${user?.name || 'your client'}. I need assistance with my account.`}
        />
      )}
    </div>
  );
}

export default function ClientDashboardLayout({ children }) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse font-medium">Loading Dashboard...</p>
      </div>
    }>
      <ClientDashboardContent>{children}</ClientDashboardContent>
    </Suspense>
  );
}
