"use client";

import { useContext, use } from "react";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import { ClientDashboardContext } from "../layout";

const TabSkeleton = () => (
    <div className="space-y-4 animate-pulse">
        <div className="h-40 bg-muted/40 rounded-xl w-full" />
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-32 bg-muted/40 rounded-xl" />
            ))}
        </div>
        <div className="h-96 bg-muted/40 rounded-xl w-full" />
    </div>
);

const ClientPlanTab = dynamic(() => import("@/components/client/tabs/PlanTab"), {
    loading: () => <TabSkeleton />,
});
const ClientTasksTab = dynamic(() => import("@/components/client/tabs/TasksTab"), {
    loading: () => <TabSkeleton />,
});
const ClientFilesTab = dynamic(() => import("@/components/client/tabs/FilesTab"), {
    loading: () => <TabSkeleton />,
});
const ClientBillingTab = dynamic(() => import("@/components/client/tabs/BillingTab"), {
    loading: () => <TabSkeleton />,
});
const ClientProfileTab = dynamic(() => import("@/components/client/tabs/ProfileTab"), {
    loading: () => <TabSkeleton />,
});
const ClientSupportTab = dynamic(() => import("@/components/client/tabs/SupportTab"), {
    loading: () => <TabSkeleton />,
});


export default function ClientTabPage({ params }) {
    const { tab: tabName } = use(params);
    const { user, managerPhone, managerName } = useContext(ClientDashboardContext);

    if (tabName === "plan") return <ClientPlanTab currentUser={user} managerPhone={managerPhone} managerName={managerName} />;
    if (tabName === "tasks") return <ClientTasksTab currentUser={user} />;
    if (tabName === "files") return <ClientFilesTab currentUser={user} />;
    if (tabName === "billing") return <ClientBillingTab currentUser={user} />;
    if (tabName === "support") return <ClientSupportTab currentUser={user} />;
    if (tabName === "profile") return <ClientProfileTab currentUser={user} />;

    return <div className="p-8 text-center text-muted-foreground">Tab not found</div>;
}
