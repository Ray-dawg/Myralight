import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../lib/convex/_generated/api";
import {
  Bell,
  MapPin,
  TrendingUp,
  Truck,
  Clock,
  DollarSign,
  X,
  CheckCircle,
  AlertTriangle,
  Settings,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Switch } from "../ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Separator } from "../ui/separator";
import { toast } from "../ui/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { ScrollArea } from "../ui/scroll-area";

interface DemandNotification {
  id: string;
  type:
    | "demand_increase"
    | "opportunity"
    | "market_shift"
    | "rate_increase"
    | "eta_update"
    | "route_optimization"
    | "traffic_delay"
    | "weather_impact"
    | "historical_pattern";
  title: string;
  message: string;
  regionId: string;
  regionName: string;
  coordinates: [number, number];
  percentageIncrease: number;
  currentDemand: number;
  urgencyScore: number;
  actionUrl: string;
  actionLabel: string;
  timestamp: number;
  isRead: boolean;
  priority: "high" | "medium" | "low";
  distance?: number;
  estimatedRevenue?: number;
  expiresAt?: number;
  etaData?: {
    distanceMiles: number;
    baseETA: number;
    adjustedETA: number;
    arrivalTime: number;
    factors: {
      traffic: string;
      weather: string;
      road: string;
    };
    vehicleId: string;
    confidence: number;
  };
  insightType?: string;
  recommendedAction?: string;
  historicalContext?: string;
  externalFactors?: {
    traffic: {
      condition: string;
      congestionLevel: number;
      averageSpeed: number;
      delayMinutes: number;
      incidents: any[];
    };
    weather: {
      condition: string;
      temperature: number;
      precipitation: number;
      windSpeed: number;
      visibility: number;
      alerts: any[];
    };
    road: {
      condition: string;
      constructionZones: number;
      roadClosures: number;
      maintenanceImpact: string;
    };
    timestamp: number;
  };
}

interface NotificationPreferences {
  enablePushNotifications: boolean;
  enableInAppNotifications: boolean;
  minDemandChangeThreshold: number;
  maxDistanceThreshold: number;
  minUrgencyThreshold: number;
  notifyOnRateIncreases: boolean;
  notifyOnNewOpportunities: boolean;
  notifyOnMarketShifts: boolean;
  quietHoursStart: number;
  quietHoursEnd: number;
  enableLLMInsights: boolean;
  enableETAPredictions: boolean;
  enableRouteOptimizations: boolean;
  enableWeatherAlerts: boolean;
  enableTrafficAlerts: boolean;
  enableHistoricalPatterns: boolean;
}

const defaultPreferences: NotificationPreferences = {
  enablePushNotifications: true,
  enableInAppNotifications: true,
  minDemandChangeThreshold: 15, // Percentage
  maxDistanceThreshold: 200, // Miles
  minUrgencyThreshold: 5, // 1-10 scale
  notifyOnRateIncreases: true,
  notifyOnNewOpportunities: true,
  notifyOnMarketShifts: true,
  quietHoursStart: 22, // 10 PM
  quietHoursEnd: 6, // 6 AM,
  enableLLMInsights: true,
  enableETAPredictions: true,
  enableRouteOptimizations: true,
  enableWeatherAlerts: true,
  enableTrafficAlerts: true,
  enableHistoricalPatterns: true,
};

const DemandNotificationSystem: React.FC = () => {
  const [notifications, setNotifications] = useState<DemandNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isPopoverOpen, setIsPopoverOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [preferences, setPreferences] =
    useState<NotificationPreferences>(defaultPreferences);
  const [isPreferencesOpen, setIsPreferencesOpen] = useState<boolean>(false);

  // Mock notifications for demo purposes
  // In a real implementation, these would come from the Convex backend
  const mockNotifications: DemandNotification[] = [
    {
      id: "1",
      type: "demand_increase",
      title: "High Demand Alert: Chicago, IL",
      message:
        "Demand in Chicago has increased by 35% with 28 loads available at ~$2,850 per load.",
      regionId: "IL",
      regionName: "Chicago, IL",
      coordinates: [-87.6298, 41.8781],
      percentageIncrease: 35,
      currentDemand: 28,
      urgencyScore: 8.5,
      actionUrl:
        "/dashboard/heatmap?region=Chicago,%20IL&lat=41.8781&lng=-87.6298&zoom=8",
      actionLabel: "View on Map",
      timestamp: Date.now() - 1000 * 60 * 30, // 30 minutes ago
      isRead: false,
      priority: "high",
      distance: 120,
      estimatedRevenue: 8550,
      expiresAt: Date.now() + 1000 * 60 * 60 * 12, // 12 hours from now
    },
    {
      id: "2",
      type: "opportunity",
      title: "New Opportunity: Dallas, TX",
      message:
        "High-paying loads available in Dallas area with average rates of $3,200.",
      regionId: "TX",
      regionName: "Dallas, TX",
      coordinates: [-96.797, 32.7767],
      percentageIncrease: 20,
      currentDemand: 15,
      urgencyScore: 7.2,
      actionUrl:
        "/dashboard/heatmap?region=Dallas,%20TX&lat=32.7767&lng=-96.7970&zoom=8",
      actionLabel: "View on Map",
      timestamp: Date.now() - 1000 * 60 * 120, // 2 hours ago
      isRead: true,
      priority: "medium",
      distance: 250,
      estimatedRevenue: 9600,
      expiresAt: Date.now() + 1000 * 60 * 60 * 24, // 24 hours from now
    },
    {
      id: "3",
      type: "market_shift",
      title: "Market Shift: Atlanta, GA",
      message:
        "Significant increase in reefer demand in Atlanta region. 22 loads available.",
      regionId: "GA",
      regionName: "Atlanta, GA",
      coordinates: [-84.388, 33.749],
      percentageIncrease: 45,
      currentDemand: 22,
      urgencyScore: 9.0,
      actionUrl:
        "/dashboard/heatmap?region=Atlanta,%20GA&lat=33.7490&lng=-84.3880&zoom=8",
      actionLabel: "View on Map",
      timestamp: Date.now() - 1000 * 60 * 45, // 45 minutes ago
      isRead: false,
      priority: "high",
      distance: 180,
      estimatedRevenue: 7800,
      expiresAt: Date.now() + 1000 * 60 * 60 * 8, // 8 hours from now
    },
    {
      id: "4",
      type: "rate_increase",
      title: "Rate Increase: Denver, CO",
      message:
        "Average rates in Denver have increased by 15% to $3,450 per load.",
      regionId: "CO",
      regionName: "Denver, CO",
      coordinates: [-104.9903, 39.7392],
      percentageIncrease: 15,
      currentDemand: 12,
      urgencyScore: 6.8,
      actionUrl:
        "/dashboard/heatmap?region=Denver,%20CO&lat=39.7392&lng=-104.9903&zoom=8",
      actionLabel: "View on Map",
      timestamp: Date.now() - 1000 * 60 * 180, // 3 hours ago
      isRead: false,
      priority: "medium",
      distance: 75,
      estimatedRevenue: 10350,
      expiresAt: Date.now() + 1000 * 60 * 60 * 36, // 36 hours from now
    },
  ];

  // Initialize notifications with mock data
  useEffect(() => {
    setNotifications(mockNotifications);
    const unread = mockNotifications.filter((n) => !n.isRead).length;
    setUnreadCount(unread);
  }, []);

  // Handle viewing a notification
  const handleViewNotification = (notification: DemandNotification) => {
    if (!notification.isRead) {
      // Update local state
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notification.id ? { ...n, isRead: true } : n,
        ),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }

    // In a real implementation, this would navigate to the action URL
    // For demo purposes, just close the popover
    setIsPopoverOpen(false);

    // Show toast to simulate navigation
    toast({
      title: "Navigating to region",
      description: `Focusing on ${notification.regionName} in the heatmap.`,
    });
  };

  // Handle dismissing a notification
  const handleDismissNotification = (
    notification: DemandNotification,
    event: React.MouseEvent,
  ) => {
    event.stopPropagation();

    // Update local state
    setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
    if (!notification.isRead) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
  };

  // Handle updating notification preferences
  const handleUpdatePreferences = () => {
    // In a real implementation, this would call a mutation to update preferences
    setIsPreferencesOpen(false);
    toast({
      title: "Preferences Updated",
      description: "Your notification preferences have been saved.",
      variant: "default",
    });
  };

  // Filter notifications based on active tab
  const filteredNotifications = notifications.filter((notification) => {
    if (activeTab === "all") return true;
    if (activeTab === "unread") return !notification.isRead;
    if (activeTab === "high") return notification.priority === "high";
    return notification.type === activeTab;
  });

  // Get notification icon based on type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "demand_increase":
        return <TrendingUp className="h-4 w-4 text-blue-500" />;
      case "opportunity":
        return <DollarSign className="h-4 w-4 text-green-500" />;
      case "market_shift":
        return <TrendingUp className="h-4 w-4 text-orange-500" />;
      case "rate_increase":
        return <DollarSign className="h-4 w-4 text-purple-500" />;
      case "eta_update":
        return <Clock className="h-4 w-4 text-indigo-500" />;
      case "route_optimization":
        return <Truck className="h-4 w-4 text-teal-500" />;
      case "traffic_delay":
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case "weather_impact":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "historical_pattern":
        return <TrendingUp className="h-4 w-4 text-violet-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  // Get priority badge
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return <Badge variant="destructive">High</Badge>;
      case "medium":
        return <Badge variant="default">Medium</Badge>;
      case "low":
        return <Badge variant="secondary">Low</Badge>;
      default:
        return null;
    }
  };

  // Format relative time
  const formatRelativeTime = (timestamp: number) => {
    const now = Date.now();
    const diffInMinutes = Math.floor((now - timestamp) / (1000 * 60));

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  return (
    <div className="relative">
      {/* Notification Bell Button */}
      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs text-white">
                {unreadCount}
              </span>
            )}
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-[380px] p-0" align="end">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-medium">Notifications</h3>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsPreferencesOpen(!isPreferencesOpen)}
                aria-label="Notification Settings"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {isPreferencesOpen ? (
            <div className="p-4 space-y-4">
              <h4 className="font-medium">Notification Preferences</h4>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label htmlFor="push-notifications" className="text-sm">
                    Push Notifications
                  </label>
                  <Switch
                    id="push-notifications"
                    checked={preferences.enablePushNotifications}
                    onCheckedChange={(checked) =>
                      setPreferences((prev) => ({
                        ...prev,
                        enablePushNotifications: checked,
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label htmlFor="in-app-notifications" className="text-sm">
                    In-App Notifications
                  </label>
                  <Switch
                    id="in-app-notifications"
                    checked={preferences.enableInAppNotifications}
                    onCheckedChange={(checked) =>
                      setPreferences((prev) => ({
                        ...prev,
                        enableInAppNotifications: checked,
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label htmlFor="rate-increases" className="text-sm">
                    Rate Increase Alerts
                  </label>
                  <Switch
                    id="rate-increases"
                    checked={preferences.notifyOnRateIncreases}
                    onCheckedChange={(checked) =>
                      setPreferences((prev) => ({
                        ...prev,
                        notifyOnRateIncreases: checked,
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label htmlFor="opportunities" className="text-sm">
                    New Opportunities
                  </label>
                  <Switch
                    id="opportunities"
                    checked={preferences.notifyOnNewOpportunities}
                    onCheckedChange={(checked) =>
                      setPreferences((prev) => ({
                        ...prev,
                        notifyOnNewOpportunities: checked,
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label htmlFor="market-shifts" className="text-sm">
                    Market Shift Alerts
                  </label>
                  <Switch
                    id="market-shifts"
                    checked={preferences.notifyOnMarketShifts}
                    onCheckedChange={(checked) =>
                      setPreferences((prev) => ({
                        ...prev,
                        notifyOnMarketShifts: checked,
                      }))
                    }
                  />
                </div>

                <div className="pt-2">
                  <label className="text-sm block mb-1">
                    Minimum Demand Change (%)
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="50"
                    step="5"
                    value={preferences.minDemandChangeThreshold}
                    onChange={(e) =>
                      setPreferences((prev) => ({
                        ...prev,
                        minDemandChangeThreshold: parseInt(e.target.value),
                      }))
                    }
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>5%</span>
                    <span>{preferences.minDemandChangeThreshold}%</span>
                    <span>50%</span>
                  </div>
                </div>

                <div className="pt-2">
                  <label className="text-sm block mb-1">
                    Maximum Distance (miles)
                  </label>
                  <input
                    type="range"
                    min="50"
                    max="500"
                    step="50"
                    value={preferences.maxDistanceThreshold}
                    onChange={(e) =>
                      setPreferences((prev) => ({
                        ...prev,
                        maxDistanceThreshold: parseInt(e.target.value),
                      }))
                    }
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>50mi</span>
                    <span>{preferences.maxDistanceThreshold}mi</span>
                    <span>500mi</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsPreferencesOpen(false)}
                >
                  Cancel
                </Button>
                <Button size="sm" onClick={handleUpdatePreferences}>
                  Save Changes
                </Button>
              </div>
            </div>
          ) : (
            <>
              <Tabs
                defaultValue="all"
                value={activeTab}
                onValueChange={setActiveTab}
              >
                <div className="border-b">
                  <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
                    <TabsTrigger
                      value="all"
                      className="rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:border-primary"
                    >
                      All
                    </TabsTrigger>
                    <TabsTrigger
                      value="unread"
                      className="rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:border-primary"
                    >
                      Unread
                    </TabsTrigger>
                    <TabsTrigger
                      value="high"
                      className="rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:border-primary"
                    >
                      High Priority
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value={activeTab} className="p-0">
                  <ScrollArea className="h-[300px]">
                    {filteredNotifications.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-[300px] text-center p-4">
                        <Bell className="h-8 w-8 text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">
                          No notifications to display
                        </p>
                      </div>
                    ) : (
                      <div className="divide-y">
                        {filteredNotifications.map((notification) => (
                          <div
                            key={notification.id}
                            className={`p-4 hover:bg-muted cursor-pointer ${!notification.isRead ? "bg-muted/50" : ""}`}
                            onClick={() => handleViewNotification(notification)}
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0 mt-0.5">
                                {getNotificationIcon(notification.type)}
                              </div>
                              <div className="flex-1 space-y-1">
                                <div className="flex items-start justify-between">
                                  <p className="font-medium text-sm">
                                    {notification.title}
                                  </p>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 -mt-1 -mr-1"
                                    onClick={(e) =>
                                      handleDismissNotification(notification, e)
                                    }
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {notification.message}
                                </p>
                                <div className="flex items-center justify-between text-xs">
                                  <div className="flex items-center gap-2">
                                    <MapPin className="h-3 w-3 text-muted-foreground" />
                                    <span>{notification.regionName}</span>
                                    {notification.distance && (
                                      <span className="text-muted-foreground">
                                        {notification.distance} mi
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-muted-foreground">
                                    {formatRelativeTime(notification.timestamp)}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between pt-1">
                                  {getPriorityBadge(notification.priority)}
                                  {notification.estimatedRevenue && (
                                    <span className="text-xs font-medium text-green-600">
                                      Est. Revenue: $
                                      {notification.estimatedRevenue.toLocaleString()}
                                    </span>
                                  )}
                                </div>

                                {/* Enhanced ETA information */}
                                {notification.etaData && (
                                  <div className="mt-2 p-2 bg-muted/50 rounded-md text-xs">
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="font-medium">ETA:</span>
                                      <span>
                                        {new Date(
                                          notification.etaData.arrivalTime,
                                        ).toLocaleTimeString()}
                                        ({notification.etaData.adjustedETA} min)
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between"></div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </TabsContent>
              </Tabs>

              <div className="p-2 border-t">
                <Button variant="outline" size="sm" className="w-full">
                  View All Notifications
                </Button>
              </div>
            </>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default DemandNotificationSystem;
