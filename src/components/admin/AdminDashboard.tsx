import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import GeofenceManagement from "./GeofenceManagement";

const AdminDashboard = () => {
  const [activeSection, setActiveSection] = useState<
    "dashboard" | "geofence" | "loads"
  >("dashboard");

  return (
    <div className="p-6 space-y-6 bg-background">
      {activeSection === "dashboard" && (
        <>
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => setActiveSection("geofence")}
              >
                Geofence Management
              </Button>
              <Button
                variant="outline"
                onClick={() => setActiveSection("loads")}
              >
                Load Management
              </Button>
              <Button>System Settings</Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">Active Users</h3>
                <Badge
                  variant="outline"
                  className="bg-blue-50 text-blue-700 border-blue-200 flex items-center gap-1 text-xs"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 16v-4" />
                    <path d="M12 8h.01" />
                  </svg>
                  AI Enhanced
                </Badge>
              </div>
              <div className="text-3xl font-bold">1,245</div>
              <div className="text-sm text-muted-foreground mt-1">
                +12% from last month
              </div>
              <div className="mt-2 text-xs text-blue-700 bg-blue-50 p-2 rounded-md">
                <p>
                  User activity peaks between 8-10 AM. Consider scheduling
                  system maintenance after 8 PM when activity drops by 68%.
                </p>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">Active Loads</h3>
                <Badge
                  variant="outline"
                  className="bg-blue-50 text-blue-700 border-blue-200 flex items-center gap-1 text-xs"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 16v-4" />
                    <path d="M12 8h.01" />
                  </svg>
                  AI Enhanced
                </Badge>
              </div>
              <div className="text-3xl font-bold">328</div>
              <div className="text-sm text-muted-foreground mt-1">
                +5% from last week
              </div>
              <div className="mt-2 text-xs text-blue-700 bg-blue-50 p-2 rounded-md">
                <p>
                  92% of loads are on schedule. 26 loads at risk of delay in the
                  Midwest region due to weather conditions.
                </p>
              </div>
            </Card>
            <Card className="p-4">
              <h3 className="font-medium mb-2">System Health</h3>
              <div className="flex items-center space-x-2">
                <Badge className="bg-green-500">All Systems Operational</Badge>
              </div>
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2 flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mr-1"
                  >
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                  </svg>
                  AI Prediction Accuracy
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span>ETA Predictions</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500"
                          style={{ width: "94%" }}
                        ></div>
                      </div>
                      <span>94%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span>Weather Impact</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500"
                          style={{ width: "87%" }}
                        ></div>
                      </div>
                      <span>87%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span>Traffic Predictions</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-yellow-500"
                          style={{ width: "78%" }}
                        ></div>
                      </div>
                      <span>78%</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <Tabs defaultValue="users">
            <TabsList className="grid w-full md:w-auto grid-cols-4 md:grid-cols-4">
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="loads">Loads</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
              <TabsTrigger value="logs">System Logs</TabsTrigger>
            </TabsList>
            <TabsContent value="users" className="space-y-4">
              <Card className="p-4">
                <h3 className="font-medium mb-4">Recent User Activity</h3>
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className="flex justify-between items-center p-2 border-b"
                    >
                      <div>
                        <div className="font-medium">User #{i}</div>
                        <div className="text-sm text-muted-foreground">
                          Last active: 2 hours ago
                        </div>
                      </div>
                      <Badge variant={i % 2 === 0 ? "outline" : "default"}>
                        {i % 2 === 0 ? "Driver" : "Shipper"}
                      </Badge>
                    </div>
                  ))}
                </div>
                <Button variant="link" className="mt-2">
                  View All Users
                </Button>
              </Card>
            </TabsContent>
            <TabsContent value="loads" className="space-y-4">
              <Card className="p-4">
                <h3 className="font-medium mb-4">Recent Loads</h3>
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className="flex justify-between items-center p-2 border-b"
                    >
                      <div>
                        <div className="font-medium">Load #{1000 + i}</div>
                        <div className="text-sm text-muted-foreground">
                          Created: Today
                        </div>
                      </div>
                      <Badge
                        variant={
                          i % 3 === 0
                            ? "destructive"
                            : i % 3 === 1
                              ? "default"
                              : "outline"
                        }
                      >
                        {i % 3 === 0
                          ? "Delayed"
                          : i % 3 === 1
                            ? "In Transit"
                            : "Delivered"}
                      </Badge>
                    </div>
                  ))}
                </div>
                <Button variant="link" className="mt-2">
                  View All Loads
                </Button>
              </Card>
            </TabsContent>
            <TabsContent value="reports" className="space-y-4">
              <Card className="p-4">
                <h3 className="font-medium mb-4">Available Reports</h3>
                <div className="space-y-2">
                  {[
                    "Monthly Activity Summary",
                    "User Registration Trends",
                    "Load Completion Rates",
                    "System Performance Metrics",
                    "Financial Overview",
                  ].map((report, i) => (
                    <div
                      key={i}
                      className="flex justify-between items-center p-2 border-b"
                    >
                      <div className="font-medium">{report}</div>
                      <Button size="sm" variant="outline">
                        Generate
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>
            <TabsContent value="logs" className="space-y-4">
              <Card className="p-4">
                <h3 className="font-medium mb-4">Recent System Logs</h3>
                <div className="space-y-2 text-sm font-mono bg-muted p-2 rounded">
                  {[
                    "[INFO] System startup completed successfully",
                    "[INFO] Database backup completed",
                    "[WARN] High CPU usage detected",
                    "[INFO] 125 new users registered today",
                    "[ERROR] Failed to connect to external payment service",
                  ].map((log, i) => (
                    <div
                      key={i}
                      className={`p-1 ${log.includes("[ERROR]") ? "text-red-500" : log.includes("[WARN]") ? "text-yellow-500" : ""}`}
                    >
                      {log}
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-blue-700 flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="mr-1"
                      >
                        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                      </svg>
                      AI Log Analysis
                    </h4>
                    <Badge
                      variant="outline"
                      className="bg-blue-50 text-blue-700 border-blue-200 flex items-center gap-1 text-xs"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="10"
                        height="10"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 16v-4" />
                        <path d="M12 8h.01" />
                      </svg>
                      AI Enhanced
                    </Badge>
                  </div>
                  <div className="text-sm text-blue-700">
                    <p className="mb-2">
                      Detected patterns in system logs suggest:
                    </p>
                    <ul className="list-disc pl-5 space-y-1 text-xs">
                      <li>
                        Payment service connection failures have increased by
                        15% in the last 24 hours
                      </li>
                      <li>
                        CPU usage spikes correlate with batch processing at 2:00
                        AM
                      </li>
                      <li>
                        Recommended action: Check payment service API
                        credentials and consider rescheduling batch jobs
                      </li>
                    </ul>
                    <div className="flex justify-between items-center mt-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs">Confidence:</span>
                        <div className="w-20 h-2 bg-blue-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-600"
                            style={{ width: "89%" }}
                          ></div>
                        </div>
                        <span className="text-xs">89%</span>
                      </div>
                      <div className="flex gap-2">
                        <button className="text-xs flex items-center gap-1 text-blue-700 hover:text-blue-900">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                          </svg>
                          Helpful
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <Button variant="link" className="mt-2">
                  View All Logs
                </Button>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}

      {activeSection === "geofence" && (
        <>
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Geofence Management</h1>
            <Button
              variant="outline"
              onClick={() => setActiveSection("dashboard")}
            >
              Back to Dashboard
            </Button>
          </div>
          <GeofenceManagement />
        </>
      )}

      {activeSection === "loads" && (
        <>
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Load Management</h1>
            <Button
              variant="outline"
              onClick={() => setActiveSection("dashboard")}
            >
              Back to Dashboard
            </Button>
          </div>
          {/* LoadManagement component would be imported and used here */}
          <div className="p-6 bg-white rounded-lg shadow">
            <p className="text-center text-gray-500">
              Load Management interface will be displayed here
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
