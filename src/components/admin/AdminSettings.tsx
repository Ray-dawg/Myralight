import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Settings,
  Bell,
  Shield,
  Mail,
  Globe,
  Database,
  Lock,
} from "lucide-react";

export default function AdminSettings() {
  const [settings, setSettings] = useState({
    systemSettings: {
      maintenanceMode: false,
      debugMode: false,
      allowRegistration: true,
      requireEmailVerification: true,
    },
    notifications: {
      systemAlerts: true,
      securityAlerts: true,
      userSignups: true,
      reportGeneration: false,
    },
    email: {
      fromName: "Trucking Platform",
      fromEmail: "no-reply@example.com",
      smtpHost: "smtp.example.com",
      smtpPort: "587",
    },
  });

  const handleSystemToggle = (key: keyof typeof settings.systemSettings) => {
    setSettings((prev) => ({
      ...prev,
      systemSettings: {
        ...prev.systemSettings,
        [key]: !prev.systemSettings[key],
      },
    }));
  };

  const handleNotificationToggle = (
    key: keyof typeof settings.notifications,
  ) => {
    setSettings((prev) => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: !prev.notifications[key],
      },
    }));
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">System Settings</h1>
          <p className="text-gray-500 mt-1">
            Manage system-wide configurations
          </p>
        </div>
        <Button>Save Changes</Button>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings className="h-4 w-4" /> General
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            className="flex items-center gap-2"
          >
            <Bell className="h-4 w-4" /> Notifications
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" /> Security
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center gap-2">
            <Mail className="h-4 w-4" /> Email
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>System Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Maintenance Mode</Label>
                    <p className="text-sm text-gray-500">
                      Put the system in maintenance mode
                    </p>
                  </div>
                  <Switch
                    checked={settings.systemSettings.maintenanceMode}
                    onCheckedChange={() =>
                      handleSystemToggle("maintenanceMode")
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Debug Mode</Label>
                    <p className="text-sm text-gray-500">
                      Enable detailed error logging
                    </p>
                  </div>
                  <Switch
                    checked={settings.systemSettings.debugMode}
                    onCheckedChange={() => handleSystemToggle("debugMode")}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>System Alerts</Label>
                    <p className="text-sm text-gray-500">
                      Receive critical system notifications
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.systemAlerts}
                    onCheckedChange={() =>
                      handleNotificationToggle("systemAlerts")
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Security Alerts</Label>
                    <p className="text-sm text-gray-500">
                      Get notified about security events
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.securityAlerts}
                    onCheckedChange={() =>
                      handleNotificationToggle("securityAlerts")
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>User Signups</Label>
                    <p className="text-sm text-gray-500">
                      Notifications for new user registrations
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.userSignups}
                    onCheckedChange={() =>
                      handleNotificationToggle("userSignups")
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Allow Registration</Label>
                    <p className="text-sm text-gray-500">
                      Enable new user registration
                    </p>
                  </div>
                  <Switch
                    checked={settings.systemSettings.allowRegistration}
                    onCheckedChange={() =>
                      handleSystemToggle("allowRegistration")
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Verification</Label>
                    <p className="text-sm text-gray-500">
                      Require email verification for new accounts
                    </p>
                  </div>
                  <Switch
                    checked={settings.systemSettings.requireEmailVerification}
                    onCheckedChange={() =>
                      handleSystemToggle("requireEmailVerification")
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle>Email Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>From Name</Label>
                  <Input
                    value={settings.email.fromName}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        email: { ...prev.email, fromName: e.target.value },
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>From Email</Label>
                  <Input
                    value={settings.email.fromEmail}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        email: { ...prev.email, fromEmail: e.target.value },
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>SMTP Host</Label>
                  <Input
                    value={settings.email.smtpHost}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        email: { ...prev.email, smtpHost: e.target.value },
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>SMTP Port</Label>
                  <Input
                    value={settings.email.smtpPort}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        email: { ...prev.email, smtpPort: e.target.value },
                      }))
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
