import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Plus,
  Search,
  Clock,
  Mail,
  Globe,
  AlertTriangle,
  CheckCircle,
  Trash2,
  Edit,
  Play,
} from "lucide-react";
import BolProcessingConfig from "./BolProcessingConfig";
import { schedulerService } from "@/services/scheduler.service";

const BolProcessingList = () => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Load tasks on component mount
  useEffect(() => {
    loadTasks();
  }, []);

  // Load tasks from the database
  const loadTasks = async () => {
    try {
      setLoading(true);

      // Get scheduled tasks
      const { data: taskData, error: taskError } = await supabase
        .from("scheduled_tasks")
        .select("*, document_submissions(count)")
        .eq("task_type", "BOL_SUBMISSION")
        .order("created_at", { ascending: false });

      if (taskError) throw taskError;

      // Also get BOL document counts to enhance our data
      const { data: bolData, error: bolError } = await supabase
        .from("documents")
        .select("count")
        .eq("category", "bol");

      if (bolError) throw bolError;

      // Enhance task data with BOL document counts if needed
      const enhancedTasks =
        taskData?.map((task) => {
          // Here we could add additional BOL-related data to each task
          // For now, we'll just return the task as is
          return task;
        }) || [];

      setTasks(enhancedTasks);
    } catch (error) {
      console.error("Error loading BOL processing tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter tasks based on search query
  const filteredTasks = tasks.filter(
    (task) =>
      task.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Handle task creation/update success
  const handleTaskSuccess = () => {
    setIsDialogOpen(false);
    setSelectedTask(null);
    loadTasks();
  };

  // Handle task deletion
  const handleDeleteTask = async () => {
    if (!taskToDelete) return;

    try {
      setActionLoading(true);
      const { error } = await supabase
        .from("scheduled_tasks")
        .delete()
        .eq("id", taskToDelete);

      if (error) throw error;
      setIsDeleteDialogOpen(false);
      setTaskToDelete(null);
      loadTasks();
    } catch (error) {
      console.error("Error deleting task:", error);
    } finally {
      setActionLoading(false);
    }
  };

  // Run a task manually
  const runTask = async (taskId: string) => {
    try {
      setActionLoading(true);
      await schedulerService.runTask(taskId);
      // Reload tasks to show updated last_run_at
      loadTasks();
    } catch (error) {
      console.error("Error running task:", error);
    } finally {
      setActionLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">BOL Processing Configurations</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Configuration
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>New BOL Processing Configuration</DialogTitle>
            </DialogHeader>
            <BolProcessingConfig
              onSuccess={handleTaskSuccess}
              onCancel={() => setIsDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search configurations..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="outline" onClick={loadTasks} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh"}
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredTasks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <p className="text-muted-foreground mb-4">
              No BOL processing configurations found
            </p>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Create your first configuration
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredTasks.map((task) => (
            <Card key={task.id}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold">{task.name}</h3>
                      <Badge
                        variant={task.is_active ? "default" : "outline"}
                        className={
                          task.is_active
                            ? "bg-green-100 text-green-800 hover:bg-green-100"
                            : ""
                        }
                      >
                        {task.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    {task.description && (
                      <p className="text-muted-foreground mt-1">
                        {task.description}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => runTask(task.id)}
                      disabled={actionLoading}
                      className="flex items-center gap-1"
                    >
                      <Play className="h-3 w-3" />
                      Run
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedTask(task.id);
                        setIsDialogOpen(true);
                      }}
                      className="flex items-center gap-1"
                    >
                      <Edit className="h-3 w-3" />
                      Edit
                    </Button>
                    <AlertDialog
                      open={isDeleteDialogOpen && taskToDelete === task.id}
                      onOpenChange={(open) => {
                        setIsDeleteDialogOpen(open);
                        if (!open) setTaskToDelete(null);
                      }}
                    >
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-1 text-destructive hover:bg-destructive/10"
                          onClick={() => setTaskToDelete(task.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Delete Configuration
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this BOL processing
                            configuration? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleDeleteTask}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            {actionLoading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              "Delete"
                            )}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div className="flex items-center gap-2">
                    {task.processor_type === "EMAIL" ? (
                      <Mail className="h-4 w-4 text-blue-500" />
                    ) : (
                      <Globe className="h-4 w-4 text-purple-500" />
                    )}
                    <div>
                      <p className="text-sm font-medium">
                        {task.processor_type === "EMAIL" ? "Email" : "API"}{" "}
                        Processor
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {task.processor_type === "EMAIL"
                          ? `${task.email_addresses?.length || 0} recipients`
                          : task.api_endpoint
                            ? new URL(task.api_endpoint).hostname
                            : "No endpoint"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-amber-500" />
                    <div>
                      <p className="text-sm font-medium">
                        {task.schedule_type === "DAILY"
                          ? "Daily"
                          : task.schedule_type === "INTERVAL"
                            ? `Every ${task.interval_minutes} minutes`
                            : "Manual only"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {task.schedule_type === "DAILY" && task.schedule_time
                          ? `At ${task.schedule_time}`
                          : task.schedule_type === "INTERVAL"
                            ? `Next: ${formatDate(task.next_run_at)}`
                            : "Run manually"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {task.document_submissions[0]?.count > 0 ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                    )}
                    <div>
                      <p className="text-sm font-medium">
                        {task.document_submissions[0]?.count || 0} Transmissions
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Last run: {formatDate(task.last_run_at)}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      {selectedTask && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Edit BOL Processing Configuration</DialogTitle>
            </DialogHeader>
            <BolProcessingConfig
              configId={selectedTask}
              onSuccess={handleTaskSuccess}
              onCancel={() => {
                setIsDialogOpen(false);
                setSelectedTask(null);
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default BolProcessingList;
