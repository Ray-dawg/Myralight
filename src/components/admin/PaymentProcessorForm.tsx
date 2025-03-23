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
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertTriangle, CheckCircle } from "lucide-react";
import { paymentProcessorService } from "@/services/payment-processor.service";

// Form schema
const processorSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  processor_type: z.enum(["EMAIL", "API"]),
  is_active: z.boolean().default(true),
  email_addresses: z.array(z.string().email()).optional(),
  api_endpoint: z.string().url().optional(),
  api_key: z.string().optional(),
  api_secret: z.string().optional(),
  additional_config: z.record(z.string(), z.any()).optional(),
});

interface PaymentProcessorFormProps {
  processorId?: string;
  onSuccess?: (processor: any) => void;
  onCancel?: () => void;
}

const PaymentProcessorForm: React.FC<PaymentProcessorFormProps> = ({
  processorId,
  onSuccess,
  onCancel,
}) => {
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [emailInput, setEmailInput] = useState("");

  // Initialize form
  const form = useForm<z.infer<typeof processorSchema>>({
    resolver: zodResolver(processorSchema),
    defaultValues: {
      name: "",
      description: "",
      processor_type: "EMAIL",
      is_active: true,
      email_addresses: [],
      api_endpoint: "",
      api_key: "",
      api_secret: "",
      additional_config: {},
    },
  });

  // Watch processor type to show/hide relevant fields
  const processorType = form.watch("processor_type");
  const emailAddresses = form.watch("email_addresses") || [];

  // Load processor data if editing
  useEffect(() => {
    if (processorId) {
      const loadProcessor = async () => {
        try {
          setLoading(true);
          const processor =
            await paymentProcessorService.getProcessorById(processorId);
          if (processor) {
            // Set form values
            form.reset({
              name: processor.name,
              description: processor.description || "",
              processor_type: processor.processor_type,
              is_active: processor.is_active,
              email_addresses: processor.email_addresses || [],
              api_endpoint: processor.api_endpoint || "",
              api_key: processor.api_key || "",
              api_secret: processor.api_secret || "",
              additional_config: processor.additional_config || {},
            });
          }
        } catch (error) {
          console.error("Error loading processor:", error);
        } finally {
          setLoading(false);
        }
      };

      loadProcessor();
    }
  }, [processorId, form]);

  // Handle form submission
  const onSubmit = async (values: z.infer<typeof processorSchema>) => {
    try {
      setLoading(true);

      // Create or update processor
      let processor;
      if (processorId) {
        processor = await paymentProcessorService.updateProcessor(
          processorId,
          values,
        );
      } else {
        processor = await paymentProcessorService.createProcessor(values);
      }

      if (onSuccess) {
        onSuccess(processor);
      }
    } catch (error) {
      console.error("Error saving processor:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle email address input
  const handleAddEmail = () => {
    if (!emailInput) return;

    // Validate email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput)) {
      form.setError("email_addresses", {
        type: "manual",
        message: "Please enter a valid email address",
      });
      return;
    }

    // Add email to list
    const currentEmails = form.getValues("email_addresses") || [];
    if (!currentEmails.includes(emailInput)) {
      form.setValue("email_addresses", [...currentEmails, emailInput]);
      setEmailInput("");
      form.clearErrors("email_addresses");
    }
  };

  // Handle email address removal
  const handleRemoveEmail = (email: string) => {
    const currentEmails = form.getValues("email_addresses") || [];
    form.setValue(
      "email_addresses",
      currentEmails.filter((e) => e !== email),
    );
  };

  // Test processor connection
  const testConnection = async () => {
    try {
      setTestLoading(true);
      setTestResult(null);

      if (!processorId) {
        setTestResult({
          success: false,
          message: "Please save the processor before testing",
        });
        return;
      }

      const result =
        await paymentProcessorService.testProcessorConnection(processorId);
      setTestResult(result);
    } catch (error: any) {
      setTestResult({
        success: false,
        message: error.message || "Test failed",
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
                  <FormLabel>Processor Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Payment Processor Name" {...field} />
                  </FormControl>
                  <FormDescription>
                    A descriptive name for this payment processor
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
                      placeholder="Description of this payment processor"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                    How documents will be sent to this processor
                  </FormDescription>
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
                    <FormLabel className="text-base">Active</FormLabel>
                    <FormDescription>
                      Enable or disable this payment processor
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

          <div>
            <Tabs defaultValue={processorType.toLowerCase()}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger
                  value="email"
                  onClick={() => form.setValue("processor_type", "EMAIL")}
                >
                  Email Configuration
                </TabsTrigger>
                <TabsTrigger
                  value="api"
                  onClick={() => form.setValue("processor_type", "API")}
                >
                  API Configuration
                </TabsTrigger>
              </TabsList>

              <TabsContent value="email" className="space-y-4 mt-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div>
                        <FormLabel htmlFor="email_input">
                          Email Recipients
                        </FormLabel>
                        <div className="flex mt-1.5">
                          <Input
                            id="email_input"
                            placeholder="Enter email address"
                            value={emailInput}
                            onChange={(e) => setEmailInput(e.target.value)}
                            className="flex-1 mr-2"
                          />
                          <Button
                            type="button"
                            onClick={handleAddEmail}
                            variant="secondary"
                          >
                            Add
                          </Button>
                        </div>
                        {form.formState.errors.email_addresses && (
                          <p className="text-sm font-medium text-destructive mt-1">
                            {form.formState.errors.email_addresses.message}
                          </p>
                        )}
                      </div>

                      {emailAddresses.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm font-medium mb-1">
                            Recipients:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {emailAddresses.map((email) => (
                              <div
                                key={email}
                                className="flex items-center bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm"
                              >
                                <span>{email}</span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-4 w-4 p-0 ml-2 text-secondary-foreground hover:text-destructive"
                                  onClick={() => handleRemoveEmail(email)}
                                >
                                  ×
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <FormDescription>
                        Add email addresses that will receive BOL documents
                      </FormDescription>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="api" className="space-y-4 mt-4">
                <Card>
                  <CardContent className="pt-6 space-y-4">
                    <FormField
                      control={form.control}
                      name="api_endpoint"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>API Endpoint</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="https://api.example.com/documents"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            The URL where documents will be sent
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
                              placeholder="Enter API key"
                              type="password"
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

                    <FormField
                      control={form.control}
                      name="api_secret"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>API Secret</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter API secret"
                              type="password"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Secret key for the API (if required)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {testResult && (
          <Alert
            variant={testResult.success ? "default" : "destructive"}
            className={testResult.success ? "bg-green-50 border-green-200" : ""}
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

        <div className="flex justify-between">
          <div>
            {processorId && (
              <Button
                type="button"
                variant="outline"
                onClick={testConnection}
                disabled={testLoading}
              >
                {testLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  "Test Connection"
                )}
              </Button>
            )}
          </div>

          <div className="flex space-x-2">
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
                "Save Processor"
              )}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
};

export default PaymentProcessorForm;
