"use client";

import { useContext } from "react";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import AdminDashboardTab from "@/components/admin/tabs/DashboardTab";
import { AdminDashboardContext } from "./layout";

export default function AdminDashboardRootPage() {
    const { currentUser } = useContext(AdminDashboardContext);

    return <AdminDashboardTab currentUser={currentUser} />;
}
