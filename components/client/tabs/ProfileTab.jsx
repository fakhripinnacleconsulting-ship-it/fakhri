"use client";

import { useState, useEffect } from "react";
import { Mail, Phone, Building, MapPin, Loader2, Edit, Save, X, Shield, CalendarDays, Crown, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { getUsers, getUserById } from "@/lib/actions/user";
import { submitProfileUpdateRequest, getPendingRequestForUser } from "@/lib/actions/profile-requests";
import { getPricingPlans } from "@/lib/actions/services/content.service";
import { toast } from "sonner";

const calculatePeriodDays = (period) => {
    const p = period?.toLowerCase() || "";
    if (p.includes('month')) return 28;
    if (p.includes('year')) return 365;
    if (p.includes('quarter')) return 90;
    return 30; // default
};

const ClientProfileTab = ({ currentUser }) => {
    const [loading, setLoading] = useState(true);
    const [client, setClient] = useState(null);
    const [manager, setManager] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({});
    const [pendingRequest, setPendingRequest] = useState(null);
    const [isPlanExpired, setIsPlanExpired] = useState(false);

    useEffect(() => {
        const loadProfileData = async () => {
            if (!currentUser) {
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                setClient(currentUser);
                setFormData({
                    name: currentUser.name || "",
                    phone: currentUser.phone || "",
                    company: currentUser.company || "",
                    location: currentUser.location || "",
                    gstNo: currentUser.gstNo || "",
                });

                if (currentUser.managerId) {
                    const managerData = await getUserById(currentUser.managerId);
                    setManager(managerData);
                } else if (currentUser.manager) {
                    setManager(typeof currentUser.manager === 'object' ? currentUser.manager : { name: currentUser.manager });
                }

                // Check for pending requests
                const pReq = await getPendingRequestForUser(currentUser._id);
                setPendingRequest(pReq);

                // Check for plan expiry
                if (currentUser.plan && currentUser.plan.toLowerCase() !== "none") {
                    const allPlans = await getPricingPlans();
                    const currentPlan = allPlans.find(p =>
                        p.name?.toLowerCase() === currentUser.plan?.toLowerCase() ||
                        p.planId?.toLowerCase() === currentUser.plan?.toLowerCase()
                    );

                    const purchaseDate = currentUser.joinedDate ? new Date(currentUser.joinedDate) : new Date(currentUser.createdAt);
                    const planDays = calculatePeriodDays(currentPlan?.period || "month");
                    const expiryDate = new Date(purchaseDate);
                    expiryDate.setDate(expiryDate.getDate() + planDays);

                    if (new Date() > expiryDate) {
                        setIsPlanExpired(true);
                    }
                }
            } catch (error) {
                console.error("Error loading profile data:", error);
            } finally {
                setLoading(false);
            }
        };

        loadProfileData();
    }, [currentUser]);

    const handleSave = async () => {
        // Validation for GST
        const gst = (formData.gstNo || "").trim().toUpperCase();
        if (gst && gst !== "NA" && gst.length !== 15) {
            toast.error("GST Number must be exactly 15 characters, or 'NA'");
            return;
        }

        const finalFormData = {
            ...formData,
            gstNo: gst || "NA"
        };

        try {
            const res = await submitProfileUpdateRequest(client._id, finalFormData);
            if (res.success) {
                setIsEditing(false);
                toast.success("Profile update request sent to admin");
                // Force delay for consistency
                setTimeout(async () => {
                    const pReq = await getPendingRequestForUser(client._id);
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
            name: client.name || "",
            phone: client.phone || "",
            company: client.company || "",
            location: client.location || "",
            gstNo: client.gstNo || ""
        });
    };

    // Format the manager phone for display
    const formatPhone = (phone) => {
        if (!phone) return null;
        const cleaned = phone.replace(/[^0-9]/g, '');
        if (cleaned.length === 10) return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
        if (cleaned.length > 10) return `+${cleaned.slice(0, cleaned.length - 10)} ${cleaned.slice(-10, -5)} ${cleaned.slice(-5)}`;
        return phone;
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground animate-pulse">Loading profile...</p>
            </div>
        );
    }

    if (!client) {
        return (
            <div className="bg-card rounded-xl border p-12 text-center">
                <h2 className="text-xl font-semibold mb-2">Account Not Found</h2>
                <p className="text-muted-foreground">We couldn't load your profile details. Please contact support.</p>
            </div>
        );
    }

    const initials = client.name?.split(" ").map(n => n[0]).join("") || "CL";
    const managerInitials = manager?.name?.split(" ").map(n => n[0]).join("") || "SM";

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="font-heading text-2xl font-bold mb-1">Profile</h1>
                    <p className="text-muted-foreground text-sm">Manage your account settings and preferences.</p>
                </div>
                {!isEditing && (
                    <Button onClick={() => setIsEditing(true)} disabled={!!pendingRequest} size="sm">
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
                        <p className="text-sm opacity-90">An update request for your profile is currently pending admin approval. You cannot make further changes until it is processed.</p>
                    </div>
                </div>
            )}

            {/* Profile Card */}
            <div className="bg-card rounded-2xl border overflow-hidden shadow-sm">
                <div className="bg-gradient-primary p-6 text-white relative overflow-hidden">
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-3xl font-heading font-bold border border-white/20">
                            {initials}
                        </div>
                        <div>
                            <h2 className="text-xl font-heading font-bold capitalize">{client.name}</h2>
                            <div className="flex items-center gap-2 mt-1">
                                {client.plan && client.plan.toLowerCase() !== "none" && !isPlanExpired ? (
                                    <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30">
                                        <Crown className="w-3 h-3 mr-1" />
                                        <span className="capitalize">{client.plan} Plan</span>
                                    </Badge>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <span className="text-white/70">Community Member</span>
                                        {isPlanExpired && (
                                            <Badge variant="outline" className="text-[10px] bg-red-500/20 text-red-100 border-red-500/30 py-0 h-4">
                                                Plan Expired
                                            </Badge>
                                        )}
                                    </div>
                                )}
                            </div>
                            <p className="text-sm text-white/60 mt-1 flex items-center gap-1">
                                <CalendarDays className="h-3 w-3" />
                                Member since {new Date(client.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                            </p>
                        </div>
                    </div>
                    {/* Decorative bg */}
                    <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-white/5 rounded-full blur-2xl" />
                </div>

                <div className="p-6 space-y-6">
                    <div className="grid md:grid-cols-2 gap-5">
                        <div className="space-y-1.5">
                            <Label htmlFor="name" className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Full Name</Label>
                            <Input
                                id="name"
                                value={isEditing ? formData.name : (client.name || "")}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                readOnly={!isEditing}
                                className={!isEditing ? "bg-accent/50 capitalize" : ""}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="email" className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Email</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input id="email" value={client.email || ""} readOnly className="pl-10 bg-accent/50" />
                            </div>
                            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                                <Shield className="h-3 w-3" />
                                Email cannot be changed directly.
                            </p>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="phone" className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Phone</Label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="phone"
                                    value={isEditing ? formData.phone : (client.phone || "N/A")}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    readOnly={!isEditing}
                                    className={`pl-10 ${!isEditing ? "bg-accent/50" : ""}`}
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="company" className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Company</Label>
                            <div className="relative">
                                <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="company"
                                    value={isEditing ? formData.company : (client.company || "N/A")}
                                    onChange={e => setFormData({ ...formData, company: e.target.value })}
                                    readOnly={!isEditing}
                                    className={`pl-10 ${!isEditing ? "bg-accent/50" : ""}`}
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="location" className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Location</Label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="location"
                                    value={isEditing ? formData.location : (client.location || "N/A")}
                                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                                    readOnly={!isEditing}
                                    className={`pl-10 ${!isEditing ? "bg-accent/50" : ""}`}
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="gstNo" className="text-xs uppercase tracking-wider text-muted-foreground font-medium">GST Number</Label>
                            <div className="relative">
                                <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="gstNo"
                                    value={isEditing ? formData.gstNo : (client.gstNo || "NA")}
                                    onChange={e => {
                                        const val = e.target.value.toUpperCase();
                                        if (val.length <= 15) {
                                            setFormData({ ...formData, gstNo: val });
                                        }
                                    }}
                                    readOnly={!isEditing}
                                    className={`pl-10 uppercase ${!isEditing ? "bg-accent/50" : ""}`}
                                    placeholder="22AAAAA0000A1Z5 or NA"
                                />
                            </div>
                            {isEditing && (
                                <p className="text-[10px] text-muted-foreground">
                                    Must be exactly 15 characters for a valid GST, or "NA" if not available.
                                </p>
                            )}
                        </div>
                    </div>

                    {isEditing && (
                        <div className="pt-4 border-t flex justify-end gap-2">
                            <Button variant="outline" onClick={handleCancel} size="sm">
                                <X className="h-4 w-4 mr-2" />
                                Cancel
                            </Button>
                            <Button onClick={handleSave} size="sm">
                                <Save className="h-4 w-4 mr-2" />
                                Save Changes
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Account Manager Contact */}
            <div className="bg-card rounded-2xl border p-6 shadow-sm">
                <h3 className="font-heading font-semibold mb-4 flex items-center gap-2">
                    <div className="w-1.5 h-5 rounded-full bg-primary" />
                    Your Account Manager (POC)
                </h3>
                {manager ? (
                    <div className="p-4 rounded-xl bg-accent/30 border border-accent">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary font-heading font-bold text-lg border border-primary/10">
                                {managerInitials}
                            </div>
                            <div className="flex-1">
                                <p className="font-semibold capitalize text-base">{manager.name}</p>
                                <p className="text-sm text-muted-foreground capitalize">{manager.adminRole || manager.role || "Account Manager"}</p>
                            </div>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-3">
                            <a href={`mailto:${manager.email}`} className="flex items-center gap-3 p-3 rounded-lg bg-card border hover:shadow-sm transition-all group">
                                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                    <Mail className="h-4 w-4 text-primary" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Email</p>
                                    <p className="text-sm font-medium truncate">{manager.email}</p>
                                </div>
                            </a>
                            {manager.phone ? (
                                <a href={`tel:${manager.phone}`} className="flex items-center gap-3 p-3 rounded-lg bg-card border hover:shadow-sm transition-all group">
                                    <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                                        <Phone className="h-4 w-4 text-emerald-600" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Mobile</p>
                                        <p className="text-sm font-medium">{formatPhone(manager.phone)}</p>
                                    </div>
                                </a>
                            ) : (
                                <div className="flex items-center gap-3 p-3 rounded-lg bg-card border opacity-60">
                                    <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
                                        <Phone className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Mobile</p>
                                        <p className="text-sm text-muted-foreground">Not available</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="p-6 rounded-xl bg-accent/30 text-muted-foreground text-center border border-dashed border-accent">
                        <UserIcon className="h-8 w-8 mx-auto mb-2 opacity-30" />
                        <p className="font-medium">No account manager assigned</p>
                        <p className="text-sm opacity-70 mt-1">Contact support for assistance.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ClientProfileTab;
