import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/lib/supabase";
import { schedulerService } from "@/services/scheduler.service";
import {
  Loader2,
  CheckCircle,
  AlertTriangle,
  Clock,
  Mail,
  FileText,
  RotateCw,
} from "lucide-react";

// Form schema for BOL processing configuration
const bolProcessingSchema = z.object({
  name: z.string().min(1, "Configuration name is required"),
  description: z.string().optional(),
  is_active: z.boolean().default(true),
  processor_type: z.enum(["EMAIL", "API"]),
  email_addresses: z
    .array(z.string().email("Invalid email address"))
    .min(1, "At least one email address is required")
    .optional(),
  api_endpoint: z.string().url("Must be a valid URL").optional(),
  api_key: z.string().optional(),
  schedule_type: z.enum(["DAILY", "INTERVAL", "MANUAL"]),
  schedule_time: z.string().optional(),
  interval_minutes: z.coerce.number().int().positive().optional(),
  email_config_id: z.string().optional(),
  filter_criteria: z
    .object({
      status: z.string().optional(),
      created_after: z.string().optional(),
      created_before: z.string().optional(),
    })
    .optional(),
  email_subject_template: z.string().optional(),
  email_body_template: z.string().optional(),
});

interface BolProcessingConfigProps {
  configId?: string;
  onSuccess?: (config: any) => void;
  onCancel?: () => void;
}

const BolProcessingConfig: React.FC<BolProcessingConfigProps> = ({
  configId,
  onSuccess,
  onCancel,
}) => {
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [emailConfigs, setEmailConfigs] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [emailAddressInput, setEmailAddressInput] = useState("");

  // Initialize form
  const form = useForm<z.infer<typeof bolProcessingSchema>>({
    resolver: zodResolver(bolProcessingSchema),
    defaultValues: {
      name: "",
      description: "",
      is_active: true,
      processor_type: "EMAIL",
      email_addresses: [],
      schedule_type: "DAILY",
      schedule_time: "18:00",
      filter_criteria: {
        status: "APPROVED",
      },
      email_subject_template: "Bill of Lading for Load {{loadId}}",
      email_body_template:
        '<h2>Bill of Lading for Load {{loadId}}</h2>\n<p>Please find attached the Bill of Lading for the following load:</p>\n<table border="0" cellpadding="5" style="border-collapse: collapse;">\n  <tr>\n    <td><strong>Load ID:</strong></td>\n    <td>{{loadId}}</td>\n  </tr>\n  <tr>\n    <td><strong>Pickup:</strong></td>\n    <td>{{pickupLocation}}</td>\n  </tr>\n  <tr>\n    <td><strong>Delivery:</strong></td>\n    <td>{{deliveryLocation}}</td>\n  </tr>\n  <tr>\n    <td><strong>Date:</strong></td>\n    <td>{{date}}</td>\n  </tr>\n</table>\n<p>This is an automated message. Please do not reply to this email.</p>',
    },
  });

  // Watch form values for conditional rendering
  const processorType = form.watch("processor_type");
  const scheduleType = form.watch("schedule_type");
  const emailAddresses = form.watch("email_addresses") || [];

  // Load email configurations
  useEffect(() => {
    const loadEmailConfigs = async () => {
      try {
        const { data, error } = await supabase
          .from("email_configurations")
          .select("*")
          .eq("is_active", true);

        if (error) throw error;
        setEmailConfigs(data || []);
      } catch (error) {
        console.error("Error loading email configurations:", error);
      }
    };

    loadEmailConfigs();
  }, []);

  // Load config data if editing
  useEffect(() => {
    if (configId) {
      const loadConfig = async () => {
        try {
          setLoading(true);
          const { data, error } = await supabase
            .from("scheduled_tasks")
            .select("*")
            .eq("id", configId)
            .single();

          if (error) throw error;

          if (data && data.task_type === "BOL_SUBMISSION") {
            // Set form values
            form.reset({
              name: data.name,
              description: data.description || "",
              is_active: data.is_active,
              processor_type: data.processor_type || "EMAIL",
              email_addresses: data.email_addresses || [],
              api_endpoint: data.api_endpoint || "",
              api_key: data.api_key || "",
              schedule_type: data.schedule_type || "DAILY",
              schedule_time: data.schedule_time || "18:00",
              interval_minutes: data.interval_minutes || 60,
              email_config_id: data.email_config_id || "",
              filter_criteria: data.filter_criteria || {
                status: "APPROVED",
              },
              email_subject_template:
                data.email_subject_template ||
                "Bill of Lading for Load {{loadId}}",
              email_body_template:
                data.email_body_template ||
                "<h2>Bill of Lading for Load {{loadId}}</h2>\n<p>Please find attached the Bill of Lading for the following load:</p>",
            });

            // Load submission history
            loadSubmissionHistory(configId);
          }
        } catch (error) {
          console.error("Error loading BOL processing configuration:", error);
        } finally {
          setLoading(false);
        }
      };

      loadConfig();
    }
  }, [configId, form]);

  // Load submission history
  const loadSubmissionHistory = async (taskId: string) => {
    try {
      const { data, error } = await supabase
        .from("document_submissions")
        .select("*, documents(id, file_name, created_at)")
        .eq("task_id", taskId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setSubmissions(data || []);
    } catch (error) {
      console.error("Error loading submission history:", error);
    }
  };

  // Handle form submission
  const onSubmit = async (values: z.infer<typeof bolProcessingSchema>) => {
    try {
      setLoading(true);

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Prepare data for database
      const taskData = {
        name: values.name,
        description: values.description,
        is_active: values.is_active,
        task_type: "BOL_SUBMISSION",
        processor_type: values.processor_type,
        email_addresses:
          values.processor_type === "EMAIL" ? values.email_addresses : null,
        api_endpoint:
          values.processor_type === "API" ? values.api_endpoint : null,
        api_key: values.processor_type === "API" ? values.api_key : null,
        schedule_type: values.schedule_type,
        schedule_time:
          values.schedule_type === "DAILY" ? values.schedule_time : null,
        interval_minutes:
          values.schedule_type === "INTERVAL" ? values.interval_minutes : null,
        email_config_id:
          values.processor_type === "EMAIL" ? values.email_config_id : null,
        filter_criteria: values.filter_criteria,
        email_subject_template: values.email_subject_template,
        email_body_template: values.email_body_template,
        updated_at: new Date().toISOString(),
        updated_by: user.id,
      };

      // Create or update config
      let result;
      if (configId) {
        const { data, error } = await supabase
          .from("scheduled_tasks")
          .update(taskData)
          .eq("id", configId)
          .select()
          .single();

        if (error) throw error;
        result = data;
      } else {
        const { data, error } = await supabase
          .from("scheduled_tasks")
          .insert([
            {
              ...taskData,
              created_by: user.id,
              created_at: new Date().toISOString(),
            },
          ])
          .select()
          .single();

        if (error) throw error;
        result = data;
      }

      // Call the database function to calculate the next run time
      await supabase.rpc("calculate_next_run_time", { task_id: result.id });

      if (onSuccess) {
        onSuccess(result);
      }

      setTestResult({
        success: true,
        message: `Configuration ${configId ? "updated" : "created"} successfully`,
      });

      // If this is a new config, reset the form
      if (!configId) {
        form.reset();
      }
    } catch (error: any) {
      console.error("Error saving BOL processing configuration:", error);
      setTestResult({
        success: false,
        message: error.message || "Failed to save configuration",
      });
    } finally {
      setLoading(false);
    }
  };

  // Add email address to the list
  const addEmailAddress = () => {
    if (!emailAddressInput) return;

    // Validate email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailAddressInput)) {
      setTestResult({
        success: false,
        message: "Please enter a valid email address",
      });
      return;
    }

    // Check for duplicates
    if (emailAddresses.includes(emailAddressInput)) {
      setTestResult({
        success: false,
        message: "This email address is already in the list",
      });
      return;
    }

    // Add to the list
    const updatedEmails = [...emailAddresses, emailAddressInput];
    form.setValue("email_addresses", updatedEmails);
    setEmailAddressInput("");
    setTestResult(null);
  };

  // Remove email address from the list
  const removeEmailAddress = (email: string) => {
    const updatedEmails = emailAddresses.filter((e) => e !== email);
    form.setValue("email_addresses", updatedEmails);
  };

  // Test the configuration
  const testConfiguration = async () => {
    try {
      setTestLoading(true);
      setTestResult(null);

      // Validate form
      const isValid = await form.trigger();
      if (!isValid) {
        setTestResult({
          success: false,
          message: "Please fix the form errors before testing",
        });
        return;
      }

      // Get form values
      const values = form.getValues();

      // Check if there are any BOL documents to process
      const { data: documents, error: documentsError } = await supabase
        .from("documents")
        .select("count")
        .eq("document_type", "BOL");

      if (documentsError) throw documentsError;

      if (!documents || documents.length === 0 || documents[0].count === 0) {
        setTestResult({
          success: false,
          message: "No BOL documents found to test with",
        });
        return;
      }

      // For email processor, check if email config exists
      if (values.processor_type === "EMAIL" && values.email_config_id) {
        const { data: emailConfig, error: emailConfigError } = await supabase
          .from("email_configurations")
          .select("*")
          .eq("id", values.email_config_id)
          .single();

        if (emailConfigError || !emailConfig) {
          setTestResult({
            success: false,
            message: "Email configuration not found or inactive",
          });
          return;
        }

        if (!emailConfig.is_active) {
          setTestResult({
            success: false,
            message: "The selected email configuration is not active",
          });
          return;
        }
      }

      setTestResult({
        success: true,
        message: "Configuration validated successfully. Ready to save.",
      });
    } catch (error: any) {
      setTestResult({
        success: false,
        message: error.message || "Failed to test configuration",
      });
    } finally {
      setTestLoading(false);
    }
  };

  // Run the task manually
  const runTaskManually = async () => {
    if (!configId) return;

    try {
      setTestLoading(true);
      setTestResult(null);

      await schedulerService.runTask(configId);

      setTestResult({
        success: true,
        message: "Task executed successfully",
      });

      // Reload submission history
      await loadSubmissionHistory(configId);
    } catch (error: any) {
      setTestResult({
        success: false,
        message: error.message || "Failed to run task",
      });
    } finally {
      setTestLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(date);
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="configuration" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger
            value="configuration"
            className="flex items-center gap-2"
          >
            <FileText className="h-4 w-4" /> Configuration
          </TabsTrigger>
          {configId && (
            <TabsTrigger value="history" className="flex items-center gap-2">
              <Clock className="h-4 w-4" /> Transmission History
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="configuration" className="space-y-4 pt-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>BOL Processing Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-6">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Configuration Name</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Daily BOL Processing"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              A descriptive name for this BOL processing
                              configuration
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Description of this BOL processing configuration"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="is_active"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">
                                Active
                              </FormLabel>
                              <FormDescription>
                                Enable or disable this configuration
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="space-y-6">
                      <FormField
                        control={form.control}
                        name="processor_type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Processor Type</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select processor type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="EMAIL">Email</SelectItem>
                                <SelectItem value="API">API</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              How BOL documents will be transmitted
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="schedule_type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Schedule Type</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select schedule type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="DAILY">Daily</SelectItem>
                                <SelectItem value="INTERVAL">
                                  Interval
                                </SelectItem>
                                <SelectItem value="MANUAL">
                                  Manual Only
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              When BOL documents will be processed
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {scheduleType === "DAILY" && (
                        <FormField
                          control={form.control}
                          name="schedule_time"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Time of Day</FormLabel>
                              <FormControl>
                                <Input type="time" {...field} />
                              </FormControl>
                              <FormDescription>
                                When the task will run each day (24-hour format)
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      {scheduleType === "INTERVAL" && (
                        <FormField
                          control={form.control}
                          name="interval_minutes"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Interval (minutes)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min="15"
                                  step="15"
                                  {...field}
                                  onChange={(e) =>
                                    field.onChange(parseInt(e.target.value))
                                  }
                                />
                              </FormControl>
                              <FormDescription>
                                How often the task will run (minimum 15 minutes)
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {processorType === "EMAIL" && (
                <Card>
                  <CardHeader>
                    <CardTitle>Email Configuration</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <FormField
                      control={form.control}
                      name="email_config_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Configuration</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select email configuration" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {emailConfigs.map((config) => (
                                <SelectItem key={config.id} value={config.id}>
                                  {config.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            The email configuration to use for sending BOL
                            documents
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="space-y-2">
                      <FormLabel>Recipient Email Addresses</FormLabel>
                      <div className="flex gap-2">
                        <Input
                          placeholder="recipient@example.com"
                          value={emailAddressInput}
                          onChange={(e) => setEmailAddressInput(e.target.value)}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={addEmailAddress}
                        >
                          Add
                        </Button>
                      </div>
                      <FormDescription>
                        Email addresses that will receive BOL documents
                      </FormDescription>
                      {form.formState.errors.email_addresses && (
                        <p className="text-sm font-medium text-destructive">
                          {form.formState.errors.email_addresses.message}
                        </p>
                      )}

                      {emailAddresses.length > 0 && (
                        <div className="mt-2 space-y-2">
                          {emailAddresses.map((email) => (
                            <div
                              key={email}
                              className="flex items-center justify-between rounded-md border px-3 py-2"
                            >
                              <span className="text-sm">{email}</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeEmailAddress(email)}
                              >
                                Remove
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <FormField
                      control={form.control}
                      name="email_subject_template"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Subject Template</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Bill of Lading for Load {{loadId}}"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Template for email subject. Available variables:{" "}
                            {{ loadId }}, {{ referenceNumber }}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email_body_template"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Body Template</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="<h2>Bill of Lading for Load {{loadId}}</h2>"
                              className="min-h-[200px] font-mono text-sm"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            HTML template for email body. Available variables:{" "}
                            {{ loadId }}, {{ referenceNumber }},{" "}
                            {{ pickupLocation }}, {{ deliveryLocation }},{" "}
                            {{ date }}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              )}

              {processorType === "API" && (
                <Card>
                  <CardHeader>
                    <CardTitle>API Configuration</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <FormField
                      control={form.control}
                      name="api_endpoint"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>API Endpoint</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="https://api.example.com/bol-upload"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            The URL where BOL documents will be sent
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="api_key"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>API Key</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="API key for authentication"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Authentication key for the API (if required)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Document Filtering</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="filter_criteria.status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Document Status</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select document status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="APPROVED">Approved</SelectItem>
                            <SelectItem value="PENDING">Pending</SelectItem>
                            <SelectItem value="ALL">All</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Which BOL documents to process based on status
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {testResult && (
                <Alert
                  variant={testResult.success ? "default" : "destructive"}
                  className={`mt-4 ${testResult.success ? "bg-green-50 border-green-200" : ""}`}
                >
                  {testResult.success ? (
                    <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 mr-2" />
                  )}
                  <AlertDescription
                    className={testResult.success ? "text-green-600" : ""}
                  >
                    {testResult.message}
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex justify-end space-x-2">
                {onCancel && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  onClick={testConfiguration}
                  disabled={testLoading || loading}
                >
                  {testLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    "Test Configuration"
                  )}
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Configuration"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </TabsContent>

        {configId && (
          <TabsContent value="history" className="space-y-4 pt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Transmission History</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={runTaskManually}
                  disabled={testLoading}
                  className="flex items-center gap-2"
                >
                  {testLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RotateCw className="h-4 w-4" />
                  )}
                  Run Now
                </Button>
              </CardHeader>
              <CardContent>
                {submissions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No transmission history available
                  </div>
                ) : (
                  <div className="space-y-4">
                    {submissions.map((submission) => (
                      <div
                        key={submission.id}
                        className={`border rounded-lg p-4 ${submission.submission_status === "SENT" ? "border-green-200 bg-green-50" : submission.submission_status === "FAILED" ? "border-red-200 bg-red-50" : "border-yellow-200 bg-yellow-50"}`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">
                              {submission.documents?.file_name || "Document"}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {formatDate(submission.created_at)}
                            </p>
                          </div>
                          <div
                            className={`px-2 py-1 rounded-full text-xs font-medium ${submission.submission_status === "SENT" ? "bg-green-100 text-green-800" : submission.submission_status === "FAILED" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"}`}
                          >
                            {submission.submission_status}
                          </div>
                        </div>
                        {submission.submission_status === "FAILED" &&
                          submission.error_message && (
                            <div className="mt-2 text-sm text-red-600">
                              <p className="font-medium">Error:</p>
                              <p>{submission.error_message}</p>
                              {submission.next_retry_at && (
                                <p className="mt-1">
                                  Next retry:{" "}
                                  {formatDate(submission.next_retry_at)}
                                </p>
                              )}
                            </div>
                          )}
                        {submission.submission_status === "SENT" &&
                          submission.response_data && (
                            <div className="mt-2 text-sm">
                              <p className="font-medium">Response:</p>
                              <p className="text-green-600">
                                {submission.response_data.messageId ? (
                                  <>
                                    Message ID:{" "}
                                    {submission.response_data.messageId}
                                  </>
                                ) : (
                                  "Success"
                                )}
                              </p>
                            </div>
                          )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default BolProcessingConfig;
