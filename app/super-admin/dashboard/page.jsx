"use client";

import { useContext } from "react";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import SuperAdminDashboardTab from "@/components/super-admin/tabs/DashboardTab";
import { SuperAdminDashboardContext } from "./layout";

export default function SuperAdminDashboardRootPage() {
    const { currentUser } = useContext(SuperAdminDashboardContext);

    // We don't have setActiveTab anymore since we route natively, but we can pass a dummy or router callback if strictly needed
    return <SuperAdminDashboardTab currentUser={currentUser} />;
}
