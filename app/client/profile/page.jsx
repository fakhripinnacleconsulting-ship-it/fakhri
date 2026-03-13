"use client";
import { Mail, Phone, Building, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
const ClientProfile = () => {
  return (<div className="space-y-6">
    <div>
      <h1 className="font-heading text-2xl font-bold mb-2">Profile</h1>
      <p className="text-muted-foreground">Manage your account settings and preferences.</p>
    </div>

    {/* Profile Card */}
    <div className="bg-card rounded-xl border overflow-hidden">
      <div className="bg-gradient-primary p-6 text-white">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-3xl font-heading font-bold">
            JD
          </div>
          <div>
            <h2 className="text-xl font-heading font-bold">John Doe</h2>
            <p className="text-white/80">Premium Plan Member</p>
            <p className="text-sm text-white/60">Member since Dec 2025</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name</Label>
            <Input id="firstName" value="John" readOnly className="bg-accent/50" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input id="lastName" value="Doe" readOnly className="bg-accent/50" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="email" value="john.doe@example.com" readOnly className="pl-10 bg-accent/50" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="phone" value="+1 (555) 123-4567" readOnly className="pl-10 bg-accent/50" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="company">Company</Label>
            <div className="relative">
              <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="company" value="TechGadgets Co" readOnly className="pl-10 bg-accent/50" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="location" value="New York, USA" readOnly className="pl-10 bg-accent/50" />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t flex justify-end">
          <Button>Request Profile Update</Button>
        </div>
      </div>
    </div>

    {/* Account Manager Contact */}
    <div className="bg-card rounded-xl border p-6">
      <h3 className="font-heading font-semibold mb-4">Need to Update Your Profile?</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Contact your account manager to request any changes to your profile information.
      </p>
      <div className="flex items-center gap-4 p-4 rounded-lg bg-accent/50">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-heading font-bold">
          SM
        </div>
        <div>
          <p className="font-medium">Sarah Mitchell</p>
          <p className="text-sm text-primary">k6263638053@gmail.com</p>
        </div>
      </div>
    </div>
  </div>);
};
export default ClientProfile;
