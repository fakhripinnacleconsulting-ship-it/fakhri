"use client";
import { useState, useEffect } from "react";
import { Mail, Phone, Building, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getClients, getTasks } from "@/lib/actions/admin";
import { submitProfileUpdateRequest, getPendingRequestForUser } from "@/lib/actions/profile-requests";
import { toast } from "sonner";
import { Edit, Save, X, MapPin } from "lucide-react";

const AdminProfileTab = ({ currentUser }) => {
    const [admin, setAdmin] = useState(null);
    const [clientCount, setClientCount] = useState(0);
    const [activeTasksCount, setActiveTasksCount] = useState(0);
    const [completedTasksCount, setCompletedTasksCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({});
    const [pendingRequest, setPendingRequest] = useState(null);

    useEffect(() => {
        async function loadProfile() {
            if (!currentUser) {
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                const [clientsRes, tasks, pReq] = await Promise.all([
                    getClients({ managerId: currentUser._id }),
                    getTasks({ 'assignee.id': currentUser._id }),
                    // Fetch pending request with timestamp to bypass cache if needed
                    getPendingRequestForUser(currentUser._id)
                ]);

                setAdmin(currentUser);
                setFormData({
                    name: currentUser.name || "",
                    phone: currentUser.phone || "",
                    location: currentUser.location || "",
                    company: currentUser.company || ""
                });
                setPendingRequest(pReq);
                setClientCount(clientsRes.clients?.length || 0);

                // Tasks are already filtered by API
                setActiveTasksCount(tasks.filter(t => ["in-progress", "In Progress"].includes(t.status)).length);
                setCompletedTasksCount(tasks.filter(t => ["completed", "Completed"].includes(t.status)).length);
            } catch (error) {
                console.error("Failed to load profile data", error);
            } finally {
                setLoading(false);
            }
        }
        loadProfile();
    }, [currentUser]);

    const handleSave = async () => {
        try {
            const res = await submitProfileUpdateRequest(admin._id, formData);
            if (res.success) {
                setIsEditing(false);
                toast.success("Profile update request sent to super admin");
                // Force a delay to allow DB consistency before checking
                setTimeout(async () => {
                    const pReq = await getPendingRequestForUser(admin._id);
                    setPendingRequest(pReq);
                }, 1000);
            } else {
                toast.error("Failed to send update request: " + res.error);
            }
        } catch (error) {
            console.error(error);
            toast.error("An error occurred");
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        setFormData({
            name: admin.name || "",
            phone: admin.phone || "",
            location: admin.location || "",
            company: admin.company || ""
        });
    };

    if (loading) {
        return <div className="flex justify-center p-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
    }

    if (!admin) {
        return <div className="p-6 text-center text-muted-foreground">User information not available.</div>;
    }

    const initials = admin.name ? admin.name.split(" ").map(n => n[0]).join("") : "A";
    const joinedDate = admin.joinedDate
        ? new Date(admin.joinedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
        : 'N/A';

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="font-heading text-2xl font-bold mb-2">Profile</h1>
                    <p className="text-muted-foreground">Manage your account settings.</p>
                </div>
                {!isEditing && (
                    <Button onClick={() => setIsEditing(true)} disabled={!!pendingRequest}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Profile
                    </Button>
                )}
            </div>

            {pendingRequest && (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-center gap-3 text-amber-800 animate-in fade-in slide-in-from-top-2">
                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 text-amber-600 font-bold italic">
                        !
                    </div>
                    <div>
                        <p className="font-medium">Pending Update Request</p>
                        <p className="text-sm opacity-90">An update request for your profile is currently pending super-admin approval. You cannot make further changes until it is processed.</p>
                    </div>
                </div>
            )}

            {/* Profile Card */}
            <div className="bg-card rounded-xl border overflow-hidden">
                <div className="bg-gradient-primary p-6 text-white">
                    <div className="flex items-center gap-4">
                        <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-3xl font-heading font-bold">
                            {initials}
                        </div>
                        <div>
                            <h2 className="text-xl font-heading font-bold capitalize">{admin.name}</h2>
                            <p className="text-white/80 capitalize">{admin.adminRole || 'Account Manager'}</p>
                            <p className="text-sm text-white/60">Team Member since {joinedDate}</p>
                        </div>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input
                                id="name"
                                value={isEditing ? formData.name : (admin.name || "")}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                readOnly={!isEditing}
                                className={!isEditing ? "bg-accent/50" : ""}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input id="email" value={admin.email || ''} readOnly className="pl-10 bg-accent/50" />
                            </div>
                            <p className="text-xs text-muted-foreground">Email cannot be changed directly.</p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone</Label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="phone"
                                    value={isEditing ? formData.phone : (admin.phone || "")}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    readOnly={!isEditing}
                                    className={`pl-10 ${!isEditing ? "bg-accent/50" : ""}`}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="location">Location</Label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="location"
                                    value={isEditing ? formData.location : (admin.location || "N/A")}
                                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                                    readOnly={!isEditing}
                                    className={`pl-10 ${!isEditing ? "bg-accent/50" : ""}`}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="role">Role</Label>
                            <div className="relative">
                                <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input id="role" value={admin.adminRole || 'Account Manager'} readOnly className="pl-10 bg-accent/50" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="clients">Assigned Clients</Label>
                            <Input id="clients" value={`${clientCount} clients`} readOnly className="bg-accent/50" />
                        </div>
                    </div>

                    {isEditing && (
                        <div className="pt-4 border-t flex justify-end gap-2">
                            <Button variant="outline" onClick={handleCancel}>
                                <X className="h-4 w-4 mr-2" />
                                Cancel
                            </Button>
                            <Button onClick={handleSave}>
                                <Save className="h-4 w-4 mr-2" />
                                Save Changes
                            </Button>
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
};

export default AdminProfileTab;
