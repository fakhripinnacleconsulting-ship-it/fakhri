"use client";
import { Eye, Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
const clients = [
    {
        id: 1,
        name: "John Doe",
        company: "TechGadgets Co",
        email: "john@techgadgets.com",
        phone: "+1 (555) 123-4567",
        plan: "Premium",
        activeTasks: 3,
        status: "active"
    },
    {
        id: 2,
        name: "Emily Smith",
        company: "BeautyBrand Inc",
        email: "emily@beautybrand.com",
        phone: "+1 (555) 234-5678",
        plan: "Platinum",
        activeTasks: 2,
        status: "active"
    },
    {
        id: 3,
        name: "Michael Brown",
        company: "HomeEssentials",
        email: "michael@homeessentials.com",
        phone: "+1 (555) 345-6789",
        plan: "Elite",
        activeTasks: 1,
        status: "active"
    },
];
const AdminClients = () => {
    return (<div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold mb-2">My Clients</h1>
        <p className="text-muted-foreground">Manage your assigned clients and their accounts.</p>
      </div>

      {/* Client Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clients.map((client) => (<div key={client.id} className="bg-card rounded-xl border p-6 hover:border-primary/30 transition-colors">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-heading font-bold">
                  {client.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h3 className="font-medium">{client.name}</h3>
                  <p className="text-sm text-muted-foreground">{client.company}</p>
                </div>
              </div>
              <Badge variant={client.plan === "Platinum" ? "default" : client.plan === "Premium" ? "secondary" : "outline"}>
                {client.plan}
              </Badge>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4"/>
                <span className="truncate">{client.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4"/>
                <span>{client.phone}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <span className="text-sm text-muted-foreground">
                {client.activeTasks} active tasks
              </span>
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-1"/>
                View
              </Button>
            </div>
          </div>))}
      </div>
    </div>);
};
export default AdminClients;
