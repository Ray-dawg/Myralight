import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Download,
  FileText,
  Mail,
  RefreshCw,
  Settings,
  XCircle,
} from "lucide-react";
import BolProcessingConfig from "../BolProcessingConfig";
import BolProcessingList from "../BolProcessingList";

// Mock data for dashboard statistics
const mockStats = {
  totalDocuments: 156,
  processedToday: 12,
  successRate: 94,
  pendingPayments: 8,
  failedTransmissions: 3,
  recentActivity: [
    {
      id: "ACT-001",
      type: "email",
      status: "success",
      message: "BOL-1005 sent to Express Cargo LLC",
      timestamp: "2023-06-17T10:05:00",
    },
    {
      id: "ACT-002",
      type: "payment",
      status: "pending",
      message: "Payment processing for BOL-1004",
      timestamp: "2023-06-16T11:35:00",
    },
    {
      id: "ACT-003",
      type: "email",
      status: "failed",
      message: "Failed to send BOL-1003 to FastFreight Services",
      timestamp: "2023-06-16T09:20:00",
    },
    {
      id: "ACT-004",
      type: "payment",
      status: "success",
      message: "Payment received for BOL-1001",
      timestamp: "2023-06-15T16:30:00",
    },
    {
      id: "ACT-005",
      type: "system",
      status: "info",
      message: "Daily email digest sent",
      timestamp: "2023-06-15T08:00:00",
    },
  ],
};

const StatusIcon = ({ status }: { status: string }) => {
  switch (status) {
    case "success":
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    case "pending":
      return <Clock className="w-4 h-4 text-yellow-500" />;
    case "failed":
      return <XCircle className="w-4 h-4 text-red-500" />;
    case "info":
      return <AlertCircle className="w-4 h-4 text-blue-500" />;
    default:
      return null;
  }
};

const ActivityTypeIcon = ({ type }: { type: string }) => {
  switch (type) {
    case "email":
      return <Mail className="w-4 h-4" />;
    case "payment":
      return <RefreshCw className="w-4 h-4" />;
    case "system":
      return <Settings className="w-4 h-4" />;
    default:
      return <FileText className="w-4 h-4" />;
  }
};

export default function BolProcessingDashboard() {
  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">BOL Processing Dashboard</h1>
        <Button>
          <Settings className="w-4 h-4 mr-2" />
          Configure
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Total Documents
                </p>
                <h3 className="text-3xl font-bold">
                  {mockStats.totalDocuments}
                </h3>
              </div>
              <div className="p-2 bg-blue-100 rounded-full">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">+5% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Processed Today
                </p>
                <h3 className="text-3xl font-bold">
                  {mockStats.processedToday}
                </h3>
              </div>
              <div className="p-2 bg-green-100 rounded-full">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">+2 since yesterday</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Success Rate
                </p>
                <h3 className="text-3xl font-bold">{mockStats.successRate}%</h3>
              </div>
              <div className="p-2 bg-green-100 rounded-full">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <Progress value={mockStats.successRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Pending Payments
                </p>
                <h3 className="text-3xl font-bold">
                  {mockStats.pendingPayments}
                </h3>
              </div>
              <div className="p-2 bg-yellow-100 rounded-full">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">Requires attention</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest BOL processing events and notifications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockStats.recentActivity.map((activity, index) => (
                <div key={activity.id}>
                  <div className="flex items-start">
                    <div className="mr-2">
                      <StatusIcon status={activity.status} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center">
                        <Badge variant="outline" className="mr-2">
                          <ActivityTypeIcon type={activity.type} />
                          <span className="ml-1 capitalize">
                            {activity.type}
                          </span>
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {new Date(activity.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm mt-1">{activity.message}</p>
                    </div>
                  </div>
                  {index < mockStats.recentActivity.length - 1 && (
                    <Separator className="my-4" />
                  )}
                </div>
              ))}
            </div>
            <div className="mt-4 text-center">
              <Button variant="outline" size="sm">
                View All Activity
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <CardDescription>
              Current BOL processing system status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  <span className="text-sm">Email Service</span>
                </div>
                <Badge className="bg-green-500">Operational</Badge>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  <span className="text-sm">Payment Processing</span>
                </div>
                <Badge className="bg-green-500">Operational</Badge>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  <span className="text-sm">Document Storage</span>
                </div>
                <Badge className="bg-green-500">Operational</Badge>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Clock className="w-4 h-4 text-yellow-500 mr-2" />
                  <span className="text-sm">OCR Processing</span>
                </div>
                <Badge className="bg-yellow-500">Degraded</Badge>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  <span className="text-sm">API Services</span>
                </div>
                <Badge className="bg-green-500">Operational</Badge>
              </div>
            </div>

            <div className="mt-6">
              <h4 className="text-sm font-medium mb-2">Last System Check</h4>
              <p className="text-xs text-gray-500">
                {new Date().toLocaleString()}
              </p>
              <Button variant="outline" size="sm" className="mt-4 w-full">
                <RefreshCw className="w-4 h-4 mr-2" />
                Run System Check
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="list" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="list">Transmission History</TabsTrigger>
          <TabsTrigger value="config">Configuration</TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <BolProcessingList />
        </TabsContent>

        <TabsContent value="config">
          <BolProcessingConfig />
        </TabsContent>
      </Tabs>
    </div>
  );
}
