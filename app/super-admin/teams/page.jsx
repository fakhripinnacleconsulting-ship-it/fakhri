"use client";

import { useState, useEffect } from "react";
import { Plus, Edit, Users, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getTeams } from "@/lib/actions/team";

const SuperAdminTeams = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTeams = async () => {
      setLoading(true);
      try {
        const data = await getTeams();
        setTeams(data || []);
      } catch (error) {
        console.error("Error loading teams:", error);
      } finally {
        setLoading(false);
      }
    };
    loadTeams();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">Loading teams...</p>
      </div>
    );
  }

  return (<div className="space-y-6">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="font-heading text-2xl font-bold mb-2">Teams</h1>
        <p className="text-muted-foreground">Organize account managers into teams.</p>
      </div>
      <Button>
        <Plus className="h-4 w-4 mr-2" />
        Create Team
      </Button>
    </div>

    {/* Teams Grid */}
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {teams.length > 0 ? teams.map((team) => (<div key={team._id} className="bg-card rounded-xl border p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-heading font-semibold">{team.name}</h3>
              <p className="text-sm text-muted-foreground">{team.clientCount || 0} clients</p>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <p className="text-xs text-muted-foreground mb-2">Team Lead</p>
          <Badge variant="secondary">{team.leadId?.name || team.lead || "Unassigned"}</Badge>
        </div>

        <div className="mb-4">
          <p className="text-xs text-muted-foreground mb-2">Members ({team.memberIds?.length || 0})</p>
          <div className="flex flex-wrap gap-2">
            {(team.memberIds || []).slice(0, 5).map((member) => (
              <div key={member._id || member} className="flex items-center gap-2 px-2 py-1 rounded bg-accent text-sm">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium text-primary">
                  {member.name?.split(' ').map(n => n[0]).join('') || member[0] || "M"}
                </div>
                {member.name || "Member"}
              </div>
            ))}
            {team.memberIds?.length > 5 && (
              <div className="text-xs text-muted-foreground px-2 py-1">+{team.memberIds.length - 5} more</div>
            )}
          </div>
        </div>

        <div className="flex gap-2 pt-4 border-t">
          <Button variant="outline" size="sm" className="flex-1">
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
          <Button variant="ghost" size="sm" className="text-destructive">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>)) : (
        <div className="col-span-full py-20 text-center bg-card rounded-xl border">
          <Users className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-heading font-semibold">No teams found</h3>
          <p className="text-sm text-muted-foreground">Get started by creating your first team.</p>
        </div>
      )}
    </div>
  </div>);
};
export default SuperAdminTeams;

