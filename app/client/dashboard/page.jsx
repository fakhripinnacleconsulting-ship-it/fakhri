"use client";

import { useContext } from "react";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import { ClientDashboardContext } from "./layout";

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

const ClientDashboardTab = dynamic(() => import("@/components/client/tabs/DashboardTab"), {
    loading: () => <TabSkeleton />,
});

export default function ClientDashboardRootPage() {
    const { user } = useContext(ClientDashboardContext);

    return <ClientDashboardTab currentUser={user} />;
}
