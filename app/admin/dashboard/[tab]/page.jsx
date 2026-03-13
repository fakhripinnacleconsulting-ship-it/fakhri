"use client";

import { useContext, use } from "react";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import { AdminDashboardContext } from "../layout";
import { useSession } from "next-auth/react";

const AdminClientsTab = dynamic(() => import("@/components/admin/tabs/ClientsTab"), {
    loading: () => <div className="h-96 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
});
const AdminTasksTab = dynamic(() => import("@/components/admin/tabs/TasksTab"), {
    loading: () => <div className="h-96 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
});
const AdminFilesTab = dynamic(() => import("@/components/admin/tabs/FilesTab"), {
    loading: () => <div className="h-96 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
});
const AdminProfileTab = dynamic(() => import("@/components/admin/tabs/ProfileTab"), {
    loading: () => <div className="h-96 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
});
const PriceCalculatorTab = dynamic(() => import("@/components/shared/PriceCalculatorTab"), {
    loading: () => <div className="h-96 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
});
const AnalyticsTab = dynamic(() => import("@/components/super-admin/tabs/AnalyticsTab"), {
    loading: () => <div className="h-96 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
});

export default function AdminTabPage({ params }) {
    const { tab: tabName } = use(params);
    const { currentUser } = useContext(AdminDashboardContext);

    if (tabName === "clients") return <AdminClientsTab currentUser={currentUser} />;
    if (tabName === "tasks") return <AdminTasksTab currentUser={currentUser} />;
    if (tabName === "files") return <AdminFilesTab currentUser={currentUser} />;
    if (tabName === "price-calculator") return <PriceCalculatorTab />;
    if (tabName === "analytics") return <AnalyticsTab fixedEmail={currentUser?.email} />;
    if (tabName === "profile") return <AdminProfileTab currentUser={currentUser} />;

    return <div className="p-8 text-center text-muted-foreground">Tab not found</div>;
}
