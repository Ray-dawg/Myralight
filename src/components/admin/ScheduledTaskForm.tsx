import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertTriangle, CheckCircle, Play } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { paymentProcessorService } from "@/services/payment-processor.service";
import { schedulerService } from "@/services/scheduler.service";

// Form schema
const taskSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  task_type: z.enum(["BOL_SUBMISSION"]),
  schedule_type: z.enum(["DAILY", "HOURLY", "CUSTOM"]),
  processor_id: z.string().uuid("Valid processor ID is required"),
  email_config_id: z.string().uuid().optional(),
  is_active: z.boolean().default(true),
  schedule_config: z.record(z.string(), z.any()),
  filter_criteria: z.record(z.string(), z.any()).optional(),
});

interface ScheduledTaskFormProps {
  taskId?: string;
  onSuccess?: (task: any) => void;
  onCancel?: () => void;
}

const ScheduledTaskForm: React.FC<ScheduledTaskFormProps> = ({
  taskId,
  onSuccess,
  onCancel,
}) => {
  const [loading, setLoading] = useState(false);
  const [runLoading, setRunLoading] = useState(false);
  const [runResult, setRunResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [processors, setProcessors] = useState<any[]>([]);
  const [emailConfigs, setEmailConfigs] = useState<any[]>([]);

  // Initialize form
  const form = useForm<z.infer<typeof taskSchema>>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      name: "",
      description: "",
      task_type: "BOL_SUBMISSION",
      schedule_type: "DAILY",
      processor_id: "",
      email_config_id: undefined,
      is_active: true,
      schedule_config: { time: "00:00:00" },
      filter_criteria: { status: "UPLOADED" },
    },
  });

  // Watch values for conditional fields
  const scheduleType = form.watch("schedule_type");
  const processorId = form.watch("processor_id");
  const processorType = processors.find((p) => p.id === processorId)?.processor_type;

  // Load task data if editing
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // Load processors
        const processorList = await paymentProcessorService.getAllProcessors();
        setProcessors(processorList);

        // Load email configurations
        const { data: configs, error: configError } = await supabase
          .from("email_configurations")
          .select("*")
          .eq("is_active", true)
          .order("name");

        if (!configError) {
          setEmailConfigs(configs || []);
        }

        // Load task if editing
        if (taskId) {
          const { data: task, error } = await supabase
            .from("scheduled_tasks")
            .select("*")
            .eq("id", taskId)
            .single();

          if (error) throw error;

          if (task) {
            // Set form values
            form.reset({
              name: task.name,
              description: task.description || "",
              task_type: task.task_type,
              schedule_type: task.schedule_type,
              processor_id: task.processor_id,
              email_config_id: task.email_config_id,
              is_active: task.is_active,
              schedule_config: task.schedule_config || {},
              filter_criteria: task.filter_criteria || {},
            });
          }
        }
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [taskId, form]);

  // Handle form submission
  const onSubmit = async (values: z.infer<typeof taskSchema>) => {
    try {
      setLoading(true);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Create or update task
      let result;
      if (taskId) {
        const { data, error } = await supabase
          .from("scheduled_tasks")
          .update({
            ...values,
            updated_at: new Date().toISOString(),
            updated_by: user.id,
          })
          .eq("id", taskId)
          .select()
          .single();

        if (error) throw error;
        result = data;
      } else {
        const { data, error } = await supabase
          .from("scheduled_tasks")
          .insert([
            {
              ...values,
              created_by: user.id,
              updated_by: user.id,
            },
          ])
          .select()
          .single();

        if (error) throw error;
        result = data;
      }

      if (onSuccess) {
        onSuccess(result);
      }
    } catch (error) {
      console.error("Error saving scheduled task:", error);
    } finally {
      setLoading(false);
    }
  };

  // Run task manually
  const runTaskManually = async () => {
    try {
      setRunLoading(true);
      set