import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { LogLevel, AuthEventType } from "@/lib/auth.logger";

interface AuthLog {
  id: string;
  event_type: string;
  user_id?: string;
  email?: string;
  role?: string;
  ip_address?: string;
  user_agent?: string;
  details?: Record<string, any>;
  level: string;
  created_at: string;
}

interface FilterOptions {
  level?: string;
  event_type?: string;
  user_id?: string;
  email?: string;
  ip_address?: string;
  user_agent?: string;
  dateFrom?: string;
  dateTo?: string;
}

const AuthLogsViewer: React.FC = () => {
  const [logs, setLogs] = useState<AuthLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterOptions>({});
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const logsPerPage = 50;

  useEffect(() => {
    fetchLogs();
  }, [filters, activeTab, page]);

  const fetchLogs = async () => {
    try {
      setLoading(true);

      let query = supabase
        .from("auth_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .range((page - 1) * logsPerPage, page * logsPerPage - 1);

      // Apply tab filters
      if (activeTab === "security") {
        query = query.eq("level", LogLevel.SECURITY);
      } else if (activeTab === "errors") {
        query = query.eq("level", LogLevel.ERROR);
      } else if (activeTab === "warnings") {
        query = query.eq("level", LogLevel.WARNING);
      }

      // Apply additional filters
      if (filters.level && filters.level !== "all") {
        query = query.eq("level", filters.level);
      }

      if (filters.event_type && filters.event_type !== "all") {
        query = query.eq("event_type", filters.event_type);
      }

      if (filters.user_id) {
        query = query.eq("user_id", filters.user_id);
      }

      if (filters.email) {
        query = query.ilike("email", `%${filters.email}%`);
      }

      if (filters.ip_address) {
        query = query.ilike("ip_address", `%${filters.ip_address}%`);
      }

      if (filters.user_agent) {
        query = query.ilike("user_agent", `%${filters.user_agent}%`);
      }

      if (filters.dateFrom) {
        query = query.gte("created_at", filters.dateFrom);
      }

      if (filters.dateTo) {
        // Add one day to include the end date
        const endDate = new Date(filters.dateTo);
        endDate.setDate(endDate.getDate() + 1);
        query = query.lt("created_at", endDate.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;

      setLogs(data || []);
      setHasMore(data && data.length === logsPerPage);
    } catch (error) {
      console.error("Error fetching auth logs:", error);
      toast({
        title: "Error",
        description: "Failed to load authentication logs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof FilterOptions, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
    setPage(1); // Reset to first page when filters change
  };

  const handleSearch = () => {
    setPage(1);
    fetchLogs();
  };

  const handleClearFilters = () => {
    setFilters({});
    setSearchTerm("");
    setPage(1);
  };

  const getLevelBadge = (level: string) => {
    switch (level) {
      case LogLevel.ERROR:
        return <Badge variant="destructive">{level}</Badge>;
      case LogLevel.WARNING:
        return (
          <Badge variant="warning" className="bg-yellow-500">
            {level}
          </Badge>
        );
      case LogLevel.SECURITY:
        return (
          <Badge variant="outline" className="border-red-500 text-red-500">
            {level}
          </Badge>
        );
      case LogLevel.INFO:
      default:
        return <Badge variant="secondary">{level}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const filteredLogs = logs.filter((log) => {
    if (!searchTerm) return true;

    const searchLower = searchTerm.toLowerCase();
    return (
      (log.email && log.email.toLowerCase().includes(searchLower)) ||
      (log.user_id && log.user_id.toLowerCase().includes(searchLower)) ||
      (log.ip_address && log.ip_address.toLowerCase().includes(searchLower)) ||
      (log.event_type && log.event_type.toLowerCase().includes(searchLower))
    );
  });

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Authentication Logs</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter logs by various criteria</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium block mb-1">
                Log Level
              </label>
              <Select
                value={filters.level || "all"}
                onValueChange={(value) => handleFilterChange("level", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value={LogLevel.INFO}>Info</SelectItem>
                  <SelectItem value={LogLevel.WARNING}>Warning</SelectItem>
                  <SelectItem value={LogLevel.ERROR}>Error</SelectItem>
                  <SelectItem value={LogLevel.SECURITY}>Security</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium block mb-1">
                Event Type
              </label>
              <Select
                value={filters.event_type || "all"}
                onValueChange={(value) =>
                  handleFilterChange("event_type", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select event type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Events</SelectItem>
                  <SelectItem value={AuthEventType.LOGIN_SUCCESS}>
                    Login Success
                  </SelectItem>
                  <SelectItem value={AuthEventType.LOGIN_FAILURE}>
                    Login Failure
                  </SelectItem>
                  <SelectItem value={AuthEventType.LOGOUT}>Logout</SelectItem>
                  <SelectItem value={AuthEventType.REGISTER}>
                    Register
                  </SelectItem>
                  <SelectItem value={AuthEventType.PASSWORD_RESET_REQUEST}>
                    Password Reset Request
                  </SelectItem>
                  <SelectItem value={AuthEventType.MFA_ENABLED}>
                    MFA Enabled
                  </SelectItem>
                  <SelectItem value={AuthEventType.MFA_DISABLED}>
                    MFA Disabled
                  </SelectItem>
                  <SelectItem value={AuthEventType.SUSPICIOUS_ACTIVITY}>
                    Suspicious Activity
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium block mb-1">Email</label>
              <Input
                placeholder="Search by email"
                value={filters.email || ""}
                onChange={(e) => handleFilterChange("email", e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium block mb-1">User ID</label>
              <Input
                placeholder="Search by user ID"
                value={filters.user_id || ""}
                onChange={(e) => handleFilterChange("user_id", e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium block mb-1">
                IP Address
              </label>
              <Input
                placeholder="Search by IP address"
                value={filters.ip_address || ""}
                onChange={(e) =>
                  handleFilterChange("ip_address", e.target.value)
                }
              />
            </div>

            <div>
              <label className="text-sm font-medium block mb-1">
                User Agent
              </label>
              <Input
                placeholder="Search by user agent"
                value={filters.user_agent || ""}
                onChange={(e) =>
                  handleFilterChange("user_agent", e.target.value)
                }
              />
            </div>

            <div>
              <label className="text-sm font-medium block mb-1">
                From Date
              </label>
              <Input
                type="date"
                value={filters.dateFrom || ""}
                onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium block mb-1">To Date</label>
              <Input
                type="date"
                value={filters.dateTo || ""}
                onChange={(e) => handleFilterChange("dateTo", e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-between mt-4">
            <Button variant="outline" onClick={handleClearFilters}>
              Clear Filters
            </Button>
            <Button onClick={handleSearch}>Apply Filters</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Authentication Logs</CardTitle>
            <div className="flex items-center space-x-2">
              <Input
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All Logs</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="errors">Errors</TabsTrigger>
              <TabsTrigger value="warnings">Warnings</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="pt-4">
              {loading ? (
                <div className="text-center py-8">Loading logs...</div>
              ) : filteredLogs.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">
                    No logs found matching your criteria
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b">
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Time
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Level
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Event
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          IP Address
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Details
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLogs.map((log) => (
                        <tr key={log.id} className="border-b hover:bg-gray-50">
                          <td className="px-4 py-2 text-sm">
                            {formatDate(log.created_at)}
                          </td>
                          <td className="px-4 py-2 text-sm">
                            {getLevelBadge(log.level)}
                          </td>
                          <td className="px-4 py-2 text-sm">
                            {log.event_type}
                          </td>
                          <td className="px-4 py-2 text-sm">
                            {log.email || log.user_id || "Anonymous"}
                            {log.role && (
                              <span className="ml-1 text-xs text-gray-500">
                                ({log.role})
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2 text-sm">
                            {log.ip_address || "N/A"}
                          </td>
                          <td className="px-4 py-2 text-sm">
                            {log.details ? (
                              <details className="cursor-pointer">
                                <summary>View Details</summary>
                                <pre className="mt-2 p-2 bg-gray-50 rounded text-xs overflow-x-auto">
                                  {JSON.stringify(log.details, null, 2)}
                                </pre>
                              </details>
                            ) : (
                              "N/A"
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="flex justify-between items-center mt-4">
                <Button
                  variant="outline"
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                  disabled={page === 1 || loading}
                >
                  Previous
                </Button>
                <span className="text-sm">Page {page}</span>
                <Button
                  variant="outline"
                  onClick={() => setPage((prev) => prev + 1)}
                  disabled={!hasMore || loading}
                >
                  Next
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthLogsViewer;
