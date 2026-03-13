"use client";

import { useContext, use } from "react";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import { SuperAdminDashboardContext } from "../layout";

const SuperAdminClientsTab = dynamic(() => import("@/components/super-admin/tabs/ClientsTab"), {
    loading: () => <div className="h-96 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
});
const SuperAdminTeamsTab = dynamic(() => import("@/components/super-admin/tabs/TeamsTab"), {
    loading: () => <div className="h-96 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
});
const SuperAdminAdminsTab = dynamic(() => import("@/components/super-admin/tabs/AdminsTab"), {
    loading: () => <div className="h-96 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
});
const SuperAdminTasksTab = dynamic(() => import("@/components/super-admin/tabs/TasksTab"), {
    loading: () => <div className="h-96 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
});
const SuperAdminWebsiteTab = dynamic(() => import("@/components/super-admin/tabs/WebsiteTab"), {
    loading: () => <div className="h-96 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
});
const SuperAdminSettingsTab = dynamic(() => import("@/components/super-admin/tabs/SettingsTab"), {
    loading: () => <div className="h-96 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
});
const SuperAdminResponsesTab = dynamic(() => import("@/components/super-admin/tabs/ResponsesTab"), {
    loading: () => <div className="h-96 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
});
const SuperAdminCouponsTab = dynamic(() => import("@/components/super-admin/tabs/CouponsTab"), {
    loading: () => <div className="h-96 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
});
const SuperAdminFilesTab = dynamic(() => import("@/components/super-admin/tabs/FilesTab"), {
    loading: () => <div className="h-96 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
});
const PriceCalculatorTab = dynamic(() => import("@/components/shared/PriceCalculatorTab"), {
    loading: () => <div className="h-96 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
});
const SuperAdminAnalyticsTab = dynamic(() => import("@/components/super-admin/tabs/AnalyticsTab"), {
    loading: () => <div className="h-96 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
});

export default function SuperAdminTabPage({ params }) {
    const { tab: tabName } = use(params);
    const { currentUser } = useContext(SuperAdminDashboardContext);

    if (tabName === "responses") return <SuperAdminResponsesTab />;
    if (tabName === "clients") return <SuperAdminClientsTab />;
    if (tabName === "teams") return <SuperAdminTeamsTab />;
    if (tabName === "admins") return <SuperAdminAdminsTab />;
    if (tabName === "tasks") return <SuperAdminTasksTab />;
    if (tabName === "files") return <SuperAdminFilesTab currentUser={currentUser} />;
    if (tabName === "website") return <SuperAdminWebsiteTab />;
    if (tabName === "coupons") return <SuperAdminCouponsTab />;
    if (tabName === "price-calculator") return <PriceCalculatorTab />;
    if (tabName === "analytics") return <SuperAdminAnalyticsTab />;
    if (tabName === "settings") return <SuperAdminSettingsTab />;

    return <div className="p-8 text-center text-muted-foreground">Tab not found</div>;
}
