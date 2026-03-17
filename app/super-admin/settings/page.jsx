"use client";
import { Save, Clock, Mail, Bell, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
const SuperAdminSettings = () => {
    return (<div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">Configure system settings and preferences.</p>
      </div>

      {/* SLA Settings */}
      <div className="bg-card rounded-xl border p-6">
        <div className="flex items-center gap-3 mb-6">
          <Clock className="h-5 w-5 text-primary"/>
          <h2 className="font-heading font-semibold">SLA Settings</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Task Response Time (hours)</Label>
            <Input type="number" defaultValue="24"/>
          </div>
          <div className="space-y-2">
            <Label>Unassigned Client Alert (hours)</Label>
            <Input type="number" defaultValue="24"/>
          </div>
          <div className="space-y-2">
            <Label>Emergency Response Time (hours)</Label>
            <Input type="number" defaultValue="2"/>
          </div>
          <div className="space-y-2">
            <Label>Task Escalation Threshold (days)</Label>
            <Input type="number" defaultValue="3"/>
          </div>
        </div>
      </div>

      {/* Email Notifications */}
      <div className="bg-card rounded-xl border p-6">
        <div className="flex items-center gap-3 mb-6">
          <Mail className="h-5 w-5 text-primary"/>
          <h2 className="font-heading font-semibold">Email Notifications</h2>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b">
            <div>
              <p className="font-medium">New Client Signup</p>
              <p className="text-sm text-muted-foreground">Notify when a new client signs up</p>
            </div>
            <Switch defaultChecked/>
          </div>
          <div className="flex items-center justify-between py-3 border-b">
            <div>
              <p className="font-medium">Task Overdue Alert</p>
              <p className="text-sm text-muted-foreground">Notify when tasks exceed their ETA</p>
            </div>
            <Switch defaultChecked/>
          </div>
          <div className="flex items-center justify-between py-3 border-b">
            <div>
              <p className="font-medium">Unassigned Client Alert</p>
              <p className="text-sm text-muted-foreground">Notify when clients remain unassigned</p>
            </div>
            <Switch defaultChecked/>
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium">Weekly Summary Report</p>
              <p className="text-sm text-muted-foreground">Send weekly performance summary</p>
            </div>
            <Switch defaultChecked/>
          </div>
        </div>
      </div>

      {/* System Settings */}
      <div className="bg-card rounded-xl border p-6">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="h-5 w-5 text-primary"/>
          <h2 className="font-heading font-semibold">System Settings</h2>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b">
            <div>
              <p className="font-medium">Maintenance Mode</p>
              <p className="text-sm text-muted-foreground">Temporarily disable client portal access</p>
            </div>
            <Switch />
          </div>
          <div className="flex items-center justify-between py-3 border-b">
            <div>
              <p className="font-medium">Auto-assign New Clients</p>
              <p className="text-sm text-muted-foreground">Automatically assign clients to available managers</p>
            </div>
            <Switch />
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium">Two-Factor Authentication</p>
              <p className="text-sm text-muted-foreground">Require 2FA for all admin users</p>
            </div>
            <Switch defaultChecked/>
          </div>
        </div>
      </div>

      {/* Default Settings */}
      <div className="bg-card rounded-xl border p-6">
        <div className="flex items-center gap-3 mb-6">
          <Bell className="h-5 w-5 text-primary"/>
          <h2 className="font-heading font-semibold">Default Settings</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Default Task Priority</Label>
            <Select defaultValue="medium">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Default Task ETA (days)</Label>
            <Input type="number" defaultValue="7"/>
          </div>
          <div className="space-y-2">
            <Label>Max Clients per Manager</Label>
            <Input type="number" defaultValue="10"/>
          </div>
          <div className="space-y-2">
            <Label>Session Timeout (minutes)</Label>
            <Input type="number" defaultValue="60"/>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button size="lg">
          <Save className="h-4 w-4 mr-2"/>
          Save All Settings
        </Button>
      </div>
    </div>);
};
export default SuperAdminSettings;
