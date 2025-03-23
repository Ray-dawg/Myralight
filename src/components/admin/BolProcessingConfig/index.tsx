import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const emailConfigSchema = z.object({
  enabled: z.boolean().default(true),
  fromEmail: z.string().email("Please enter a valid email address"),
  toEmail: z.string().email("Please enter a valid email address"),
  ccEmail: z
    .string()
    .email("Please enter a valid email address")
    .optional()
    .or(z.literal("")),
  bccEmail: z
    .string()
    .email("Please enter a valid email address")
    .optional()
    .or(z.literal("")),
  subject: z.string().min(1, "Subject is required"),
  template: z.string().min(1, "Email template is required"),
  schedule: z.enum(["immediate", "daily", "weekly"]).default("immediate"),
  scheduledTime: z.string().optional(),
});

const paymentConfigSchema = z.object({
  enabled: z.boolean().default(true),
  provider: z.enum(["stripe", "paypal", "custom"]).default("stripe"),
  apiKey: z.string().min(1, "API key is required"),
  webhookUrl: z
    .string()
    .url("Please enter a valid URL")
    .optional()
    .or(z.literal("")),
  autoProcess: z.boolean().default(false),
});

export default function BolProcessingConfig() {
  const emailForm = useForm<z.infer<typeof emailConfigSchema>>({
    resolver: zodResolver(emailConfigSchema),
    defaultValues: {
      enabled: true,
      fromEmail: "noreply@truckingsaas.com",
      toEmail: "",
      ccEmail: "",
      bccEmail: "",
      subject: "New BOL Document Processed",
      template:
        "<h1>New BOL Document</h1><p>A new Bill of Lading document has been processed.</p>",
      schedule: "immediate",
      scheduledTime: "",
    },
  });

  const paymentForm = useForm<z.infer<typeof paymentConfigSchema>>({
    resolver: zodResolver(paymentConfigSchema),
    defaultValues: {
      enabled: true,
      provider: "stripe",
      apiKey: "",
      webhookUrl: "",
      autoProcess: false,
    },
  });

  const onEmailSubmit = (values: z.infer<typeof emailConfigSchema>) => {
    console.log("Email config saved:", values);
    // Here you would save the configuration to your backend
  };

  const onPaymentSubmit = (values: z.infer<typeof paymentConfigSchema>) => {
    console.log("Payment config saved:", values);
    // Here you would save the configuration to your backend
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">BOL Processing Configuration</h1>

      <Tabs defaultValue="email" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="email">Email Notifications</TabsTrigger>
          <TabsTrigger value="payment">Payment Processing</TabsTrigger>
        </TabsList>

        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle>Email Notification Settings</CardTitle>
              <CardDescription>
                Configure how BOL documents are sent via email after processing.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...emailForm}>
                <form
                  onSubmit={emailForm.handleSubmit(onEmailSubmit)}
                  className="space-y-6"
                >
                  <FormField
                    control={emailForm.control}
                    name="enabled"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Enable Email Notifications
                          </FormLabel>
                          <FormDescription>
                            Send email notifications when BOL documents are
                            processed
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

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={emailForm.control}
                      name="fromEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>From Email</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="noreply@example.com"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={emailForm.control}
                      name="toEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>To Email</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="recipient@example.com"
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
                      control={emailForm.control}
                      name="ccEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CC Email (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="cc@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={emailForm.control}
                      name="bccEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>BCC Email (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="bcc@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={emailForm.control}
                    name="subject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Subject</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="New BOL Document Processed"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={emailForm.control}
                    name="template"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Template</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter HTML template for email body"
                            className="min-h-[200px] font-mono"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          You can use HTML and the following variables:{" "}
                          {"{documentId}"}, {"{documentDate}"},{" "}
                          {"{customerName}"}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={emailForm.control}
                      name="schedule"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notification Schedule</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select schedule" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="immediate">
                                Immediate
                              </SelectItem>
                              <SelectItem value="daily">
                                Daily Digest
                              </SelectItem>
                              <SelectItem value="weekly">
                                Weekly Digest
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {emailForm.watch("schedule") !== "immediate" && (
                      <FormField
                        control={emailForm.control}
                        name="scheduledTime"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Scheduled Time</FormLabel>
                            <FormControl>
                              <Input type="time" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>

                  <Button type="submit" className="w-full">
                    Save Email Configuration
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment">
          <Card>
            <CardHeader>
              <CardTitle>Payment Processing Settings</CardTitle>
              <CardDescription>
                Configure how BOL documents are processed for payment.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...paymentForm}>
                <form
                  onSubmit={paymentForm.handleSubmit(onPaymentSubmit)}
                  className="space-y-6"
                >
                  <FormField
                    control={paymentForm.control}
                    name="enabled"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Enable Payment Processing
                          </FormLabel>
                          <FormDescription>
                            Automatically process payments when BOL documents
                            are received
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
                    control={paymentForm.control}
                    name="provider"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Provider</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select provider" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="stripe">Stripe</SelectItem>
                            <SelectItem value="paypal">PayPal</SelectItem>
                            <SelectItem value="custom">Custom API</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={paymentForm.control}
                    name="apiKey"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>API Key</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Enter API key"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={paymentForm.control}
                    name="webhookUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Webhook URL (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="https://example.com/webhook"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          URL to receive payment processing notifications
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={paymentForm.control}
                    name="autoProcess"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Auto-Process Payments
                          </FormLabel>
                          <FormDescription>
                            Automatically process payments without manual review
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

                  <Button type="submit" className="w-full">
                    Save Payment Configuration
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
