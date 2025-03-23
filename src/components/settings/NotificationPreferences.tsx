import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import {
  NotificationType,
  NotificationChannel,
  UserNotificationPreferences,
} from "@/services/notification.service";
import { Loader2 } from "lucide-react";

export default function NotificationPreferences() {
  const [preferences, setPreferences] =
    useState<UserNotificationPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      setIsLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("user_notification_preferences")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      if (data) {
        setPreferences(data as UserNotificationPreferences);
      } else {
        // Create default preferences
        const defaultPreferences: UserNotificationPreferences = {
          userId: user.id,
          enablePush: true,
          enableSms: true,
          enableEmail: true,
          notificationTypes: {
            [NotificationType.NEW_MESSAGE]: {
              enabled: true,
              channels: [
                NotificationChannel.IN_APP,
                NotificationChannel.PUSH,
                NotificationChannel.EMAIL,
              ],
            },
            [NotificationType.LOAD_ASSIGNED]: {
              enabled: true,
              channels: [
                NotificationChannel.IN_APP,
                NotificationChannel.PUSH,
                NotificationChannel.EMAIL,
              ],
            },
            [NotificationType.LOAD_STATUS_CHANGE]: {
              enabled: true,
              channels: [NotificationChannel.IN_APP, NotificationChannel.PUSH],
            },
            [NotificationType.DOCUMENT_UPLOADED]: {
              enabled: true,
              channels: [NotificationChannel.IN_APP, NotificationChannel.PUSH],
            },
            [NotificationType.PAYMENT_STATUS]: {
              enabled: true,
              channels: [
                NotificationChannel.IN_APP,
                NotificationChannel.PUSH,
                NotificationChannel.EMAIL,
              ],
            },
          },
        };

        setPreferences(defaultPreferences);

        // Save default preferences to database
        const { error: insertError } = await supabase
          .from("user_notification_preferences")
          .insert(defaultPreferences);

        if (insertError) throw insertError;
      }
    } catch (error) {
      console.error("Error fetching notification preferences:", error);
      toast({
        title: "Error",
        description: "Failed to load notification preferences",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const savePreferences = async () => {
    if (!preferences) return;

    try {
      setIsSaving(true);
      const { error } = await supabase
        .from("user_notification_preferences")
        .upsert(preferences);

      if (error) throw error;

      toast({
        title: "Preferences saved",
        description: "Your notification preferences have been updated",
      });
    } catch (error) {
      console.error("Error saving notification preferences:", error);
      toast({
        title: "Error",
        description: "Failed to save notification preferences",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleGlobalChannel = (
    channel: "enablePush" | "enableSms" | "enableEmail",
    value: boolean,
  ) => {
    if (!preferences) return;
    setPreferences({ ...preferences, [channel]: value });
  };

  const toggleNotificationType = (type: NotificationType, enabled: boolean) => {
    if (!preferences) return;

    const updatedPreferences = { ...preferences };
    if (!updatedPreferences.notificationTypes[type]) {
      updatedPreferences.notificationTypes[type] = {
        enabled,
        channels: [NotificationChannel.IN_APP, NotificationChannel.PUSH],
      };
    } else {
      updatedPreferences.notificationTypes[type].enabled = enabled;
    }

    setPreferences(updatedPreferences);
  };

  const toggleNotificationChannel = (
    type: NotificationType,
    channel: NotificationChannel,
    enabled: boolean,
  ) => {
    if (!preferences) return;

    const updatedPreferences = { ...preferences };
    if (!updatedPreferences.notificationTypes[type]) {
      updatedPreferences.notificationTypes[type] = {
        enabled: true,
        channels: [NotificationChannel.IN_APP],
      };
    }

    const channels = updatedPreferences.notificationTypes[type].channels;
    if (enabled && !channels.includes(channel)) {
      channels.push(channel);
    } else if (!enabled && channels.includes(channel)) {
      updatedPreferences.notificationTypes[type].channels = channels.filter(
        (c) => c !== channel,
      );
    }

    // Always keep IN_APP notifications
    if (
      !updatedPreferences.notificationTypes[type].channels.includes(
        NotificationChannel.IN_APP,
      )
    ) {
      updatedPreferences.notificationTypes[type].channels.push(
        NotificationChannel.IN_APP,
      );
    }

    setPreferences(updatedPreferences);
  };

  const updateQuietHours = (start: string, end: string) => {
    if (!preferences) return;
    setPreferences({
      ...preferences,
      quietHoursStart: start,
      quietHoursEnd: end,
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!preferences) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>
            Failed to load notification preferences. Please try again.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={fetchPreferences}>Retry</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Notification Channels</CardTitle>
          <CardDescription>
            Control which channels you receive notifications on
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between space-x-2">
            <Label
              htmlFor="push-notifications"
              className="flex flex-col space-y-1"
            >
              <span>Push Notifications</span>
              <span className="font-normal text-sm text-muted-foreground">
                Receive notifications on your mobile device
              </span>
            </Label>
            <Switch
              id="push-notifications"
              checked={preferences.enablePush}
              onCheckedChange={(checked) =>
                toggleGlobalChannel("enablePush", checked)
              }
            />
          </div>

          <div className="flex items-center justify-between space-x-2">
            <Label
              htmlFor="sms-notifications"
              className="flex flex-col space-y-1"
            >
              <span>SMS Notifications</span>
              <span className="font-normal text-sm text-muted-foreground">
                Receive text messages for important updates
              </span>
            </Label>
            <Switch
              id="sms-notifications"
              checked={preferences.enableSms}
              onCheckedChange={(checked) =>
                toggleGlobalChannel("enableSms", checked)
              }
            />
          </div>

          <div className="flex items-center justify-between space-x-2">
            <Label
              htmlFor="email-notifications"
              className="flex flex-col space-y-1"
            >
              <span>Email Notifications</span>
              <span className="font-normal text-sm text-muted-foreground">
                Receive email notifications
              </span>
            </Label>
            <Switch
              id="email-notifications"
              checked={preferences.enableEmail}
              onCheckedChange={(checked) =>
                toggleGlobalChannel("enableEmail", checked)
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quiet Hours</CardTitle>
          <CardDescription>
            Set times when you don't want to receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quiet-hours-start">Start Time</Label>
              <Input
                id="quiet-hours-start"
                type="time"
                value={preferences.quietHoursStart || ""}
                onChange={(e) =>
                  updateQuietHours(
                    e.target.value,
                    preferences.quietHoursEnd || "",
                  )
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quiet-hours-end">End Time</Label>
              <Input
                id="quiet-hours-end"
                type="time"
                value={preferences.quietHoursEnd || ""}
                onChange={(e) =>
                  updateQuietHours(
                    preferences.quietHoursStart || "",
                    e.target.value,
                  )
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notification Types</CardTitle>
          <CardDescription>
            Customize which notifications you receive and how
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="messages">
            <TabsList className="grid grid-cols-5 mb-4">
              <TabsTrigger value="messages">Messages</TabsTrigger>
              <TabsTrigger value="loads">Loads</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="payments">Payments</TabsTrigger>
              <TabsTrigger value="status">Status</TabsTrigger>
            </TabsList>

            <TabsContent value="messages" className="space-y-4">
              <div className="flex items-center justify-between space-x-2">
                <Label
                  htmlFor="new-message-notifications"
                  className="flex flex-col space-y-1"
                >
                  <span>New Messages</span>
                  <span className="font-normal text-sm text-muted-foreground">
                    Get notified when you receive new messages
                  </span>
                </Label>
                <Switch
                  id="new-message-notifications"
                  checked={
                    preferences.notificationTypes[NotificationType.NEW_MESSAGE]
                      ?.enabled ?? true
                  }
                  onCheckedChange={(checked) =>
                    toggleNotificationType(
                      NotificationType.NEW_MESSAGE,
                      checked,
                    )
                  }
                />
              </div>

              {preferences.notificationTypes[NotificationType.NEW_MESSAGE]
                ?.enabled && (
                <div className="ml-6 mt-2 space-y-2">
                  <p className="text-sm font-medium">Notification channels:</p>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="new-message-push"
                        checked={preferences.notificationTypes[
                          NotificationType.NEW_MESSAGE
                        ]?.channels.includes(NotificationChannel.PUSH)}
                        onCheckedChange={(checked) =>
                          toggleNotificationChannel(
                            NotificationType.NEW_MESSAGE,
                            NotificationChannel.PUSH,
                            !!checked,
                          )
                        }
                        disabled={!preferences.enablePush}
                      />
                      <Label htmlFor="new-message-push" className="text-sm">
                        Push notifications
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="new-message-sms"
                        checked={preferences.notificationTypes[
                          NotificationType.NEW_MESSAGE
                        ]?.channels.includes(NotificationChannel.SMS)}
                        onCheckedChange={(checked) =>
                          toggleNotificationChannel(
                            NotificationType.NEW_MESSAGE,
                            NotificationChannel.SMS,
                            !!checked,
                          )
                        }
                        disabled={!preferences.enableSms}
                      />
                      <Label htmlFor="new-message-sms" className="text-sm">
                        SMS notifications
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="new-message-email"
                        checked={preferences.notificationTypes[
                          NotificationType.NEW_MESSAGE
                        ]?.channels.includes(NotificationChannel.EMAIL)}
                        onCheckedChange={(checked) =>
                          toggleNotificationChannel(
                            NotificationType.NEW_MESSAGE,
                            NotificationChannel.EMAIL,
                            !!checked,
                          )
                        }
                        disabled={!preferences.enableEmail}
                      />
                      <Label htmlFor="new-message-email" className="text-sm">
                        Email notifications
                      </Label>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="loads" className="space-y-4">
              <div className="flex items-center justify-between space-x-2">
                <Label
                  htmlFor="load-assigned-notifications"
                  className="flex flex-col space-y-1"
                >
                  <span>Load Assignments</span>
                  <span className="font-normal text-sm text-muted-foreground">
                    Get notified when a load is assigned to you
                  </span>
                </Label>
                <Switch
                  id="load-assigned-notifications"
                  checked={
                    preferences.notificationTypes[
                      NotificationType.LOAD_ASSIGNED
                    ]?.enabled ?? true
                  }
                  onCheckedChange={(checked) =>
                    toggleNotificationType(
                      NotificationType.LOAD_ASSIGNED,
                      checked,
                    )
                  }
                />
              </div>

              {preferences.notificationTypes[NotificationType.LOAD_ASSIGNED]
                ?.enabled && (
                <div className="ml-6 mt-2 space-y-2">
                  <p className="text-sm font-medium">Notification channels:</p>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="load-assigned-push"
                        checked={preferences.notificationTypes[
                          NotificationType.LOAD_ASSIGNED
                        ]?.channels.includes(NotificationChannel.PUSH)}
                        onCheckedChange={(checked) =>
                          toggleNotificationChannel(
                            NotificationType.LOAD_ASSIGNED,
                            NotificationChannel.PUSH,
                            !!checked,
                          )
                        }
                        disabled={!preferences.enablePush}
                      />
                      <Label htmlFor="load-assigned-push" className="text-sm">
                        Push notifications
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="load-assigned-sms"
                        checked={preferences.notificationTypes[
                          NotificationType.LOAD_ASSIGNED
                        ]?.channels.includes(NotificationChannel.SMS)}
                        onCheckedChange={(checked) =>
                          toggleNotificationChannel(
                            NotificationType.LOAD_ASSIGNED,
                            NotificationChannel.SMS,
                            !!checked,
                          )
                        }
                        disabled={!preferences.enableSms}
                      />
                      <Label htmlFor="load-assigned-sms" className="text-sm">
                        SMS notifications
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="load-assigned-email"
                        checked={preferences.notificationTypes[
                          NotificationType.LOAD_ASSIGNED
                        ]?.channels.includes(NotificationChannel.EMAIL)}
                        onCheckedChange={(checked) =>
                          toggleNotificationChannel(
                            NotificationType.LOAD_ASSIGNED,
                            NotificationChannel.EMAIL,
                            !!checked,
                          )
                        }
                        disabled={!preferences.enableEmail}
                      />
                      <Label htmlFor="load-assigned-email" className="text-sm">
                        Email notifications
                      </Label>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="status" className="space-y-4">
              <div className="flex items-center justify-between space-x-2">
                <Label
                  htmlFor="status-change-notifications"
                  className="flex flex-col space-y-1"
                >
                  <span>Status Changes</span>
                  <span className="font-normal text-sm text-muted-foreground">
                    Get notified when a load status changes
                  </span>
                </Label>
                <Switch
                  id="status-change-notifications"
                  checked={
                    preferences.notificationTypes[
                      NotificationType.LOAD_STATUS_CHANGE
                    ]?.enabled ?? true
                  }
                  onCheckedChange={(checked) =>
                    toggleNotificationType(
                      NotificationType.LOAD_STATUS_CHANGE,
                      checked,
                    )
                  }
                />
              </div>

              {preferences.notificationTypes[
                NotificationType.LOAD_STATUS_CHANGE
              ]?.enabled && (
                <div className="ml-6 mt-2 space-y-2">
                  <p className="text-sm font-medium">Notification channels:</p>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="status-change-push"
                        checked={preferences.notificationTypes[
                          NotificationType.LOAD_STATUS_CHANGE
                        ]?.channels.includes(NotificationChannel.PUSH)}
                        onCheckedChange={(checked) =>
                          toggleNotificationChannel(
                            NotificationType.LOAD_STATUS_CHANGE,
                            NotificationChannel.PUSH,
                            !!checked,
                          )
                        }
                        disabled={!preferences.enablePush}
                      />
                      <Label htmlFor="status-change-push" className="text-sm">
                        Push notifications
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="status-change-sms"
                        checked={preferences.notificationTypes[
                          NotificationType.LOAD_STATUS_CHANGE
                        ]?.channels.includes(NotificationChannel.SMS)}
                        onCheckedChange={(checked) =>
                          toggleNotificationChannel(
                            NotificationType.LOAD_STATUS_CHANGE,
                            NotificationChannel.SMS,
                            !!checked,
                          )
                        }
                        disabled={!preferences.enableSms}
                      />
                      <Label htmlFor="status-change-sms" className="text-sm">
                        SMS notifications
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="status-change-email"
                        checked={preferences.notificationTypes[
                          NotificationType.LOAD_STATUS_CHANGE
                        ]?.channels.includes(NotificationChannel.EMAIL)}
                        onCheckedChange={(checked) =>
                          toggleNotificationChannel(
                            NotificationType.LOAD_STATUS_CHANGE,
                            NotificationChannel.EMAIL,
                            !!checked,
                          )
                        }
                        disabled={!preferences.enableEmail}
                      />
                      <Label htmlFor="status-change-email" className="text-sm">
                        Email notifications
                      </Label>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="documents" className="space-y-4">
              <div className="flex items-center justify-between space-x-2">
                <Label
                  htmlFor="document-notifications"
                  className="flex flex-col space-y-1"
                >
                  <span>Document Uploads</span>
                  <span className="font-normal text-sm text-muted-foreground">
                    Get notified when documents are uploaded
                  </span>
                </Label>
                <Switch
                  id="document-notifications"
                  checked={
                    preferences.notificationTypes[
                      NotificationType.DOCUMENT_UPLOADED
                    ]?.enabled ?? true
                  }
                  onCheckedChange={(checked) =>
                    toggleNotificationType(
                      NotificationType.DOCUMENT_UPLOADED,
                      checked,
                    )
                  }
                />
              </div>

              {preferences.notificationTypes[NotificationType.DOCUMENT_UPLOADED]
                ?.enabled && (
                <div className="ml-6 mt-2 space-y-2">
                  <p className="text-sm font-medium">Notification channels:</p>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="document-push"
                        checked={preferences.notificationTypes[
                          NotificationType.DOCUMENT_UPLOADED
                        ]?.channels.includes(NotificationChannel.PUSH)}
                        onCheckedChange={(checked) =>
                          toggleNotificationChannel(
                            NotificationType.DOCUMENT_UPLOADED,
                            NotificationChannel.PUSH,
                            !!checked,
                          )
                        }
                        disabled={!preferences.enablePush}
                      />
                      <Label htmlFor="document-push" className="text-sm">
                        Push notifications
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="document-sms"
                        checked={preferences.notificationTypes[
                          NotificationType.DOCUMENT_UPLOADED
                        ]?.channels.includes(NotificationChannel.SMS)}
                        onCheckedChange={(checked) =>
                          toggleNotificationChannel(
                            NotificationType.DOCUMENT_UPLOADED,
                            NotificationChannel.SMS,
                            !!checked,
                          )
                        }
                        disabled={!preferences.enableSms}
                      />
                      <Label htmlFor="document-sms" className="text-sm">
                        SMS notifications
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="document-email"
                        checked={preferences.notificationTypes[
                          NotificationType.DOCUMENT_UPLOADED
                        ]?.channels.includes(NotificationChannel.EMAIL)}
                        onCheckedChange={(checked) =>
                          toggleNotificationChannel(
                            NotificationType.DOCUMENT_UPLOADED,
                            NotificationChannel.EMAIL,
                            !!checked,
                          )
                        }
                        disabled={!preferences.enableEmail}
                      />
                      <Label htmlFor="document-email" className="text-sm">
                        Email notifications
                      </Label>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="payments" className="space-y-4">
              <div className="flex items-center justify-between space-x-2">
                <Label
                  htmlFor="payment-notifications"
                  className="flex flex-col space-y-1"
                >
                  <span>Payment Updates</span>
                  <span className="font-normal text-sm text-muted-foreground">
                    Get notified about payment status changes
                  </span>
                </Label>
                <Switch
                  id="payment-notifications"
                  checked={
                    preferences.notificationTypes[
                      NotificationType.PAYMENT_STATUS
                    ]?.enabled ?? true
                  }
                  onCheckedChange={(checked) =>
                    toggleNotificationType(
                      NotificationType.PAYMENT_STATUS,
                      checked,
                    )
                  }
                />
              </div>

              {preferences.notificationTypes[NotificationType.PAYMENT_STATUS]
                ?.enabled && (
                <div className="ml-6 mt-2 space-y-2">
                  <p className="text-sm font-medium">Notification channels:</p>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="payment-push"
                        checked={preferences.notificationTypes[
                          NotificationType.PAYMENT_STATUS
                        ]?.channels.includes(NotificationChannel.PUSH)}
                        onCheckedChange={(checked) =>
                          toggleNotificationChannel(
                            NotificationType.PAYMENT_STATUS,
                            NotificationChannel.PUSH,
                            !!checked,
                          )
                        }
                        disabled={!preferences.enablePush}
                      />
                      <Label htmlFor="payment-push" className="text-sm">
                        Push notifications
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="payment-sms"
                        checked={preferences.notificationTypes[
                          NotificationType.PAYMENT_STATUS
                        ]?.channels.includes(NotificationChannel.SMS)}
                        onCheckedChange={(checked) =>
                          toggleNotificationChannel(
                            NotificationType.PAYMENT_STATUS,
                            NotificationChannel.SMS,
                            !!checked,
                          )
                        }
                        disabled={!preferences.enableSms}
                      />
                      <Label htmlFor="payment-sms" className="text-sm">
                        SMS notifications
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="payment-email"
                        checked={preferences.notificationTypes[
                          NotificationType.PAYMENT_STATUS
                        ]?.channels.includes(NotificationChannel.EMAIL)}
                        onCheckedChange={(checked) =>
                          toggleNotificationChannel(
                            NotificationType.PAYMENT_STATUS,
                            NotificationChannel.EMAIL,
                            !!checked,
                          )
                        }
                        disabled={!preferences.enableEmail}
                      />
                      <Label htmlFor="payment-email" className="text-sm">
                        Email notifications
                      </Label>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={savePreferences} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Preferences"
          )}
        </Button>
      </div>
    </div>
  );
}
