import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/lib/convex/_generated/api";
import { Id } from "@/lib/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "react-beautiful-dnd";
import {
  Truck,
  Package,
  Clock,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Settings,
  Save,
  Layers,
  FileText,
  MessageSquare,
  BarChart,
  Users,
  DollarSign,
} from "lucide-react";
import LoadsDashboard from "./LoadsDashboard";
import LoadDetailsDialog from "./LoadDetailsDialog";

interface DashboardConfig {
  visibleTabs: string[];
  defaultTab: string;
  widgets: string[];
}

interface CustomizableDashboardProps {
  userId: Id<"users">;
}

interface WidgetDefinition {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  size: "small" | "medium" | "large";
  component: React.ReactNode;
}

export default function CustomizableDashboard({
  userId,
}: CustomizableDashboardProps) {
  const [selectedLoadId, setSelectedLoadId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("");
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [customConfig, setCustomConfig] = useState<DashboardConfig | null>(
    null,
  );

  // Get user information
  const user = useQuery(api.users.getUser, { id: userId });

  // Get dashboard configuration
  const dashboardConfig = useQuery(api.permissions.getUserDashboardConfig, {
    userId,
  });

  // Get load statistics
  const loadStats = useQuery(api.loads.getLoadStats);

  // Set active tab based on dashboard config
  useEffect(() => {
    if (dashboardConfig && !activeTab) {
      setActiveTab(dashboardConfig.defaultTab);
    }
  }, [dashboardConfig, activeTab]);

  // Initialize custom config when starting customization
  useEffect(() => {
    if (isCustomizing && dashboardConfig) {
      setCustomConfig({
        ...dashboardConfig,
        widgets: [...dashboardConfig.widgets], // Create a copy to avoid modifying the original
      });
    }
  }, [isCustomizing, dashboardConfig]);

  // Available widgets definitions
  const availableWidgets: WidgetDefinition[] = [
    {
      id: "activeLoads",
      name: "Active Loads",
      description: "Shows currently active loads",
      icon: <Truck className="h-5 w-5 text-yellow-500" />,
      size: "small",
      component: (
        <MetricCard
          title="Active Loads"
          value={
            (loadStats?.statusCounts?.assigned || 0) +
            (loadStats?.statusCounts?.in_transit || 0)
          }
          icon={<Truck className="h-5 w-5 text-yellow-500" />}
          description="Assigned or in transit"
        />
      ),
    },
    {
      id: "completedLoads",
      name: "Completed Loads",
      description: "Shows completed loads count",
      icon: <CheckCircle className="h-5 w-5 text-green-500" />,
      size: "small",
      component: (
        <MetricCard
          title="Completed Loads"
          value={loadStats?.statusCounts?.completed || 0}
          icon={<CheckCircle className="h-5 w-5 text-green-500" />}
          description="Successfully delivered"
        />
      ),
    },
    {
      id: "totalLoads",
      name: "Total Loads",
      description: "Shows total loads count",
      icon: <Package className="h-5 w-5 text-blue-500" />,
      size: "small",
      component: (
        <MetricCard
          title="Total Loads"
          value={loadStats?.totalLoads || 0}
          icon={<Package className="h-5 w-5 text-blue-500" />}
          description="All time"
        />
      ),
    },
    {
      id: "revenue",
      name: "Revenue",
      description: "Shows revenue metrics",
      icon: <DollarSign className="h-5 w-5 text-green-500" />,
      size: "small",
      component: (
        <MetricCard
          title="Revenue"
          value={`$${((loadStats?.totalRevenue || 0) / 100).toFixed(2)}`}
          icon={<DollarSign className="h-5 w-5 text-green-500" />}
          description="Total revenue"
        />
      ),
    },
    {
      id: "performance",
      name: "Performance",
      description: "Shows performance metrics",
      icon: <TrendingUp className="h-5 w-5 text-purple-500" />,
      size: "small",
      component: (
        <MetricCard
          title="On-Time Rate"
          value={`${loadStats?.onTimePercentage || 0}%`}
          icon={<TrendingUp className="h-5 w-5 text-purple-500" />}
          description="Delivery performance"
        />
      ),
    },
    {
      id: "recentActivity",
      name: "Recent Activity",
      description: "Shows recent activity",
      icon: <Clock className="h-5 w-5 text-blue-500" />,
      size: "medium",
      component: (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex items-start space-x-3 pb-3 border-b border-gray-100"
                >
                  <div className="bg-blue-100 p-2 rounded-full">
                    <Clock className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">
                      Load #{1000 + i} status updated
                    </p>
                    <p className="text-sm text-gray-500">
                      Status changed to In Transit
                    </p>
                    <p className="text-xs text-gray-400">2 hours ago</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ),
    },
    {
      id: "alerts",
      name: "Alerts",
      description: "Shows important alerts",
      icon: <AlertTriangle className="h-5 w-5 text-red-500" />,
      size: "medium",
      component: (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-3 bg-red-50 text-red-800 rounded-md flex items-start space-x-3">
                <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Delayed Delivery</p>
                  <p className="text-sm">
                    Load #1234 is running 45 minutes behind schedule
                  </p>
                </div>
              </div>
              <div className="p-3 bg-yellow-50 text-yellow-800 rounded-md flex items-start space-x-3">
                <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Weather Alert</p>
                  <p className="text-sm">
                    Heavy snow expected on I-90 corridor
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ),
    },
    {
      id: "driverStatus",
      name: "Driver Status",
      description: "Shows driver status",
      icon: <Users className="h-5 w-5 text-indigo-500" />,
      size: "medium",
      component: (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Driver Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {["Active", "On Break", "Off Duty"].map((status, i) => (
                <div
                  key={status}
                  className="flex justify-between items-center pb-2 border-b border-gray-100"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`h-3 w-3 rounded-full ${i === 0 ? "bg-green-500" : i === 1 ? "bg-yellow-500" : "bg-gray-400"}`}
                    ></div>
                    <span>{status}</span>
                  </div>
                  <span className="font-medium">{8 - i * 3}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ),
    },
  ];

  // Handle drag and drop for widget reordering
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination || !customConfig) return;

    const items = Array.from(customConfig.widgets);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setCustomConfig({
      ...customConfig,
      widgets: items,
    });
  };

  // Toggle widget selection
  const toggleWidget = (widgetId: string) => {
    if (!customConfig) return;

    if (customConfig.widgets.includes(widgetId)) {
      setCustomConfig({
        ...customConfig,
        widgets: customConfig.widgets.filter((id) => id !== widgetId),
      });
    } else {
      setCustomConfig({
        ...customConfig,
        widgets: [...customConfig.widgets, widgetId],
      });
    }
  };

  // Toggle tab visibility
  const toggleTab = (tabId: string) => {
    if (!customConfig) return;

    if (customConfig.visibleTabs.includes(tabId)) {
      // Don't allow removing the last tab
      if (customConfig.visibleTabs.length <= 1) return;

      // If removing the default tab, change the default
      let newConfig = {
        ...customConfig,
        visibleTabs: customConfig.visibleTabs.filter((id) => id !== tabId),
      };

      if (customConfig.defaultTab === tabId) {
        newConfig.defaultTab = newConfig.visibleTabs[0];
      }

      setCustomConfig(newConfig);
    } else {
      setCustomConfig({
        ...customConfig,
        visibleTabs: [...customConfig.visibleTabs, tabId],
      });
    }
  };

  // Set default tab
  const setDefaultTab = (tabId: string) => {
    if (!customConfig || !customConfig.visibleTabs.includes(tabId)) return;

    setCustomConfig({
      ...customConfig,
      defaultTab: tabId,
    });
  };

  // Save dashboard configuration
  const saveDashboardConfig = async () => {
    if (!customConfig) return;

    try {
      // In a real implementation, this would call a mutation to save the config
      console.log("Saving dashboard config:", customConfig);

      // Close customization mode
      setIsCustomizing(false);
    } catch (error) {
      console.error("Error saving dashboard config:", error);
    }
  };

  // Get role-specific dashboard title
  const getDashboardTitle = () => {
    if (!user) return "Dashboard";

    if (user.roleId) {
      // In a real implementation, you would fetch the role name
      return "Custom Dashboard";
    }

    switch (user.role) {
      case "admin":
        return "Admin Dashboard";
      case "shipper":
        return "Shipper Dashboard";
      case "carrier":
        return "Carrier Dashboard";
      case "driver":
        return "Driver Dashboard";
      default:
        return "Dashboard";
    }
  };

  // Render widgets based on configuration
  const renderWidgets = () => {
    if (!dashboardConfig) return null;

    const widgetsToRender = dashboardConfig.widgets
      .map((widgetId) => availableWidgets.find((w) => w.id === widgetId))
      .filter(Boolean) as WidgetDefinition[];

    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {widgetsToRender.map((widget) => (
          <div
            key={widget.id}
            className={
              widget.size === "small"
                ? "md:col-span-1"
                : widget.size === "medium"
                  ? "md:col-span-2"
                  : "md:col-span-4"
            }
          >
            {widget.component}
          </div>
        ))}
      </div>
    );
  };

  if (!dashboardConfig || !user) {
    return <div className="p-6">Loading dashboard configuration...</div>;
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{getDashboardTitle()}</h1>
        <Button variant="outline" onClick={() => setIsCustomizing(true)}>
          <Settings className="h-4 w-4 mr-2" />
          Customize Dashboard
        </Button>
      </div>

      {/* Dashboard Widgets */}
      {renderWidgets()}

      {/* Tabs */}
      <Tabs
        defaultValue={dashboardConfig.defaultTab}
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="mb-4">
          {dashboardConfig.visibleTabs.includes("loads") && (
            <TabsTrigger value="loads">
              <Package className="h-4 w-4 mr-2" />
              Loads
            </TabsTrigger>
          )}
          {dashboardConfig.visibleTabs.includes("analytics") && (
            <TabsTrigger value="analytics">
              <BarChart className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
          )}
          {dashboardConfig.visibleTabs.includes("documents") && (
            <TabsTrigger value="documents">
              <FileText className="h-4 w-4 mr-2" />
              Documents
            </TabsTrigger>
          )}
          {dashboardConfig.visibleTabs.includes("messages") && (
            <TabsTrigger value="messages">
              <MessageSquare className="h-4 w-4 mr-2" />
              Messages
            </TabsTrigger>
          )}
          {dashboardConfig.visibleTabs.includes("settings") && (
            <TabsTrigger value="settings">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="loads" className="p-0">
          <LoadsDashboard userRole={user.role || "user"} userId={userId} />
        </TabsContent>

        <TabsContent value="analytics" className="p-0">
          <Card>
            <CardHeader>
              <CardTitle>Analytics Dashboard</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Analytics content would go here</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="p-0">
          <Card>
            <CardHeader>
              <CardTitle>Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Documents content would go here</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="messages" className="p-0">
          <Card>
            <CardHeader>
              <CardTitle>Messages</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Messages content would go here</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="p-0">
          <Card>
            <CardHeader>
              <CardTitle>Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Settings content would go here</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {selectedLoadId && (
        <LoadDetailsDialog
          loadId={selectedLoadId}
          isOpen={!!selectedLoadId}
          onClose={() => setSelectedLoadId(null)}
          userRole={user.role || "user"}
        />
      )}

      {/* Dashboard Customization Dialog */}
      <Dialog open={isCustomizing} onOpenChange={setIsCustomizing}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Customize Dashboard</DialogTitle>
            <DialogDescription>
              Personalize your dashboard by selecting which widgets and tabs to
              display.
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="widgets" className="mt-4">
            <TabsList className="mb-4">
              <TabsTrigger value="widgets">Widgets</TabsTrigger>
              <TabsTrigger value="tabs">Tabs</TabsTrigger>
              <TabsTrigger value="layout">Layout</TabsTrigger>
            </TabsList>

            <TabsContent value="widgets" className="space-y-4">
              <h3 className="font-medium">Select Widgets to Display</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {availableWidgets.map((widget) => (
                  <div
                    key={widget.id}
                    className="flex items-start space-x-3 p-3 border rounded-md"
                  >
                    <Checkbox
                      id={`widget-${widget.id}`}
                      checked={customConfig?.widgets.includes(widget.id)}
                      onCheckedChange={() => toggleWidget(widget.id)}
                    />
                    <div className="flex-1">
                      <Label
                        htmlFor={`widget-${widget.id}`}
                        className="flex items-center gap-2"
                      >
                        {widget.icon}
                        <span>{widget.name}</span>
                      </Label>
                      <p className="text-sm text-gray-500 mt-1">
                        {widget.description}
                      </p>
                      <Badge className="mt-2">{widget.size}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="tabs" className="space-y-4">
              <h3 className="font-medium">Configure Visible Tabs</h3>
              <div className="space-y-4">
                {[
                  "loads",
                  "analytics",
                  "documents",
                  "messages",
                  "settings",
                ].map((tab) => (
                  <div
                    key={tab}
                    className="flex items-center justify-between p-3 border rounded-md"
                  >
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id={`tab-${tab}`}
                        checked={customConfig?.visibleTabs.includes(tab)}
                        onCheckedChange={() => toggleTab(tab)}
                        disabled={
                          customConfig?.visibleTabs.length <= 1 &&
                          customConfig?.visibleTabs.includes(tab)
                        }
                      />
                      <Label
                        htmlFor={`tab-${tab}`}
                        className="flex items-center gap-2"
                      >
                        {tab === "loads" ? (
                          <Package className="h-4 w-4" />
                        ) : tab === "analytics" ? (
                          <BarChart className="h-4 w-4" />
                        ) : tab === "documents" ? (
                          <FileText className="h-4 w-4" />
                        ) : tab === "messages" ? (
                          <MessageSquare className="h-4 w-4" />
                        ) : (
                          <Settings className="h-4 w-4" />
                        )}
                        <span>
                          {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </span>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Label htmlFor={`default-${tab}`} className="text-sm">
                        Default
                      </Label>
                      <Checkbox
                        id={`default-${tab}`}
                        checked={customConfig?.defaultTab === tab}
                        onCheckedChange={() => setDefaultTab(tab)}
                        disabled={!customConfig?.visibleTabs.includes(tab)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="layout" className="space-y-4">
              <h3 className="font-medium">Arrange Widget Order</h3>
              <p className="text-sm text-gray-500 mb-4">
                Drag and drop widgets to change their order
              </p>

              {customConfig && (
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="widgets">
                    {(provided) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="space-y-2"
                      >
                        {customConfig.widgets.map((widgetId, index) => {
                          const widget = availableWidgets.find(
                            (w) => w.id === widgetId,
                          );
                          if (!widget) return null;

                          return (
                            <Draggable
                              key={widgetId}
                              draggableId={widgetId}
                              index={index}
                            >
                              {(provided) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className="p-3 border rounded-md bg-white flex items-center justify-between"
                                >
                                  <div className="flex items-center space-x-3">
                                    <Layers className="h-4 w-4 text-gray-400" />
                                    <div className="flex items-center gap-2">
                                      {widget.icon}
                                      <span>{widget.name}</span>
                                    </div>
                                  </div>
                                  <Badge>{widget.size}</Badge>
                                </div>
                              )}
                            </Draggable>
                          );
                        })}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              )}
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setIsCustomizing(false)}>
              Cancel
            </Button>
            <Button onClick={saveDashboardConfig}>
              <Save className="h-4 w-4 mr-2" />
              Save Configuration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  description: string;
}

function MetricCard({ title, value, icon, description }: MetricCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
            <p className="text-xs text-gray-500 mt-1">{description}</p>
          </div>
          <div className="p-2 bg-gray-100 rounded-full">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}
