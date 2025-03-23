import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import {
  Loader2,
  Settings,
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import BolProcessingList from "./BolProcessingList";
import EmailConfigurationForm from "./EmailConfigurationForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const BolProcessingDashboard = () => {
  const [stats, setStats] = useState({
    totalConfigurations: 0,
    activeConfigurations: 0,
    totalTransmissions: 0,
    successfulTransmissions: 0,
    failedTransmissions: 0,
    pendingTransmissions: 0,
  });
  const [loading, setLoading] = useState(true);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);

  // Load dashboard statistics
  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);

      // Get configuration counts
      const { data: configData, error: configError } = await supabase
        .from("scheduled_tasks")
        .select("id, is_active")
        .eq("task_type", "BOL_SUBMISSION");

      if (configError) throw configError;

      // Get transmission stats
      const { data: transmissionData, error: transmissionError } =
        await supabase
          .from("document_submissions")
          .select("submission_status, count")
          .in("task_id", configData?.map((c) => c.id) || [])
          .group("submission_status");

      if (transmissionError) throw transmissionError;

      // Also get BOL document stats
      const { data: bolData, error: bolError } = await supabase
        .from("documents")
        .select("status, count")
        .eq("category", "bol")
        .group("status");

      if (bolError) throw bolError;

      // Calculate statistics
      const activeConfigs = configData?.filter((c) => c.is_active).length || 0;
      const totalConfigs = configData?.length || 0;

      const successfulCount =
        transmissionData?.find((t) => t.submission_status === "SENT")?.count ||
        0;
      const failedCount =
        transmissionData?.find((t) => t.submission_status === "FAILED")
          ?.count || 0;
      const pendingCount =
        transmissionData?.find((t) => t.submission_status === "PENDING")
          ?.count || 0;

      // Add BOL document counts to our transmission counts
      const verifiedCount =
        bolData?.find((b) => b.status === "verified")?.count || 0;
      const rejectedCount =
        bolData?.find((b) => b.status === "rejected")?.count || 0;
      const uploadedCount =
        bolData?.find((b) => b.status === "uploaded")?.count || 0;

      // Combine counts
      const totalSuccessful = successfulCount + verifiedCount;
      const totalFailed = failedCount + rejectedCount;
      const totalPending = pendingCount + uploadedCount;
      const totalCount = totalSuccessful + totalFailed + totalPending;

      setStats({
        totalConfigurations: totalConfigs,
        activeConfigurations: activeConfigs,
        totalTransmissions: totalCount,
        successfulTransmissions: totalSuccessful,
        failedTransmissions: totalFailed,
        pendingTransmissions: totalPending,
      });
    } catch (error) {
      console.error("Error loading dashboard statistics:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle email configuration success
  const handleEmailConfigSuccess = () => {
    setIsEmailDialogOpen(false);
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">BOL Processing Dashboard</h1>
          <p className="text-gray-500 mt-1">
            Manage BOL document transmission to payment providers
          </p>
        </div>
        <Button
          onClick={loadStats}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Loader2 className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Configurations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div className="text-2xl font-bold">
                {stats.totalConfigurations}
              </div>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.activeConfigurations} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Transmissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div className="text-2xl font-bold">
                {stats.totalTransmissions}
              </div>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.successfulTransmissions} successful,{" "}
              {stats.failedTransmissions} failed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Success Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div className="text-2xl font-bold">
                {stats.totalTransmissions > 0
                  ? Math.round(
                      (stats.successfulTransmissions /
                        stats.totalTransmissions) *
                        100,
                    )
                  : 0}
                %
              </div>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Based on {stats.totalTransmissions} transmissions
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="configurations" className="space-y-4">
        <TabsList>
          <TabsTrigger
            value="configurations"
            className="flex items-center gap-2"
          >
            <Settings className="h-4 w-4" /> Configurations
          </TabsTrigger>
          <TabsTrigger value="status" className="flex items-center gap-2">
            <Clock className="h-4 w-4" /> Status
          </TabsTrigger>
        </TabsList>

        <TabsContent value="configurations" className="space-y-4">
          <div className="flex justify-end">
            <Dialog
              open={isEmailDialogOpen}
              onOpenChange={setIsEmailDialogOpen}
            >
              <DialogTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Manage Email Settings
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl">
                <DialogHeader>
                  <DialogTitle>Email Configuration</DialogTitle>
                </DialogHeader>
                <EmailConfigurationForm
                  onSuccess={handleEmailConfigSuccess}
                  onCancel={() => setIsEmailDialogOpen(false)}
                />
              </DialogContent>
            </Dialog>
          </div>

          <BolProcessingList />
        </TabsContent>

        <TabsContent value="status" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Successful
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {stats.successfulTransmissions}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Documents successfully transmitted
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  Pending
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {stats.pendingTransmissions}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Documents waiting to be processed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-red-500" />
                  Failed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {stats.failedTransmissions}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Documents that failed to transmit
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Additional status information could go here */}
          <Card>
            <CardHeader>
              <CardTitle>Transmission Status</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                For detailed transmission history, select a configuration from
                the Configurations tab.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BolProcessingDashboard;
