"use client";
import { useState, useEffect } from "react";
import { Plus, Edit, Users, Trash2, Eye, X, Crown, Mail, Phone, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { getTeams, createTeam, updateTeam, deleteTeam } from "@/lib/actions/team";
import { getAdmins } from "@/lib/actions/admin";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { ScrollableContainer } from "@/components/ui/scrollable-container";
import DataPagination from "@/components/ui/DataPagination";

const SuperAdminTeamsTab = () => {
    const [teams, setTeams] = useState([]);
    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewingTeam, setViewingTeam] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingTeam, setEditingTeam] = useState(null);
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        leadId: "",
        memberIds: [],
        status: "active"
    });

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 9;

    const totalPages = Math.ceil(teams.length / itemsPerPage);
    const paginatedTeams = teams.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const loadData = async () => {
        setLoading(true);
        try {
            const [teamsData, adminsData] = await Promise.all([
                getTeams(),
                getAdmins()
            ]);

            if (teamsData) {
                const formattedTeams = teamsData.map(team => ({
                    ...team,
                    members: team.memberIds || [],
                    lead: team.leadId || { name: "N/A", email: "" },
                    clientCount: team.clientCount || 0
                }));
                setTeams(formattedTeams);
            }
            if (adminsData) {
                setAdmins(adminsData);
            }
        } catch (error) {
            console.error("Error loading data:", error);
            toast.error("Failed to load teams and admins");
            setTeams([]);
            setAdmins([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleOpenModal = (team = null) => {
        if (team) {
            setEditingTeam(team);
            setFormData({
                name: team.name,
                description: team.description || "",
                leadId: team.leadId?._id || team.leadId || "",
                memberIds: (team.memberIds || []).map(m => typeof m === 'object' ? m._id : m),
                status: team.status || "active"
            });
        } else {
            setEditingTeam(null);
            setFormData({
                name: "",
                description: "",
                leadId: "",
                memberIds: [],
                status: "active"
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name) {
            toast.error("Team name is required");
            return;
        }

        setIsSubmitting(true);
        try {
            if (editingTeam) {
                await updateTeam(editingTeam._id, formData);
                toast.success("Team updated successfully");
            } else {
                await createTeam(formData);
                toast.success("Team created successfully");
            }
            setIsModalOpen(false);
            loadData();
        } catch (error) {
            console.error("Error saving team:", error);
            toast.error(error.message || "Failed to save team");
        }
        setIsSubmitting(false);
    };

    const handleDelete = async (teamId) => {
        try {
            await deleteTeam(teamId);
            toast.success("Team deleted successfully");
            loadData();
        } catch (error) {
            console.error("Error deleting team:", error);
            toast.error("Failed to delete team");
        }
    };

    const toggleMember = (adminId) => {
        setFormData(prev => {
            const isMember = prev.memberIds.includes(adminId);
            if (isMember) {
                return { ...prev, memberIds: prev.memberIds.filter(id => id !== adminId) };
            } else {
                return { ...prev, memberIds: [...prev.memberIds, adminId] };
            }
        });
    };

    if (loading) {
        return (
            <div className="h-64 flex flex-col items-center justify-center">
                <Loader2 className="h-8 w-8 text-primary animate-spin mb-2" />
                <p className="text-muted-foreground">Loading teams...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="font-heading text-2xl font-bold mb-2">Teams</h1>
                    <p className="text-muted-foreground">Organize account managers into teams.</p>
                </div>
                <Button onClick={() => handleOpenModal()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Team
                </Button>
            </div>

            {/* Teams Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedTeams.length > 0 ? paginatedTeams.map((team) => (
                    <div key={team._id} className="bg-card rounded-xl border p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <Users className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <h3 className="font-heading font-semibold capitalize">{team.name}</h3>
                                    <p className="text-sm text-muted-foreground">
                                        {team.members.length} members • {team.clientCount} clients
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="mb-4">
                            <p className="text-xs text-muted-foreground mb-2">Team Lead</p>
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium text-primary uppercase">
                                    {team.lead?.name?.split(' ').map(n => n[0]).join('') || "N"}
                                </div>
                                <div>
                                    <p className="text-sm font-medium capitalize">{team.lead?.name || "Unassigned"}</p>
                                    <Badge variant="secondary" className="text-xs">{team.lead?.adminRole || "Lead"}</Badge>
                                </div>
                            </div>
                        </div>

                        <div className="mb-4">
                            <p className="text-xs text-muted-foreground mb-2">Members ({team.members.length})</p>
                            <div className="flex -space-x-2">
                                {team.members.length > 0 ? [...team.members]
                                    .sort((a, b) => {
                                        const leadId = team.leadId?._id || team.leadId;
                                        const aId = a._id || a;
                                        const bId = b._id || b;
                                        if (aId === leadId) return -1;
                                        if (bId === leadId) return 1;
                                        return 0;
                                    })
                                    .slice(0, 4).map((member, idx) => {
                                        const memberId = typeof member === 'string' ? member : (member._id || member.id);
                                        const memberName = typeof member === 'string' ? 'Member' : (member.name || 'Member');
                                        return (
                                            <div
                                                key={memberId || idx}
                                                className={`w-8 h-8 rounded-full border-2 border-card flex items-center justify-center text-xs font-medium uppercase ${memberId === (team.leadId?._id || team.leadId) ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"}`}
                                                title={memberId === (team.leadId?._id || team.leadId) ? `${memberName} (Leader)` : memberName}
                                            >
                                                {typeof member === 'object' && member.name
                                                    ? member.name.split(' ').map(n => n[0]).join('')
                                                    : "?"}
                                            </div>
                                        );
                                    }) : (
                                    <span className="text-xs text-muted-foreground italic">No members assigned</span>
                                )}
                                {team.members.length > 4 && (
                                    <div className="w-8 h-8 rounded-full bg-accent border-2 border-card flex items-center justify-center text-xs font-medium">
                                        +{team.members.length - 4}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-2 pt-4 border-t">
                            <Button
                                variant="outline"
                                size="sm"
                                className="flex-1"
                                onClick={() => setViewingTeam(team)}
                            >
                                <Eye className="h-4 w-4 mr-1" />
                                View
                            </Button>
                            <Button variant="outline" size="sm" className="flex-1" onClick={() => handleOpenModal(team)}>
                                <Edit className="h-4 w-4 mr-1" />
                                Edit
                            </Button>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="sm" className="text-destructive">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This action cannot be undone. This will permanently delete the team
                                            "{team.name}" and remove all member associations.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={() => handleDelete(team._id)}
                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        >
                                            Delete
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </div>
                )) : (
                    <div className="col-span-full py-20 text-center bg-card rounded-xl border">
                        <Users className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                        <h3 className="font-heading font-semibold">No teams found</h3>
                        <p className="text-sm text-muted-foreground">Get started by creating your first team.</p>
                    </div>
                )}
            </div>

            <DataPagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
            />

            {/* View Team Members Modal */}
            {viewingTeam && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-card rounded-xl border shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
                        {/* Modal Header */}
                        <div className="bg-gradient-to-r from-primary to-primary/80 text-white p-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center">
                                        <Users className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h2 className="font-heading text-xl font-bold capitalize">{viewingTeam.name}</h2>
                                        <p className="text-white/80 text-sm">{viewingTeam.members.length} members • {viewingTeam.clientCount} clients</p>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-white hover:bg-white/20"
                                    onClick={() => setViewingTeam(null)}
                                >
                                    <X className="h-5 w-5" />
                                </Button>
                            </div>
                        </div>

                        {/* Modal Content */}
                        <ScrollableContainer className="p-6" maxHeight="50vh">
                            <h3 className="font-heading font-semibold mb-4">Team Members</h3>
                            <div className="space-y-3">
                                {viewingTeam.members.length > 0 ? (
                                    [...viewingTeam.members]
                                        .sort((a, b) => {
                                            const leadId = viewingTeam.lead?._id || viewingTeam.leadId?._id || viewingTeam.leadId;
                                            const aId = a._id || a;
                                            const bId = b._id || b;
                                            if (aId === leadId) return -1;
                                            if (bId === leadId) return 1;
                                            return 0;
                                        })
                                        .map((member, idx) => (
                                            <div
                                                key={typeof member === 'string' ? member : (member._id || idx)}
                                                className={`flex items-center justify-between p-4 rounded-lg border ${member._id === viewingTeam.lead?._id ? 'bg-primary/5 border-primary/20 shadow-sm ring-1 ring-primary/10' : 'bg-accent/30'}`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium uppercase border border-primary/20">
                                                        {member.name?.split(' ').map(n => n[0]).join('') || "?"}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <p className="font-medium capitalize">{member.name}</p>
                                                            {member._id === viewingTeam.lead?._id && (
                                                                <Badge className="bg-primary text-primary-foreground text-[10px] px-1.5 h-5">
                                                                    <Crown className="h-3 w-3 mr-1" />
                                                                    Team Lead
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <Badge variant="outline" className="mt-1 text-[10px] h-5">{member.adminRole || "Member"}</Badge>
                                                    </div>
                                                </div>
                                                <div className="text-right text-sm">
                                                    <div className="flex items-center gap-1 text-muted-foreground mb-1">
                                                        <Mail className="h-3 w-3" />
                                                        <span className="text-xs">{member.email}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                ) : (
                                    <p className="text-muted-foreground text-center py-10 italic">No members found in this team.</p>
                                )}
                            </div>
                        </ScrollableContainer>

                        {/* Modal Footer */}
                        <div className="p-4 border-t flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setViewingTeam(null)}>
                                Close
                            </Button>
                            <Button onClick={() => {
                                const teamToEdit = viewingTeam;
                                setViewingTeam(null);
                                handleOpenModal(teamToEdit);
                            }}>
                                <Edit className="h-4 w-4 mr-1" />
                                Edit Team
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create/Edit Team Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[500px] max-h-[85vh] flex flex-col p-0 gap-0">
                    <DialogHeader className="p-6 pb-2">
                        <DialogTitle>{editingTeam ? "Edit Team" : "Create New Team"}</DialogTitle>
                        <DialogDescription>
                            Organize your managers into a team for better management.
                        </DialogDescription>
                    </DialogHeader>
                    <ScrollableContainer className="flex-1 p-6 pt-2">
                        <form id="team-form" onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Team Name</Label>
                                <Input
                                    id="name"
                                    placeholder="Sales East, Support Team, etc."
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Description (Optional)</Label>
                                <Textarea
                                    id="description"
                                    placeholder="Brief description of the team's purpose..."
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Team Lead</Label>
                                <Select
                                    value={formData.leadId}
                                    onValueChange={(value) => setFormData({ ...formData, leadId: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a team lead" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {admins.map((admin) => (
                                            <SelectItem key={admin._id} value={admin._id}>
                                                {admin.name} ({admin.email})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Team Members</Label>
                                <div className="grid grid-cols-1 gap-2 border rounded-lg p-3 max-h-48 overflow-y-auto bg-accent/10">
                                    {admins.map((admin) => (
                                        <div key={admin._id} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`member-${admin._id}`}
                                                checked={formData.memberIds.includes(admin._id)}
                                                onCheckedChange={() => toggleMember(admin._id)}
                                            />
                                            <label
                                                htmlFor={`member-${admin._id}`}
                                                className="text-sm font-medium leading-none peer-disabled:cursor-default peer-disabled:opacity-70"
                                            >
                                                {admin.name}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {formData.memberIds.length} members selected
                                </p>
                            </div>
                            <div className="space-y-2">
                                <Label>Status</Label>
                                <Select
                                    value={formData.status}
                                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="inactive">Inactive</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </form>
                    </ScrollableContainer>
                    <DialogFooter className="p-6 pt-2 border-t">
                        <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" form="team-form" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {editingTeam ? "Save Changes" : "Create Team"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default SuperAdminTeamsTab;
