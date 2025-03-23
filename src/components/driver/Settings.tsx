import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Moon,
  Sun,
  Map,
  DollarSign,
  Navigation,
  Bell,
  Palette,
} from "lucide-react";

export default function Settings() {
  const [settings, setSettings] = useState({
    darkMode: false,
    mapStyle: "standard",
    routePreference: "fastest",
    minLoadPay: 800,
    maxDistance: 500,
    notifications: {
      newLoads: true,
      weatherAlerts: true,
      maintenanceReminders: true,
      paymentUpdates: true,
    },
    colorScheme: "blue",
  });

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
    <div className="bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Settings</h1>
          <Button>Save Changes</Button>
        </div>

        {/* Appearance */}
        <Card className="p-6">
          <h2 className="text-lg font-medium mb-4">Appearance</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-gray-100">
                  {settings.darkMode ? (
                    <Moon className="w-5 h-5 text-gray-600" />
                  ) : (
                    <Sun className="w-5 h-5 text-gray-600" />
                  )}
                </div>
                <div>
                  <Label>Dark Mode</Label>
                  <p className="text-sm text-gray-500">
                    Toggle dark mode theme
                  </p>
                </div>
              </div>
              <Switch
                checked={settings.darkMode}
                onCheckedChange={(checked) =>
                  setSettings((prev) => ({ ...prev, darkMode: checked }))
                }
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-gray-100">
                  <Palette className="w-5 h-5 text-gray-600" />
                </div>
                <Label>Color Scheme</Label>
              </div>
              <Select
                value={settings.colorScheme}
                onValueChange={(value) =>
                  setSettings((prev) => ({ ...prev, colorScheme: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select color scheme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="blue">Blue</SelectItem>
                  <SelectItem value="green">Green</SelectItem>
                  <SelectItem value="purple">Purple</SelectItem>
                  <SelectItem value="red">Red</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Map & Navigation */}
        <Card className="p-6">
          <h2 className="text-lg font-medium mb-4">Map & Navigation</h2>
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-gray-100">
                  <Map className="w-5 h-5 text-gray-600" />
                </div>
                <Label>Map Style</Label>
              </div>
              <Select
                value={settings.mapStyle}
                onValueChange={(value) =>
                  setSettings((prev) => ({ ...prev, mapStyle: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select map style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="satellite">Satellite</SelectItem>
                  <SelectItem value="terrain">Terrain</SelectItem>
                  <SelectItem value="night">Night Mode</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-gray-100">
                  <Navigation className="w-5 h-5 text-gray-600" />
                </div>
                <Label>Route Preference</Label>
              </div>
              <Select
                value={settings.routePreference}
                onValueChange={(value) =>
                  setSettings((prev) => ({ ...prev, routePreference: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select route preference" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fastest">Fastest Route</SelectItem>
                  <SelectItem value="shortest">Shortest Distance</SelectItem>
                  <SelectItem value="economical">Most Economical</SelectItem>
                  <SelectItem value="truckFriendly">Truck-Friendly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Load Preferences */}
        <Card className="p-6">
          <h2 className="text-lg font-medium mb-4">Load Preferences</h2>
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-gray-100">
                  <DollarSign className="w-5 h-5 text-gray-600" />
                </div>
                <div className="flex-1">
                  <Label>Minimum Load Pay</Label>
                  <p className="text-sm text-gray-500">
                    Set your minimum acceptable pay per load
                  </p>
                </div>
                <div className="w-24">
                  <Input
                    type="number"
                    value={settings.minLoadPay}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        minLoadPay: parseInt(e.target.value) || 0,
                      }))
                    }
                    className="text-right"
                  />
                </div>
              </div>
              <Slider
                value={[settings.minLoadPay]}
                onValueChange={([value]) =>
                  setSettings((prev) => ({ ...prev, minLoadPay: value }))
                }
                max={2000}
                step={50}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-gray-100">
                  <Navigation className="w-5 h-5 text-gray-600" />
                </div>
                <div className="flex-1">
                  <Label>Maximum Distance</Label>
                  <p className="text-sm text-gray-500">
                    Set your maximum preferred trip distance
                  </p>
                </div>
                <div className="w-24">
                  <Input
                    type="number"
                    value={settings.maxDistance}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        maxDistance: parseInt(e.target.value) || 0,
                      }))
                    }
                    className="text-right"
                  />
                </div>
              </div>
              <Slider
                value={[settings.maxDistance]}
                onValueChange={([value]) =>
                  setSettings((prev) => ({ ...prev, maxDistance: value }))
                }
                max={1000}
                step={50}
              />
            </div>
          </div>
        </Card>

        {/* Notifications */}
        <Card className="p-6">
          <h2 className="text-lg font-medium mb-4">Notifications</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-gray-100">
                  <Bell className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <Label>New Load Alerts</Label>
                  <p className="text-sm text-gray-500">
                    Get notified about new available loads
                  </p>
                </div>
              </div>
              <Switch
                checked={settings.notifications.newLoads}
                onCheckedChange={() => handleNotificationToggle("newLoads")}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-gray-100">
                  <Bell className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <Label>Weather Alerts</Label>
                  <p className="text-sm text-gray-500">
                    Receive weather-related alerts
                  </p>
                </div>
              </div>
              <Switch
                checked={settings.notifications.weatherAlerts}
                onCheckedChange={() =>
                  handleNotificationToggle("weatherAlerts")
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-gray-100">
                  <Bell className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <Label>Maintenance Reminders</Label>
                  <p className="text-sm text-gray-500">
                    Get truck maintenance notifications
                  </p>
                </div>
              </div>
              <Switch
                checked={settings.notifications.maintenanceReminders}
                onCheckedChange={() =>
                  handleNotificationToggle("maintenanceReminders")
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-gray-100">
                  <Bell className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <Label>Payment Updates</Label>
                  <p className="text-sm text-gray-500">
                    Receive payment-related notifications
                  </p>
                </div>
              </div>
              <Switch
                checked={settings.notifications.paymentUpdates}
                onCheckedChange={() =>
                  handleNotificationToggle("paymentUpdates")
                }
              />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
