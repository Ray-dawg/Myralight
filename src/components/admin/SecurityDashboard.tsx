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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Shield,
  AlertTriangle,
  Lock,
  Key,
  UserX,
  RefreshCw,
  Eye,
  Download,
  Activity,
  Clock,
  FileText,
  FileSpreadsheet,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function SecurityDashboard() {
  const { toast } = useToast();
  const [isScanning, setIsScanning] = useState(false);
  const [showTwoFactorConfig, setShowTwoFactorConfig] = useState(false);
  const [showApiKeyManager, setShowApiKeyManager] = useState(false);
  const [showActivityLogs, setShowActivityLogs] = useState(false);

  // Two-factor configuration state
  const [twoFactorConfig, setTwoFactorConfig] = useState({
    requireForAll: false,
    exemptRoles: ["admin"],
    graceLoginCount: 3,
    enforcementDate: "",
  });

  // API keys state
  const [apiKeys, setApiKeys] = useState([
    {
      id: "api_key_1",
      name: "Production API Key",
      lastUsed: "2024-02-14",
      status: "active",
      scopes: ["read", "write"],
    },
    {
      id: "api_key_2",
      name: "Analytics API Key",
      lastUsed: "2024-02-10",
      status: "active",
      scopes: ["read"],
    },
    {
      id: "api_key_3",
      name: "Integration API Key",
      lastUsed: "2024-01-25",
      status: "inactive",
      scopes: ["read", "write", "delete"],
    },
  ]);

  // Activity logs state
  const [activityLogs, setActivityLogs] = useState([
    {
      id: "log_1",
      user: "admin@example.com",
      action: "Login",
      timestamp: "2024-02-15 14:32:45",
      ip: "192.168.1.1",
      status: "success",
    },
    {
      id: "log_2",
      user: "user@example.com",
      action: "Password change",
      timestamp: "2024-02-15 13:15:22",
      ip: "192.168.1.2",
      status: "success",
    },
    {
      id: "log_3",
      user: "unknown",
      action: "Login attempt",
      timestamp: "2024-02-15 12:45:10",
      ip: "203.0.113.1",
      status: "failed",
    },
    {
      id: "log_4",
      user: "admin@example.com",
      action: "User creation",
      timestamp: "2024-02-14 16:22:33",
      ip: "192.168.1.1",
      status: "success",
    },
    {
      id: "log_5",
      user: "user@example.com",
      action: "API key generation",
      timestamp: "2024-02-14 11:05:17",
      ip: "192.168.1.2",
      status: "success",
    },
  ]);

  const handleExportReport = () => {
    toast({
      title: "Exporting Security Report",
      description: "Your security report is being generated...",
    });

    setTimeout(() => {
      toast({
        title: "Export Complete",
        description: "Security report has been downloaded as PDF.",
        variant: "success",
      });
    }, 2000);
  };

  const handleSecurityScan = () => {
    setIsScanning(true);

    toast({
      title: "Scan Report",
      description: "Security scan in progress. This may take a few moments...",
    });

    setTimeout(() => {
      setIsScanning(false);
      toast({
        title: "Scan Report",
        description:
          "Security scan completed. No critical vulnerabilities found.",
        variant: "success",
      });
    }, 3000);
  };

  const handleTwoFactorConfigSave = () => {
    setShowTwoFactorConfig(false);

    toast({
      title: "Two-Factor Authentication Settings Updated",
      description: `Two-factor authentication will be required for ${twoFactorConfig.requireForAll ? "all users" : "most users with exceptions"}`,
      variant: "success",
    });
  };

  const handleApiKeyAction = (action: string, keyId: string) => {
    let message = "";

    switch (action) {
      case "revoke":
        setApiKeys(
          apiKeys.map((key) =>
            key.id === keyId ? { ...key, status: "inactive" } : key,
          ),
        );
        message = "API key has been revoked";
        break;
      case "regenerate":
        message = "API key has been regenerated";
        break;
      case "delete":
        setApiKeys(apiKeys.filter((key) => key.id !== keyId));
        message = "API key has been deleted";
        break;
    }

    toast({
      title: "API Key Updated",
      description: message,
      variant: "success",
    });
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Security Dashboard</h1>
          <p className="text-gray-500 mt-1">
            Monitor and manage system security
          </p>
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  toast({
                    title: "Exporting Vulnerability Report",
                    description:
                      "Your vulnerability report is being generated...",
                  });
                  setTimeout(() => {
                    toast({
                      title: "Export Complete",
                      description:
                        "Vulnerability report has been downloaded as PDF.",
                      variant: "success",
                    });
                  }, 2000);
                }}
              >
                <FileText className="h-4 w-4 mr-2" />
                Vulnerability Report
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  toast({
                    title: "Exporting Compliance Report",
                    description: "Your compliance report is being generated...",
                  });
                  setTimeout(() => {
                    toast({
                      title: "Export Complete",
                      description:
                        "Compliance report has been downloaded as PDF.",
                      variant: "success",
                    });
                  }, 2000);
                }}
              >
                <FileText className="h-4 w-4 mr-2" />
                Compliance Report
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  toast({
                    title: "Exporting Access Logs",
                    description: "Your access logs are being prepared...",
                  });
                  setTimeout(() => {
                    toast({
                      title: "Export Complete",
                      description: "Access logs have been downloaded as CSV.",
                      variant: "success",
                    });
                  }, 2000);
                }}
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Access Logs
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  toast({
                    title: "Exporting Security Audit",
                    description: "Your security audit is being generated...",
                  });
                  setTimeout(() => {
                    toast({
                      title: "Export Complete",
                      description: "Security audit has been downloaded as PDF.",
                      variant: "success",
                    });
                  }, 2000);
                }}
              >
                <FileText className="h-4 w-4 mr-2" />
                Security Audit
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            className="bg-black hover:bg-gray-800 text-white"
            onClick={handleSecurityScan}
            disabled={isScanning}
          >
            {isScanning ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Scanning...
              </>
            ) : (
              <>
                <Shield className="h-4 w-4 mr-2" />
                Security Scan
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Security Score</p>
                <p className="text-2xl font-bold">85%</p>
              </div>
              <Shield className="h-8 w-8 text-green-500" />
            </div>
            <Progress value={85} className="mt-4" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Failed Logins (24h)
                </p>
                <p className="text-2xl font-bold">23</p>
              </div>
              <UserX className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Threats</p>
                <p className="text-2xl font-bold">2</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Last Security Audit
                </p>
                <p className="text-2xl font-bold">2024-02-15</p>
              </div>
              <Activity className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Security Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 border rounded-lg">
                <div className="p-2 rounded-full bg-red-100">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between">
                    <p className="font-medium">
                      Multiple failed login attempts
                    </p>
                    <Badge className="bg-red-100 text-red-800">high</Badge>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">195.24.68.123</p>
                  <p className="text-xs text-gray-400 mt-1">10 minutes ago</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 border rounded-lg">
                <div className="p-2 rounded-full bg-yellow-100">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between">
                    <p className="font-medium">Admin permissions modified</p>
                    <Badge className="bg-yellow-100 text-yellow-800">
                      medium
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    admin@example.com
                  </p>
                  <p className="text-xs text-gray-400 mt-1">1 hour ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Security Controls</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Lock className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium">Two-Factor Authentication</p>
                    <p className="text-sm text-gray-500">
                      87% of users enabled
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-yellow-400 hover:bg-yellow-500 text-black border-yellow-500"
                  onClick={() => setShowTwoFactorConfig(true)}
                >
                  Configure
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Key className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium">API Key Management</p>
                    <p className="text-sm text-gray-500">12 active keys</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-yellow-400 hover:bg-yellow-500 text-black border-yellow-500"
                  onClick={() => setShowApiKeyManager(true)}
                >
                  Manage
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Eye className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium">Activity Monitoring</p>
                    <p className="text-sm text-gray-500">
                      Real-time tracking enabled
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-yellow-400 hover:bg-yellow-500 text-black border-yellow-500"
                  onClick={() => setShowActivityLogs(true)}
                >
                  View Logs
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <RefreshCw className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium">Automated Security Scans</p>
                    <p className="text-sm text-gray-500">
                      Next scan in 6 hours
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-yellow-400 hover:bg-yellow-500 text-black border-yellow-500"
                  onClick={handleSecurityScan}
                  disabled={isScanning}
                >
                  Run Now
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Two-Factor Authentication Configuration Dialog */}
      <Dialog open={showTwoFactorConfig} onOpenChange={setShowTwoFactorConfig}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Two-Factor Authentication Settings</DialogTitle>
            <DialogDescription>
              Configure two-factor authentication requirements for your
              organization.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="require-all" className="flex flex-col space-y-1">
                <span>Require for all users</span>
                <span className="font-normal text-sm text-gray-500">
                  Force all users to set up 2FA
                </span>
              </Label>
              <Switch
                id="require-all"
                checked={twoFactorConfig.requireForAll}
                onCheckedChange={(checked) =>
                  setTwoFactorConfig({
                    ...twoFactorConfig,
                    requireForAll: checked,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Exempt roles (if not required for all)</Label>
              <div className="grid grid-cols-2 gap-2">
                {["admin", "manager", "support", "readonly"].map((role) => (
                  <div key={role} className="flex items-center space-x-2">
                    <Checkbox
                      id={`role-${role}`}
                      checked={twoFactorConfig.exemptRoles.includes(role)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setTwoFactorConfig({
                            ...twoFactorConfig,
                            exemptRoles: [...twoFactorConfig.exemptRoles, role],
                          });
                        } else {
                          setTwoFactorConfig({
                            ...twoFactorConfig,
                            exemptRoles: twoFactorConfig.exemptRoles.filter(
                              (r) => r !== role,
                            ),
                          });
                        }
                      }}
                    />
                    <Label htmlFor={`role-${role}`}>{role}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="grace-period">Grace period login count</Label>
              <Input
                id="grace-period"
                type="number"
                value={twoFactorConfig.graceLoginCount}
                onChange={(e) =>
                  setTwoFactorConfig({
                    ...twoFactorConfig,
                    graceLoginCount: parseInt(e.target.value) || 0,
                  })
                }
                min="0"
                max="10"
              />
              <p className="text-sm text-gray-500">
                Number of logins allowed before 2FA is enforced
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="enforcement-date">Enforcement date</Label>
              <Input
                id="enforcement-date"
                type="date"
                value={twoFactorConfig.enforcementDate}
                onChange={(e) =>
                  setTwoFactorConfig({
                    ...twoFactorConfig,
                    enforcementDate: e.target.value,
                  })
                }
              />
              <p className="text-sm text-gray-500">
                When 2FA will become mandatory for all users
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowTwoFactorConfig(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleTwoFactorConfigSave}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* API Key Management Dialog */}
      <Dialog open={showApiKeyManager} onOpenChange={setShowApiKeyManager}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>API Key Management</DialogTitle>
            <DialogDescription>
              View and manage API keys used by the system.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[400px] overflow-y-auto">
            {apiKeys.map((key) => (
              <div key={key.id} className="border rounded-md p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">{key.name}</h4>
                    <p className="text-sm text-gray-500">ID: {key.id}</p>
                  </div>
                  <Badge
                    className={
                      key.status === "active"
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }
                  >
                    {key.status}
                  </Badge>
                </div>
                <div className="text-sm">
                  <p className="text-gray-500">Last used: {key.lastUsed}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {key.scopes.map((scope) => (
                      <Badge key={scope} variant="outline">
                        {scope}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  {key.status === "active" ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleApiKeyAction("revoke", key.id)}
                    >
                      Revoke
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleApiKeyAction("regenerate", key.id)}
                    >
                      Regenerate
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600"
                    onClick={() => handleApiKeyAction("delete", key.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowApiKeyManager(false)}
            >
              Close
            </Button>
            <Button>
              <Key className="h-4 w-4 mr-2" />
              Generate New Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Activity Logs Dialog */}
      <Dialog open={showActivityLogs} onOpenChange={setShowActivityLogs}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Activity Logs</DialogTitle>
            <DialogDescription>
              View detailed security and user activity logs.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[400px] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <Input placeholder="Search logs..." className="max-w-sm" />
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export Logs
              </Button>
            </div>

            <div className="border rounded-md divide-y">
              {activityLogs.map((log) => (
                <div key={log.id} className="p-3 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{log.action}</p>
                        <Badge
                          className={
                            log.status === "success"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }
                          variant="outline"
                        >
                          {log.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500">User: {log.user}</p>
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      <p>{log.timestamp}</p>
                      <p>IP: {log.ip}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowActivityLogs(false)}
            >
              Close
            </Button>
            <Button>
              <Eye className="h-4 w-4 mr-2" />
              View All Logs
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
