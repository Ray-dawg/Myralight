import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Upload,
  Download,
  FileSpreadsheet,
  Users,
  CheckCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  Plus,
  Search,
  Filter,
  FileText,
} from "lucide-react";

interface BatchJob {
  id: string;
  type: "import" | "export" | "update";
  status: "running" | "completed" | "failed";
  progress: number;
  totalItems: number;
  processedItems: number;
  startTime: string;
  description: string;
  error?: string;
}

export default function BatchOperations() {
  const { toast } = useToast();
  const [batchJobs, setBatchJobs] = useState<BatchJob[]>([
    {
      id: "BATCH-001",
      type: "import",
      status: "completed",
      progress: 100,
      totalItems: 500,
      processedItems: 500,
      startTime: "2024-02-20 10:30 AM",
      description: "User import from CSV",
    },
    {
      id: "BATCH-002",
      type: "update",
      status: "running",
      progress: 45,
      totalItems: 1000,
      processedItems: 450,
      startTime: "2024-02-20 11:15 AM",
      description: "Bulk rate update",
    },
    {
      id: "BATCH-003",
      type: "export",
      status: "failed",
      progress: 30,
      totalItems: 200,
      processedItems: 60,
      startTime: "2024-02-20 11:00 AM",
      description: "Document export",
      error: "Network timeout",
    },
  ]);

  const [showNewJobDialog, setShowNewJobDialog] = useState(false);
  const [showExportTemplateDialog, setShowExportTemplateDialog] =
    useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showRetryDialog, setShowRetryDialog] = useState(false);
  const [selectedJob, setSelectedJob] = useState<BatchJob | null>(null);

  // New job form state
  const [newJob, setNewJob] = useState({
    name: "",
    type: "",
    description: "",
    file: null as File | null,
  });

  // Export template form state
  const [exportTemplate, setExportTemplate] = useState({
    type: "",
    format: "csv",
  });

  const getStatusBadge = (status: BatchJob["status"]) => {
    const styles = {
      running: "bg-blue-100 text-blue-800",
      completed: "bg-green-100 text-green-800",
      failed: "bg-red-100 text-red-800",
    };

    return <Badge className={styles[status]}>{status.toUpperCase()}</Badge>;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setNewJob({ ...newJob, file: e.target.files[0] });
    }
  };

  const handleCreateJob = () => {
    if (!newJob.name || !newJob.type || !newJob.file) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields and upload a file.",
        variant: "destructive",
      });
      return;
    }

    const newBatchJob: BatchJob = {
      id: `BATCH-${(batchJobs.length + 1).toString().padStart(3, "0")}`,
      type: newJob.type as "import" | "export" | "update",
      status: "running",
      progress: 0,
      totalItems: Math.floor(Math.random() * 1000) + 100,
      processedItems: 0,
      startTime: new Date().toLocaleString(),
      description: newJob.description || newJob.name,
    };

    setBatchJobs([newBatchJob, ...batchJobs]);
    setShowNewJobDialog(false);
    setNewJob({
      name: "",
      type: "",
      description: "",
      file: null,
    });

    toast({
      title: "Batch Job Created",
      description: `${newBatchJob.description} has been started.`,
      variant: "success",
    });

    // Simulate job progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 10) + 1;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setBatchJobs((prev) =>
          prev.map((job) =>
            job.id === newBatchJob.id
              ? {
                  ...job,
                  status: "completed",
                  progress: 100,
                  processedItems: job.totalItems,
                }
              : job,
          ),
        );
      } else {
        setBatchJobs((prev) =>
          prev.map((job) =>
            job.id === newBatchJob.id
              ? {
                  ...job,
                  progress,
                  processedItems: Math.floor((job.totalItems * progress) / 100),
                }
              : job,
          ),
        );
      }
    }, 1000);
  };

  const handleExportTemplate = () => {
    if (!exportTemplate.type) {
      toast({
        title: "Missing Information",
        description: "Please select a template type.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Exporting Template",
      description: `${exportTemplate.type} template is being downloaded.`,
    });

    setTimeout(() => {
      toast({
        title: "Template Downloaded",
        description: `${exportTemplate.type} template has been downloaded as ${exportTemplate.format.toUpperCase()}.`,
        variant: "success",
      });
      setShowExportTemplateDialog(false);
    }, 1500);
  };

  const handleCancelJob = () => {
    if (!selectedJob) return;

    setBatchJobs((prev) =>
      prev.map((job) =>
        job.id === selectedJob.id
          ? { ...job, status: "failed", error: "Cancelled by user" }
          : job,
      ),
    );

    setShowCancelDialog(false);
    setSelectedJob(null);

    toast({
      title: "Job Cancelled",
      description: `${selectedJob.description} has been cancelled.`,
      variant: "success",
    });
  };

  const handleRetryJob = () => {
    if (!selectedJob) return;

    const retryJob: BatchJob = {
      ...selectedJob,
      id: `BATCH-${(batchJobs.length + 1).toString().padStart(3, "0")}`,
      status: "running",
      progress: 0,
      processedItems: 0,
      startTime: new Date().toLocaleString(),
      error: undefined,
    };

    setBatchJobs([retryJob, ...batchJobs]);
    setShowRetryDialog(false);
    setSelectedJob(null);

    toast({
      title: "Job Retried",
      description: `${retryJob.description} has been restarted.`,
      variant: "success",
    });

    // Simulate job progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 10) + 1;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setBatchJobs((prev) =>
          prev.map((job) =>
            job.id === retryJob.id
              ? {
                  ...job,
                  status: "completed",
                  progress: 100,
                  processedItems: job.totalItems,
                }
              : job,
          ),
        );
      } else {
        setBatchJobs((prev) =>
          prev.map((job) =>
            job.id === retryJob.id
              ? {
                  ...job,
                  progress,
                  processedItems: Math.floor((job.totalItems * progress) / 100),
                }
              : job,
          ),
        );
      }
    }, 1000);
  };

  return (
    <div className="p-6 space-y-6 bg-white">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Batch Operations</h1>
          <p className="text-gray-500 mt-1">
            Manage bulk imports, exports, and updates
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowExportTemplateDialog(true)}
            className="bg-yellow-400 hover:bg-yellow-500 text-black border-yellow-500"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Template
          </Button>
          <Button
            onClick={() => setShowNewJobDialog(true)}
            className="bg-black hover:bg-gray-800 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Batch Job
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white shadow-sm">
          <CardContent className="p-6">
            <div>
              <p className="text-sm text-gray-500">Active Jobs</p>
              <p className="text-2xl font-bold">
                {batchJobs.filter((job) => job.status === "running").length}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm">
          <CardContent className="p-6">
            <div>
              <p className="text-sm text-gray-500">Completed Today</p>
              <p className="text-2xl font-bold">
                {batchJobs.filter((job) => job.status === "completed").length}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm">
          <CardContent className="p-6">
            <div>
              <p className="text-sm text-gray-500">Failed Jobs</p>
              <p className="text-2xl font-bold">
                {batchJobs.filter((job) => job.status === "failed").length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        {batchJobs.map((job) => (
          <Card key={job.id} className="p-6 bg-white shadow-sm">
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="font-medium">{job.id}</h3>
                    <Badge
                      className={
                        job.status === "completed"
                          ? "bg-green-100 text-green-800"
                          : job.status === "running"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-red-100 text-red-800"
                      }
                    >
                      {job.status === "completed"
                        ? "COMPLETED"
                        : job.status === "running"
                          ? "RUNNING"
                          : "FAILED"}
                    </Badge>
                  </div>
                  <p className="text-gray-600 mt-1">{job.description}</p>
                </div>
                <div className="flex gap-2">
                  {job.status === "running" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-yellow-400 hover:bg-yellow-500 text-black border-yellow-500"
                      onClick={() => {
                        setSelectedJob(job);
                        setShowCancelDialog(true);
                      }}
                    >
                      Cancel
                    </Button>
                  )}
                  {job.status === "failed" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-yellow-400 hover:bg-yellow-500 text-black border-yellow-500"
                      onClick={() => {
                        setSelectedJob(job);
                        setShowRetryDialog(true);
                      }}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Retry
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">
                    {job.processedItems} of {job.totalItems} items
                  </span>
                  <span className="text-gray-500">{job.progress}%</span>
                </div>
                <Progress value={job.progress} />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Type</p>
                  <p className="font-medium capitalize">{job.type}</p>
                </div>
                <div>
                  <p className="text-gray-500">Start Time</p>
                  <p className="font-medium">{job.startTime}</p>
                </div>
                {job.error && (
                  <div className="col-span-2">
                    <p className="text-gray-500">Error</p>
                    <p className="font-medium text-red-600">{job.error}</p>
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* New Batch Job Dialog */}
      <Dialog open={showNewJobDialog} onOpenChange={setShowNewJobDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Batch Job</DialogTitle>
            <DialogDescription>
              Upload a file and configure the batch processing job.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="job-name">Job Name *</Label>
              <Input
                id="job-name"
                placeholder="Enter a descriptive name for this job"
                value={newJob.name}
                onChange={(e) => setNewJob({ ...newJob, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="job-type">Job Type *</Label>
              <Select
                value={newJob.type}
                onValueChange={(value) => setNewJob({ ...newJob, type: value })}
              >
                <SelectTrigger id="job-type">
                  <SelectValue placeholder="Select job type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="import">User Import</SelectItem>
                  <SelectItem value="update">Data Update</SelectItem>
                  <SelectItem value="export">Data Export</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="job-file">Upload File *</Label>
              <Input id="job-file" type="file" onChange={handleFileChange} />
              {newJob.file && (
                <p className="text-sm text-green-600">
                  Selected: {newJob.file.name}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="job-description">Description (Optional)</Label>
              <Textarea
                id="job-description"
                placeholder="Enter additional details about this job"
                value={newJob.description}
                onChange={(e) =>
                  setNewJob({ ...newJob, description: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowNewJobDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateJob}>Create Job</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Export Template Dialog */}
      <Dialog
        open={showExportTemplateDialog}
        onOpenChange={setShowExportTemplateDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export Template</DialogTitle>
            <DialogDescription>
              Download a template file for batch data operations.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="template-type">Template Type *</Label>
              <Select
                value={exportTemplate.type}
                onValueChange={(value) =>
                  setExportTemplate({ ...exportTemplate, type: value })
                }
              >
                <SelectTrigger id="template-type">
                  <SelectValue placeholder="Select template type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User Import</SelectItem>
                  <SelectItem value="vehicle">Vehicle Update</SelectItem>
                  <SelectItem value="driver">Driver Update</SelectItem>
                  <SelectItem value="route">Route Planning</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="template-format">File Format</Label>
              <Select
                value={exportTemplate.format}
                onValueChange={(value) =>
                  setExportTemplate({ ...exportTemplate, format: value })
                }
              >
                <SelectTrigger id="template-format">
                  <SelectValue placeholder="Select file format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="xlsx">Excel (XLSX)</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowExportTemplateDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleExportTemplate}>Download Template</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Job Confirmation Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Batch Job?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this job? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No, Continue Job</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelJob}>
              Yes, Cancel Job
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Retry Job Confirmation Dialog */}
      <AlertDialog open={showRetryDialog} onOpenChange={setShowRetryDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Retry Failed Job?</AlertDialogTitle>
            <AlertDialogDescription>
              This will create a new job with the same parameters. Do you want
              to proceed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRetryJob}>
              Yes, Retry Job
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
