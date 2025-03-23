import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Database,
  HardDrive,
  Server,
  Download,
  Upload,
  Trash2,
  BarChart,
  Clock,
  AlertTriangle,
  FileText,
  FileSpreadsheet,
  File,
  Archive,
  FilePlus2,
} from "lucide-react";

export default function DataDashboard() {
  const { toast } = useToast();
  const [showPurgeDialog, setShowPurgeDialog] = useState(false);
  const [purgeType, setPurgeType] = useState<string>("");

  return (
    <div className="p-6 space-y-6 bg-gray-50">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Data Management</h1>
          <p className="text-gray-500 mt-1">
            Manage system data, backups, and storage
          </p>
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  toast({
                    title: "Importing User Data",
                    description: "Please select a file to import user data.",
                  });
                  // Simulate file selection and import process
                  setTimeout(() => {
                    toast({
                      title: "Import Successful",
                      description: "User data has been imported successfully.",
                      variant: "success",
                    });
                  }, 2000);
                }}
              >
                <FilePlus2 className="h-4 w-4 mr-2" />
                Import User Data
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  toast({
                    title: "Importing System Configuration",
                    description:
                      "Please select a configuration file to import.",
                  });
                  // Simulate file selection and import process
                  setTimeout(() => {
                    toast({
                      title: "Import Successful",
                      description:
                        "System configuration has been imported successfully.",
                      variant: "success",
                    });
                  }, 2000);
                }}
              >
                <Archive className="h-4 w-4 mr-2" />
                Import Configuration
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  toast({
                    title: "Importing Database Backup",
                    description:
                      "Please select a database backup file to restore.",
                  });
                  // Simulate file selection and import process
                  setTimeout(() => {
                    toast({
                      title: "Import Successful",
                      description:
                        "Database backup has been restored successfully.",
                      variant: "success",
                    });
                  }, 2000);
                }}
              >
                <Database className="h-4 w-4 mr-2" />
                Restore Database Backup
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  toast({
                    title: "Exporting as PDF",
                    description: "Your data is being prepared for download.",
                  });
                  setTimeout(() => {
                    toast({
                      title: "Export Complete",
                      description: "Data has been exported as PDF.",
                      variant: "success",
                    });
                  }, 1500);
                }}
              >
                <FileText className="h-4 w-4 mr-2" />
                Export as PDF
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  toast({
                    title: "Exporting as CSV",
                    description: "Your data is being prepared for download.",
                  });
                  setTimeout(() => {
                    toast({
                      title: "Export Complete",
                      description: "Data has been exported as CSV.",
                      variant: "success",
                    });
                  }, 1500);
                }}
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  toast({
                    title: "Exporting as Excel",
                    description: "Your data is being prepared for download.",
                  });
                  setTimeout(() => {
                    toast({
                      title: "Export Complete",
                      description: "Data has been exported as Excel.",
                      variant: "success",
                    });
                  }, 1500);
                }}
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Export as Excel
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  toast({
                    title: "Creating Database Backup",
                    description: "Your database backup is being prepared.",
                  });
                  setTimeout(() => {
                    toast({
                      title: "Backup Complete",
                      description:
                        "Database backup has been created and downloaded.",
                      variant: "success",
                    });
                  }, 2000);
                }}
              >
                <Database className="h-4 w-4 mr-2" />
                Database Backup
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="text-red-600">
                <Trash2 className="h-4 w-4 mr-2" />
                Purge
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete
                  selected data from our servers.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="py-4">
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => setPurgeType("logs")}
                  >
                    <File className="h-4 w-4 mr-2" />
                    Purge System Logs
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => setPurgeType("temp")}
                  >
                    <File className="h-4 w-4 mr-2" />
                    Purge Temporary Files
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => setPurgeType("archive")}
                  >
                    <Archive className="h-4 w-4 mr-2" />
                    Purge Archived Data
                  </Button>
                </div>
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-red-600 hover:bg-red-700"
                  onClick={() => {
                    if (!purgeType) {
                      toast({
                        title: "No Purge Type Selected",
                        description:
                          "Please select what data you want to purge.",
                        variant: "destructive",
                      });
                      return;
                    }

                    toast({
                      title: "Purging Data",
                      description: `${purgeType === "logs" ? "System logs" : purgeType === "temp" ? "Temporary files" : "Archived data"} are being purged.`,
                    });

                    setTimeout(() => {
                      toast({
                        title: "Purge Complete",
                        description: `${purgeType === "logs" ? "System logs" : purgeType === "temp" ? "Temporary files" : "Archived data"} have been successfully purged.`,
                        variant: "success",
                      });
                      setPurgeType("");
                    }, 2000);
                  }}
                >
                  Purge Data
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Database Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-blue-500" />
                  <span className="font-medium">Main Database</span>
                </div>
                <Badge className="bg-green-100 text-green-800">Healthy</Badge>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Size</span>
                  <span>1.2 TB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Records</span>
                  <span>24.5M</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Last Backup</span>
                  <span>Today, 04:30 AM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Uptime</span>
                  <span>99.98%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Storage Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <HardDrive className="h-5 w-5 text-purple-500" />
                  <span className="font-medium">System Storage</span>
                </div>
                <Badge className="bg-yellow-100 text-yellow-800">
                  75% Used
                </Badge>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Space</span>
                  <span>4 TB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Used</span>
                  <span>3 TB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Available</span>
                  <span>1 TB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Growth Rate</span>
                  <span>+2.5% / month</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Backup Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Server className="h-5 w-5 text-green-500" />
                  <span className="font-medium">Backup Server</span>
                </div>
                <Badge className="bg-green-100 text-green-800">Active</Badge>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Last Backup</span>
                  <span>Today, 04:30 AM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Backup Size</span>
                  <span>1.1 TB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Retention</span>
                  <span>30 days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Next Backup</span>
                  <span>Tomorrow, 04:30 AM</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Data Operations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              {
                operation: "Database Backup",
                status: "success",
                time: "Today, 04:30 AM",
                details: "Full backup completed successfully",
                size: "1.1 TB",
              },
              {
                operation: "Data Import",
                status: "success",
                time: "Yesterday, 02:15 PM",
                details: "Imported user data from legacy system",
                size: "250 MB",
              },
              {
                operation: "Log Rotation",
                status: "success",
                time: "Yesterday, 12:00 AM",
                details: "System logs rotated and archived",
                size: "500 MB",
              },
              {
                operation: "Data Export",
                status: "warning",
                time: "2 days ago, 11:45 AM",
                details: "Partial export completed with warnings",
                size: "800 MB",
              },
              {
                operation: "Database Optimization",
                status: "success",
                time: "3 days ago, 03:30 AM",
                details: "Indexes rebuilt and tables optimized",
                size: "N/A",
              },
            ].map((operation, index) => (
              <div
                key={index}
                className="flex items-start justify-between border-b pb-4 last:border-0 last:pb-0"
              >
                <div className="flex items-start gap-4">
                  <div className="mt-1">
                    {operation.status === "success" ? (
                      <BarChart className="h-5 w-5 text-green-500" />
                    ) : operation.status === "warning" ? (
                      <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{operation.operation}</p>
                    <p className="text-sm text-gray-500">{operation.details}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={`${operation.status === "success" ? "border-green-500 text-green-600" : operation.status === "warning" ? "border-yellow-500 text-yellow-600" : "border-red-500 text-red-600"}`}
                    >
                      {operation.status}
                    </Badge>
                    <span className="text-sm">{operation.size}</span>
                  </div>
                  <p className="text-sm text-gray-500 flex items-center justify-end mt-1">
                    <Clock className="h-3 w-3 mr-1" />
                    {operation.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
