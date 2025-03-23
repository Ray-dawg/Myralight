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
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertTriangle, CheckCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { EmailService } from "@/services/email.service";

// Form schema
const emailConfigSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  sender_email: z.string().email("Valid email is required"),
  sender_name: z.string().min(1, "Sender name is required"),
  smtp_host: z.string().min(1, "SMTP host is required"),
  smtp_port: z.coerce.number().int().positive("Port must be a positive number"),
  smtp_username: z.string().min(1, "SMTP username is required"),
  smtp_password: z.string().min(1, "SMTP password is required"),
  smtp_secure: z.boolean().default(true),
  is_active: z.boolean().default(true),
});

interface EmailConfigurationFormProps {
  configId?: string;
  onSuccess?: (config: any) => void;
  onCancel?: () => void;
}

const EmailConfigurationForm: React.FC<EmailConfigurationFormProps> = ({
  configId,
  onSuccess,
  onCancel,
}) => {
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // Initialize form
  const form = useForm<z.infer<typeof emailConfigSchema>>({
    resolver: zodResolver(emailConfigSchema),
    defaultValues: {
      name: "",
      description: "",
      sender_email: "",
      sender_name: "",
      smtp_host: "",
      smtp_port: 587,
      smtp_username: "",
      smtp_password: "",
      smtp_secure: true,
      is_active: true,
    },
  });

  // Load config data if editing
  useEffect(() => {
    if (configId) {
      const loadConfig = async () => {
        try {
          setLoading(true);
          const { data, error } = await supabase
            .from("email_configurations")
            .select("*")
            .eq("id", configId)
            .single();

          if (error) throw error;

          if (data) {
            // Set form values
            form.reset({
              name: data.name,
              description: data.description || "",
              sender_email: data.sender_email,
              sender_name: data.sender_name,
              smtp_host: data.smtp_host,
              smtp_port: data.smtp_port,
              smtp_username: data.smtp_username,
              smtp_password: data.smtp_password,
              smtp_secure: data.smtp_secure,
              is_active: data.is_active,
            });
          }
        } catch (error) {
          console.error("Error loading email configuration:", error);
        } finally {
          setLoading(false);
        }
      };

      loadConfig();
    }
  }, [configId, form]);

  // Handle form submission
  const onSubmit = async (values: z.infer<typeof emailConfigSchema>) => {
    try {
      setLoading(true);

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Create or update config
      let result;
      if (configId) {
        const { data, error } = await supabase
          .from("email_configurations")
          .update({
            ...values,
            updated_at: new Date().toISOString(),
            updated_by: user.id,
          })
          .eq("id", configId)
          .select()
          .single();

        if (error) throw error;
        result = data;
      } else {
        const { data, error } = await supabase
          .from("email_configurations")
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
      console.error("Error saving email configuration:", error);
    } finally {
      setLoading(false);
    }
  };

  // Test email configuration
  const testEmailConfig = async () => {
    try {
      setTestLoading(true);
      setTestResult(null);

      // Validate test email
      if (!testEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(testEmail)) {
        setTestResult({
          success: false,
          message: "Please enter a valid test email address",
        });
        return;
      }

      // Get form values
      const values = form.getValues();

      // Create email service
      const emailService = new EmailService({
        host: values.smtp_host,
        port: values.smtp_port,
        secure: values.smtp_secure,
        auth: {
          user: values.smtp_username,
          pass: values.smtp_password,
        },
      });

      // Verify connection
      const isConnected = await emailService.verifyConnection();
      if (!isConnected) {
        setTestResult({
          success: false,
          message:
            "Failed to connect to SMTP server. Please check your settings.",
        });
        return;
      }

      // Send test email
      await emailService.sendTestEmail(
        testEmail,
        `"${values.sender_name}" <${values.sender_email}>`,
      );

      setTestResult({
        success: true,
        message: `Test email sent successfully to ${testEmail}`,
      });
    } catch (error: any) {
      setTestResult({
        success: false,
        message: error.message || "Failed to send test email",
      });
    } finally {
      setTestLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Configuration Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Email Configuration Name" {...field} />
                  </FormControl>
                  <FormDescription>
                    A descriptive name for this email configuration
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
                      placeholder="Description of this email configuration"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sender_email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sender Email</FormLabel>
                  <FormControl>
                    <Input placeholder="noreply@example.com" {...field} />
                  </FormControl>
                  <FormDescription>
                    The email address that will appear in the From field
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sender_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sender Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Your Company Name" {...field} />
                  </FormControl>
                  <FormDescription>
                    The name that will appear in the From field
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-6">
            <FormField
              control={form.control}
              name="smtp_host"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>SMTP Host</FormLabel>
                  <FormControl>
                    <Input placeholder="smtp.example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="smtp_port"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>SMTP Port</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="587"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    Common ports: 25, 465 (SSL), 587 (TLS)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="smtp_username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SMTP Username</FormLabel>
                    <FormControl>
                      <Input placeholder="username" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="smtp_password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SMTP Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="smtp_secure"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Use SSL/TLS</FormLabel>
                      <FormDescription>
                        Enable for secure connections
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

              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Active</FormLabel>
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
          </div>
        </div>

        <div className="border rounded-lg p-4">
          <h3 className="text-sm font-medium mb-2">Test Email Configuration</h3>
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <FormLabel htmlFor="test_email">Test Email Address</FormLabel>
              <Input
                id="test_email"
                type="email"
                placeholder="Enter email to receive test"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="mt-1"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={testEmailConfig}
              disabled={testLoading || !form.formState.isValid}
            >
              {testLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Test Email"
              )}
            </Button>
          </div>

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
        </div>

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
  );
};

export default EmailConfigurationForm;
