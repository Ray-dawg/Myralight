import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Activity,
  Database,
  Server,
  Cpu,
  HardDrive,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Download,
} from "lucide-react";

interface SystemMetric {
  name: string;
  value: number;
  status: "healthy" | "warning" | "critical";
  trend?: "up" | "down";
  unit?: string;
}

interface ServiceStatus {
  name: string;
  status: "operational" | "degraded" | "down";
  uptime: string;
  lastIncident?: string;
}

export default function SystemHealth() {
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showExportLogsDialog, setShowExportLogsDialog] = useState(false);
  const [exportOptions, setExportOptions] = useState({
    logType: "system",
    timeRange: "24h",
    format: "csv",
  });

  const [metrics, setMetrics] = useState<SystemMetric[]>([
    {
      name: "CPU Usage",
      value: 45,
      status: "healthy",
      trend: "up",
      unit: "%",
    },
    {
      name: "Memory Usage",
      value: 72,
      status: "warning",
      trend: "up",
      unit: "%",
    },
    {
      name: "Disk Space",
      value: 68,
      status: "healthy",
      unit: "%",
    },
    {
      name: "Network Load",
      value: 42,
      status: "healthy",
      trend: "down",
      unit: "%",
    },
  ]);

  const [services, setServices] = useState<ServiceStatus[]>([
    {
      name: "API Gateway",
      status: "operational",
      uptime: "99.99%",
    },
    {
      name: "Database Cluster",
      status: "degraded",
      uptime: "99.95%",
      lastIncident: "2 hours ago",
    },
    {
      name: "Authentication Service",
      status: "operational",
      uptime: "99.99%",
    },
    {
      name: "Storage Service",
      status: "operational",
      uptime: "99.99%",
    },
  ]);

  const getStatusBadge = (status: ServiceStatus["status"]) => {
    const styles = {
      operational: "bg-green-100 text-green-800",
      degraded: "bg-yellow-100 text-yellow-800",
      down: "bg-red-100 text-red-800",
    };

    return <Badge className={styles[status]}>{status.toUpperCase()}</Badge>;
  };

  const getMetricStatus = (metric: SystemMetric) => {
    const styles = {
      healthy: "text-green-600",
      warning: "text-yellow-600",
      critical: "text-red-600",
    };

    return (
      <div className={`flex items-center ${styles[metric.status]}`}>
        {metric.status === "healthy" ? (
          <CheckCircle2 className="h-5 w-5" />
        ) : (
          <AlertTriangle className="h-5 w-5" />
        )}
      </div>
    );
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    toast({
      title: "Refreshing System Data",
      description: "Fetching the latest system metrics and status...",
    });

    // Simulate data refresh
    setTimeout(() => {
      // Update metrics with random changes
      const updatedMetrics = metrics.map((metric) => {
        const change = Math.floor(Math.random() * 10) - 5; // Random change between -5 and +5
        let newValue = metric.value + change;

        // Keep values within reasonable bounds
        if (metric.unit === "%") {
          newValue = Math.max(0, Math.min(100, newValue));
        }

        // Update status based on new value
        let status = metric.status;
        if (metric.unit === "%") {
          if (newValue > 90) status = "critical";
          else if (newValue > 70) status = "warning";
          else status = "healthy";
        }

        // Update trend
        const trend = change > 0 ? "up" : change < 0 ? "down" : metric.trend;

        return {
          ...metric,
          value: newValue,
          status,
          trend,
        };
      });

      setMetrics(updatedMetrics);
      setIsRefreshing(false);

      toast({
        title: "Refresh Complete",
        description: "System data has been updated successfully.",
        variant: "success",
      });
    }, 2000);
  };

  const handleExportLogs = () => {
    if (!exportOptions.logType || !exportOptions.timeRange) {
      toast({
        title: "Missing Information",
        description: "Please select log type and time range.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Exporting Logs",
      description: `Preparing ${exportOptions.logType} logs for the last ${exportOptions.timeRange}...`,
    });

    setTimeout(() => {
      toast({
        title: "Export Complete",
        description: `${exportOptions.logType} logs have been downloaded as ${exportOptions.format.toUpperCase()}.`,
        variant: "success",
      });
      setShowExportLogsDialog(false);
    }, 1500);
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">System Health</h1>
          <p className="text-gray-500 mt-1">
            Monitor system performance and status
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowExportLogsDialog(true)}
            className="bg-yellow-400 hover:bg-yellow-500 text-black border-yellow-500"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Logs
          </Button>
          <Button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="bg-black hover:bg-gray-800 text-white"
          >
            {isRefreshing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Refreshing...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <Card key={metric.name}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-muted-foreground">{metric.name}</p>
                  <p className="text-2xl font-bold mt-2">
                    {metric.value}
                    {metric.unit}
                  </p>
                </div>
                {getMetricStatus(metric)}
              </div>
              <Progress value={metric.value} />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Service Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {services.map((service) => (
              <div
                key={service.name}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Server className="h-5 w-5 text-gray-400" />
                    <p className="font-medium">{service.name}</p>
                  </div>
                  <p className="text-sm text-gray-500">
                    Uptime: {service.uptime}
                    {service.lastIncident &&
                      ` • Last incident: ${service.lastIncident}`}
                  </p>
                </div>
                {getStatusBadge(service.status)}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>System Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] overflow-y-auto bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm">
              <div className="space-y-2">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="flex">
                    <span className="text-gray-500 mr-4">
                      {new Date().toISOString()}
                    </span>
                    <span className="text-green-400">[INFO]</span>
                    <span className="ml-2">System health check completed</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resource Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>CPU Usage</span>
                  <span>45%</span>
                </div>
                <Progress value={45} />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Memory Usage</span>
                  <span>72%</span>
                </div>
                <Progress value={72} />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Disk Usage</span>
                  <span>68%</span>
                </div>
                <Progress value={68} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Export Logs Dialog */}
      <Dialog
        open={showExportLogsDialog}
        onOpenChange={setShowExportLogsDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export System Logs</DialogTitle>
            <DialogDescription>
              Select the type of logs and time range to export.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="log-type">Log Type</Label>
              <Select
                value={exportOptions.logType}
                onValueChange={(value) =>
                  setExportOptions({ ...exportOptions, logType: value })
                }
              >
                <SelectTrigger id="log-type">
                  <SelectValue placeholder="Select log type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="system">System Logs</SelectItem>
                  <SelectItem value="application">Application Logs</SelectItem>
                  <SelectItem value="security">Security Logs</SelectItem>
                  <SelectItem value="database">Database Logs</SelectItem>
                  <SelectItem value="access">Access Logs</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="time-range">Time Range</Label>
              <Select
                value={exportOptions.timeRange}
                onValueChange={(value) =>
                  setExportOptions({ ...exportOptions, timeRange: value })
                }
              >
                <SelectTrigger id="time-range">
                  <SelectValue placeholder="Select time range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="24h">Last 24 Hours</SelectItem>
                  <SelectItem value="7d">Last 7 Days</SelectItem>
                  <SelectItem value="30d">Last 30 Days</SelectItem>
                  <SelectItem value="90d">Last 90 Days</SelectItem>
                  <SelectItem value="all">All Available Logs</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="export-format">Export Format</Label>
              <Select
                value={exportOptions.format}
                onValueChange={(value) =>
                  setExportOptions({ ...exportOptions, format: value })
                }
              >
                <SelectTrigger id="export-format">
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                  <SelectItem value="txt">Plain Text</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowExportLogsDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleExportLogs}>Export Logs</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
