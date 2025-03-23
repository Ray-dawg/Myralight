import { useState } from "react";
import LoadsDashboard from "./LoadsDashboard";
import LoadDetailsDialog from "./LoadDetailsDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "convex/react";
import { api } from "@/lib/convex/_generated/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Truck,
  Package,
  Clock,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";

type UserRole = "admin" | "shipper" | "carrier" | "driver";

interface RoleBasedDashboardProps {
  userRole: UserRole;
  userId?: string;
}

export default function RoleBasedDashboard({
  userRole,
  userId,
}: RoleBasedDashboardProps) {
  const [selectedLoadId, setSelectedLoadId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("loads");

  // Get load statistics
  const loadStats = useQuery(api.loads.getLoadStats);

  // Format status counts for charts
  const getStatusData = () => {
    if (!loadStats?.statusCounts) return [];

    return Object.entries(loadStats.statusCounts).map(([status, count]) => ({
      name: status.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase()),
      value: count,
    }));
  };

  // Colors for pie chart
  const COLORS = [
    "#0088FE",
    "#00C49F",
    "#FFBB28",
    "#FF8042",
    "#8884D8",
    "#82CA9D",
    "#FF6B6B",
  ];

  // Mock data for charts
  const monthlyData = [
    { name: "Jan", loads: 65 },
    { name: "Feb", loads: 78 },
    { name: "Mar", loads: 92 },
    { name: "Apr", loads: 85 },
    { name: "May", loads: 110 },
    { name: "Jun", loads: 125 },
  ];

  // Get role-specific dashboard title
  const getDashboardTitle = () => {
    switch (userRole) {
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

  return (
    <div className="p-6 space-y-6 bg-gray-50">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{getDashboardTitle()}</h1>
      </div>

      {userRole !== "driver" && (
        <Tabs
          defaultValue="loads"
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="mb-4">
            <TabsTrigger value="loads">Loads</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="loads" className="p-0">
            <LoadsDashboard userRole={userRole} userId={userId} />
          </TabsContent>

          <TabsContent value="analytics" className="p-0">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <MetricCard
                title="Total Loads"
                value={loadStats?.totalLoads || 0}
                icon={<Package className="h-5 w-5 text-blue-500" />}
                description="All time"
              />
              <MetricCard
                title="Active Loads"
                value={
                  (loadStats?.statusCounts?.assigned || 0) +
                  (loadStats?.statusCounts?.in_transit || 0)
                }
                icon={<Truck className="h-5 w-5 text-yellow-500" />}
                description="Assigned or in transit"
              />
              <MetricCard
                title="Completed Loads"
                value={loadStats?.statusCounts?.completed || 0}
                icon={<CheckCircle className="h-5 w-5 text-green-500" />}
                description="Successfully delivered"
              />
              <MetricCard
                title="Average Rate"
                value={`$${((loadStats?.averageRate || 0) / 100).toFixed(2)}`}
                icon={<TrendingUp className="h-5 w-5 text-purple-500" />}
                description="Per load"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Load Status Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={getStatusData()}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) =>
                            `${name}: ${(percent * 100).toFixed(0)}%`
                          }
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {getStatusData().map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Monthly Load Volume</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar
                          dataKey="loads"
                          fill="#8884d8"
                          name="Number of Loads"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      )}

      {userRole === "driver" && (
        <LoadsDashboard userRole={userRole} userId={userId} />
      )}

      {selectedLoadId && (
        <LoadDetailsDialog
          loadId={selectedLoadId}
          isOpen={!!selectedLoadId}
          onClose={() => setSelectedLoadId(null)}
          userRole={userRole}
        />
      )}
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
