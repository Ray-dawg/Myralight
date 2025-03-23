import { supabase } from "@/lib/supabase";
import { logger } from "@/api/utils/logger";
import { v4 as uuidv4 } from "uuid";

// Import LLM prompt framework for intelligent notifications
import {
  NotificationPromptType,
  NotificationContext,
  buildNotificationPrompt,
  shouldSendNotification,
  determineUrgencyLevel,
  determineNotificationChannel,
} from "@/lib/prompt-engineering/notification-prompt-framework";

// Notification types
export enum NotificationType {
  NEW_MESSAGE = "new_message",
  LOAD_ASSIGNED = "load_assigned",
  LOAD_STATUS_CHANGE = "load_status_change",
  DOCUMENT_UPLOADED = "document_uploaded",
  DOCUMENT_REQUIRED = "document_required",
  PAYMENT_STATUS = "payment_status",
  GEOFENCE_ENTRY = "geofence_entry",
  GEOFENCE_EXIT = "geofence_exit",
  APPROACHING_GEOFENCE = "approaching_geofence",
  DWELL_TIME_ALERT = "dwell_time_alert",
  ETA_UPDATE = "eta_update",
  DELAY_ALERT = "delay_alert",
  DELIVERY_COMPLETE = "delivery_complete",
  WEATHER_ALERT = "weather_alert",
}

// Notification channels
export enum NotificationChannel {
  PUSH = "push",
  SMS = "sms",
  EMAIL = "email",
  IN_APP = "in_app",
}

// Notification status
export enum NotificationStatus {
  PENDING = "pending",
  SENDING = "sending",
  DELIVERED = "delivered",
  FAILED = "failed",
  THROTTLED = "throttled",
  SKIPPED = "skipped",
}

// Notification data interface
export interface NotificationData {
  userId?: string;
  loadId?: string;
  loadNumber?: string;
  chatSessionId?: string;
  messagePreview?: string;
  senderType?: string;
  senderName?: string;
  documentType?: string;
  statusChange?: string;
  paymentStatus?: string;
  amount?: number;
  geofenceId?: string;
  geofenceType?: string; // "pickup" or "delivery"
  locationName?: string;
  entryTime?: string;
  exitTime?: string;
  dwellTime?: number; // Time spent in geofence in minutes
  estimatedTimeOfArrival?: number;
  distanceInMeters?: number;
  latitude?: number;
  longitude?: number;
  originalEta?: Date;
  updatedEta?: Date;
  etaChangeMinutes?: number;
  etaChangePercent?: number;
  delayReason?: string;
  weatherCondition?: string;
  weatherSeverity?: string;
  entryTimestamp?: number;
  [key: string]: any;
}

// Notification delivery record
export interface NotificationDelivery {
  id: string;
  userId: string;
  notificationType: NotificationType;
  channel: NotificationChannel;
  status: NotificationStatus;
  data: NotificationData;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

// User notification preferences
export interface UserNotificationPreferences {
  userId: string;
  enablePush: boolean;
  enableSms: boolean;
  enableEmail: boolean;
  quietHoursStart?: string; // Format: "HH:MM"
  quietHoursEnd?: string; // Format: "HH:MM"
  notificationTypes: {
    [key in NotificationType]?: {
      enabled: boolean;
      channels: NotificationChannel[];
    };
  };
}

/**
 * Notification Service for handling multi-channel notifications
 */
export class NotificationService {
  private static instance: NotificationService;
  private throttleMap: Map<string, number> = new Map(); // userId_channel_type -> timestamp
  private readonly THROTTLE_WINDOW_MS = 60000; // 1 minute

  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Notify users about a new message
   * @param messageId The ID of the message
   */
  async notifyNewMessage(messageId: string): Promise<boolean> {
    try {
      // Get message with related data
      const { data: message, error: messageError } = await supabase
        .from("load_chat_messages")
        .select("*, load_chats(load_id)")
        .eq("id", messageId)
        .single();

      if (messageError) throw messageError;

      // Get load information
      const { data: load, error: loadError } = await supabase
        .from("loads")
        .select("id, reference_number")
        .eq("id", message.load_chats.load_id)
        .single();

      if (loadError) throw loadError;

      // Get all participants except sender
      const { data: participants, error: participantsError } = await supabase
        .from("load_chat_participants")
        .select("user_id, user_type")
        .eq("load_id", message.load_chats.load_id)
        .neq("user_id", message.sender_id)
        .eq("is_active", true);

      if (participantsError) throw participantsError;

      // Get sender profile for name
      const { data: senderProfile, error: senderError } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", message.sender_id)
        .single();

      const senderName = senderError ? undefined : senderProfile.full_name;

      // Prepare notification content
      const notificationData: NotificationData = {
        loadId: load.id,
        loadNumber: load.reference_number,
        chatSessionId: message.chat_id,
        messagePreview: message.message.substring(0, 100),
        senderType: message.sender_type,
        senderName,
      };

      // Send notification to each participant
      for (const participant of participants) {
        await this.dispatchToParticipant(
          participant.user_id,
          NotificationType.NEW_MESSAGE,
          notificationData,
        );
      }

      return true;
    } catch (error) {
      logger.error(`Error dispatching new message notifications: ${error}`);
      return false;
    }
  }

  /**
   * Notify about ETA update
   * @param loadId The ID of the load
   * @param data Notification data including ETA information
   */
  async notifyEtaUpdate(
    loadId: string,
    data: NotificationData,
  ): Promise<boolean> {
    try {
      // Get load information
      const { data: load, error: loadError } = await supabase
        .from("loads")
        .select("id, reference_number, shipper_id, carrier_id")
        .eq("id", loadId)
        .single();

      if (loadError) throw loadError;

      // Prepare notification data
      const notificationData: NotificationData = {
        ...data,
        loadId: load.id,
        loadNumber: load.reference_number,
      };

      // Get participants to notify
      const participantsToNotify = [];

      // Add shipper
      if (load.shipper_id) {
        participantsToNotify.push({
          user_id: load.shipper_id,
          user_type: "shipper",
        });
      }

      // Add carrier
      if (load.carrier_id) {
        participantsToNotify.push({
          user_id: load.carrier_id,
          user_type: "carrier",
        });
      }

      // Get driver(s) assigned to this load
      const { data: drivers, error: driversError } = await supabase
        .from("load_assignments")
        .select("driver_id")
        .eq("load_id", loadId)
        .eq("is_active", true);

      if (!driversError && drivers) {
        for (const driver of drivers) {
          participantsToNotify.push({
            user_id: driver.driver_id,
            user_type: "driver",
          });
        }
      }

      // Send notification to each participant
      for (const participant of participantsToNotify) {
        await this.dispatchToParticipant(
          participant.user_id,
          NotificationType.ETA_UPDATE,
          notificationData,
        );
      }

      return true;
    } catch (error) {
      logger.error(`Error dispatching ETA update notifications: ${error}`);
      return false;
    }
  }

  /**
   * Dispatch notification to a participant
   * @param userId User ID to notify
   * @param notificationType Type of notification
   * @param data Notification data
   */
  async dispatchToParticipant(
    userId: string,
    notificationType: NotificationType,
    data: NotificationData,
  ): Promise<void> {
    try {
      // Add userId to data for context
      data.userId = userId;

      // Get user preferences
      const preferences = await this.getUserPreferences(userId);

      // Check if user has enabled this notification type
      const typePrefs = preferences.notificationTypes[notificationType];
      if (!typePrefs || !typePrefs.enabled) {
        logger.info(
          `User ${userId} has disabled ${notificationType} notifications`,
        );
        return;
      }

      // Check quiet hours
      if (this.isInQuietHours(preferences)) {
        logger.info(
          `Skipping notification for user ${userId} during quiet hours`,
        );
        return;
      }

      // Check if this notification should be sent based on thresholds
      const promptType = this.mapToPromptType(notificationType);
      if (
        promptType &&
        !this.shouldSendNotificationBasedOnThresholds(promptType, userId, data)
      ) {
        logger.info(
          `Skipping notification for user ${userId} based on thresholds`,
        );
        return;
      }

      // Create in-app notification first (always)
      await this.createInAppNotification(userId, notificationType, data);

      // Try channels in order of preference
      const channels = typePrefs.channels;
      let delivered = false;

      for (const channel of channels) {
        // Skip in-app as we already created it
        if (channel === NotificationChannel.IN_APP) continue;

        // Check if channel is enabled globally
        if (
          (channel === NotificationChannel.PUSH && !preferences.enablePush) ||
          (channel === NotificationChannel.SMS && !preferences.enableSms) ||
          (channel === NotificationChannel.EMAIL && !preferences.enableEmail)
        ) {
          continue;
        }

        // Check throttling
        if (this.isThrottled(userId, channel, notificationType)) {
          logger.info(
            `Notification throttled for user ${userId} on channel ${channel}`,
          );
          continue;
        }

        // Try to deliver via this channel
        const result = await this.deliverToChannel(
          userId,
          notificationType,
          channel,
          data,
        );
        if (result.status === NotificationStatus.DELIVERED) {
          delivered = true;
          break; // Stop after first successful delivery
        }
      }

      if (!delivered) {
        logger.warn(
          `Failed to deliver ${notificationType} notification to user ${userId} on any channel`,
        );
      }
    } catch (error) {
      logger.error(
        `Error dispatching notification to user ${userId}: ${error}`,
      );
    }
  }

  /**
   * Deliver notification through a specific channel
   * @param userId User ID to notify
   * @param notificationType Type of notification
   * @param channel Channel to use
   * @param data Notification data
   */
  private async deliverToChannel(
    userId: string,
    notificationType: NotificationType,
    channel: NotificationChannel,
    data: NotificationData,
  ): Promise<{ status: NotificationStatus; reason?: string }> {
    // Create delivery record
    const deliveryId = await this.createDeliveryRecord(
      userId,
      notificationType,
      channel,
      data,
      NotificationStatus.SENDING,
    );

    try {
      let result: { status: NotificationStatus; reason?: string };

      // Deliver based on channel
      switch (channel) {
        case NotificationChannel.PUSH:
          result = await this.sendPushNotification(
            userId,
            notificationType,
            data,
          );
          break;
        case NotificationChannel.SMS:
          result = await this.sendSmsNotification(
            userId,
            notificationType,
            data,
          );
          break;
        case NotificationChannel.EMAIL:
          result = await this.sendEmailNotification(
            userId,
            notificationType,
            data,
          );
          break;
        default:
          result = {
            status: NotificationStatus.FAILED,
            reason: "Invalid channel",
          };
      }

      // Update delivery record
      await this.updateDeliveryRecord(deliveryId, result.status, result.reason);

      // Update throttle map on success
      if (result.status === NotificationStatus.DELIVERED) {
        this.updateThrottleMap(userId, channel, notificationType);
      }

      return result;
    } catch (error) {
      // Update delivery record with error
      await this.updateDeliveryRecord(
        deliveryId,
        NotificationStatus.FAILED,
        error.message,
      );
      return { status: NotificationStatus.FAILED, reason: error.message };
    }
  }

  /**
   * Send push notification
   * @param userId User ID to notify
   * @param notificationType Type of notification
   * @param data Notification data
   */
  private async sendPushNotification(
    userId: string,
    notificationType: NotificationType,
    data: NotificationData,
  ): Promise<{ status: NotificationStatus; reason?: string }> {
    try {
      // Get user's device tokens
      const { data: devices, error } = await supabase
        .from("user_devices")
        .select("*")
        .eq("user_id", userId)
        .eq("is_active", true);

      if (error) throw error;

      if (!devices || devices.length === 0) {
        return {
          status: NotificationStatus.SKIPPED,
          reason: "No active devices",
        };
      }

      // Prepare notification content
      const {
        title,
        body,
        data: pushData,
      } = await this.formatPushContent(notificationType, data);

      // In a real implementation, you would use Firebase Admin SDK or similar
      // Here we'll simulate a successful push
      logger.info(`Sending push notification to user ${userId}: ${title}`);

      // Simulate success for demo purposes
      return { status: NotificationStatus.DELIVERED };
    } catch (error) {
      logger.error(
        `Error sending push notification to user ${userId}: ${error}`,
      );
      return { status: NotificationStatus.FAILED, reason: error.message };
    }
  }

  /**
   * Send SMS notification
   * @param userId User ID to notify
   * @param notificationType Type of notification
   * @param data Notification data
   */
  private async sendSmsNotification(
    userId: string,
    notificationType: NotificationType,
    data: NotificationData,
  ): Promise<{ status: NotificationStatus; reason?: string }> {
    try {
      // Get user's phone number
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("phone_number")
        .eq("id", userId)
        .single();

      if (error) throw error;

      if (!profile.phone_number) {
        return {
          status: NotificationStatus.SKIPPED,
          reason: "No phone number",
        };
      }

      // Format SMS content
      const message = await this.formatSmsContent(notificationType, data);

      // In a real implementation, you would use Twilio or similar
      // Here we'll simulate a successful SMS
      logger.info(
        `Sending SMS to user ${userId} at ${profile.phone_number}: ${message}`,
      );

      // Simulate success for demo purposes
      return { status: NotificationStatus.DELIVERED };
    } catch (error) {
      logger.error(
        `Error sending SMS notification to user ${userId}: ${error}`,
      );
      return { status: NotificationStatus.FAILED, reason: error.message };
    }
  }

  /**
   * Send email notification
   * @param userId User ID to notify
   * @param notificationType Type of notification
   * @param data Notification data
   */
  private async sendEmailNotification(
    userId: string,
    notificationType: NotificationType,
    data: NotificationData,
  ): Promise<{ status: NotificationStatus; reason?: string }> {
    try {
      // Get user's email
      const { data: user, error: userError } =
        await supabase.auth.admin.getUserById(userId);

      if (userError) throw userError;

      if (!user || !user.email) {
        return {
          status: NotificationStatus.SKIPPED,
          reason: "No email address",
        };
      }

      // Format email content
      const { subject, html } = await this.formatEmailContent(
        notificationType,
        data,
      );

      // In a real implementation, you would use a proper email service
      // Here we'll simulate a successful email
      logger.info(
        `Sending email to user ${userId} at ${user.email}: ${subject}`,
      );

      // Simulate success for demo purposes
      return { status: NotificationStatus.DELIVERED };
    } catch (error) {
      logger.error(
        `Error sending email notification to user ${userId}: ${error}`,
      );
      return { status: NotificationStatus.FAILED, reason: error.message };
    }
  }

  /**
   * Create in-app notification
   * @param userId User ID to notify
   * @param notificationType Type of notification
   * @param data Notification data
   */
  private async createInAppNotification(
    userId: string,
    notificationType: NotificationType,
    data: NotificationData,
  ): Promise<string | null> {
    try {
      // Format notification content
      const { title, body } = await this.formatInAppContent(
        notificationType,
        data,
      );

      // Create notification record
      const { data: notification, error } = await supabase
        .from("user_notifications")
        .insert({
          id: uuidv4(),
          user_id: userId,
          type: notificationType,
          title,
          message: body,
          data: data,
          is_read: false,
        })
        .select()
        .single();

      if (error) throw error;

      return notification.id;
    } catch (error) {
      logger.error(
        `Error creating in-app notification for user ${userId}: ${error}`,
      );
      return null;
    }
  }

  /**
   * Create delivery record
   * @param userId User ID
   * @param notificationType Type of notification
   * @param channel Delivery channel
   * @param data Notification data
   * @param status Initial status
   */
  private async createDeliveryRecord(
    userId: string,
    notificationType: NotificationType,
    channel: NotificationChannel,
    data: NotificationData,
    status: NotificationStatus,
  ): Promise<string> {
    try {
      const { data: record, error } = await supabase
        .from("notification_deliveries")
        .insert({
          id: uuidv4(),
          user_id: userId,
          notification_type: notificationType,
          channel,
          status,
          data,
        })
        .select()
        .single();

      if (error) throw error;

      return record.id;
    } catch (error) {
      logger.error(`Error creating delivery record: ${error}`);
      throw error;
    }
  }

  /**
   * Update delivery record
   * @param deliveryId Delivery record ID
   * @param status New status
   * @param errorMessage Optional error message
   */
  private async updateDeliveryRecord(
    deliveryId: string,
    status: NotificationStatus,
    errorMessage?: string,
  ): Promise<void> {
    try {
      const updateData: any = { status, updated_at: new Date() };
      if (errorMessage) {
        updateData.error_message = errorMessage;
      }

      const { error } = await supabase
        .from("notification_deliveries")
        .update(updateData)
        .eq("id", deliveryId);

      if (error) throw error;
    } catch (error) {
      logger.error(`Error updating delivery record ${deliveryId}: ${error}`);
    }
  }

  /**
   * Get user notification preferences
   * @param userId User ID
   */
  private async getUserPreferences(
    userId: string,
  ): Promise<UserNotificationPreferences> {
    try {
      // Try to get user preferences from database
      const { data, error } = await supabase
        .from("user_notification_preferences")
        .select("*")
        .eq("user_id", userId)
        .single();

      // If preferences exist, return them
      if (!error && data) {
        return data as UserNotificationPreferences;
      }

      // Otherwise, create default preferences
      const defaultPreferences: UserNotificationPreferences = {
        userId,
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
              NotificationChannel.SMS,
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
            channels: [
              NotificationChannel.IN_APP,
              NotificationChannel.PUSH,
              NotificationChannel.EMAIL,
            ],
          },
          [NotificationType.DOCUMENT_UPLOADED]: {
            enabled: true,
            channels: [NotificationChannel.IN_APP, NotificationChannel.PUSH],
          },
          [NotificationType.DOCUMENT_REQUIRED]: {
            enabled: true,
            channels: [
              NotificationChannel.IN_APP,
              NotificationChannel.PUSH,
              NotificationChannel.SMS,
            ],
          },
          [NotificationType.PAYMENT_STATUS]: {
            enabled: true,
            channels: [
              NotificationChannel.IN_APP,
              NotificationChannel.PUSH,
              NotificationChannel.EMAIL,
            ],
          },
          [NotificationType.GEOFENCE_ENTRY]: {
            enabled: true,
            channels: [
              NotificationChannel.IN_APP,
              NotificationChannel.PUSH,
              NotificationChannel.SMS,
            ],
          },
          [NotificationType.GEOFENCE_EXIT]: {
            enabled: true,
            channels: [NotificationChannel.IN_APP, NotificationChannel.PUSH],
          },
          [NotificationType.APPROACHING_GEOFENCE]: {
            enabled: true,
            channels: [NotificationChannel.IN_APP, NotificationChannel.PUSH],
          },
          [NotificationType.DWELL_TIME_ALERT]: {
            enabled: true,
            channels: [
              NotificationChannel.IN_APP,
              NotificationChannel.PUSH,
              NotificationChannel.SMS,
              NotificationChannel.EMAIL,
            ],
          },
          [NotificationType.ETA_UPDATE]: {
            enabled: true,
            channels: [
              NotificationChannel.IN_APP,
              NotificationChannel.PUSH,
              NotificationChannel.EMAIL,
            ],
          },
          [NotificationType.DELAY_ALERT]: {
            enabled: true,
            channels: [
              NotificationChannel.IN_APP,
              NotificationChannel.PUSH,
              NotificationChannel.SMS,
              NotificationChannel.EMAIL,
            ],
          },
          [NotificationType.DELIVERY_COMPLETE]: {
            enabled: true,
            channels: [
              NotificationChannel.IN_APP,
              NotificationChannel.PUSH,
              NotificationChannel.EMAIL,
            ],
          },
          [NotificationType.WEATHER_ALERT]: {
            enabled: true,
            channels: [
              NotificationChannel.IN_APP,
              NotificationChannel.PUSH,
              NotificationChannel.SMS,
            ],
          },
        },
      };

      // Save default preferences
      const { error: insertError } = await supabase
        .from("user_notification_preferences")
        .insert(defaultPreferences);

      if (insertError) {
        logger.error(
          `Error creating default notification preferences: ${insertError}`,
        );
      }

      return defaultPreferences;
    } catch (error) {
      logger.error(`Error getting user preferences: ${error}`);

      // Return basic default preferences if all else fails
      return {
        userId,
        enablePush: true,
        enableSms: true,
        enableEmail: true,
        notificationTypes: {
          [NotificationType.NEW_MESSAGE]: {
            enabled: true,
            channels: [NotificationChannel.IN_APP, NotificationChannel.PUSH],
          },
        },
      };
    }
  }

  /**
   * Get user notification preferences in a format suitable for the notification context
   */
  private async getUserNotificationPreferencesForContext(
    userId: string,
  ): Promise<any> {
    try {
      const preferences = await this.getUserPreferences(userId);
      return {
        quietHoursStart: preferences.quietHoursStart,
        quietHoursEnd: preferences.quietHoursEnd,
        preferredChannels: Object.entries(preferences.notificationTypes)
          .filter(([_, value]) => value.enabled)
          .flatMap(([_, value]) => value.channels)
          .filter((value, index, self) => self.indexOf(value) === index)
          .map((channel) => {
            switch (channel) {
              case NotificationChannel.PUSH:
                return "push";
              case NotificationChannel.SMS:
                return "sms";
              case NotificationChannel.EMAIL:
                return "email";
              case NotificationChannel.IN_APP:
                return "in_app";
              default:
                return channel;
            }
          }),
      };
    } catch (error) {
      logger.error(`Error getting user preferences for context: ${error}`);
      return {};
    }
  }

  /**
   * Check if current time is within user's quiet hours
   * @param preferences User preferences
   */
  private isInQuietHours(preferences: UserNotificationPreferences): boolean {
    if (!preferences.quietHoursStart || !preferences.quietHoursEnd) {
      return false;
    }

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = currentHour * 60 + currentMinute; // Convert to minutes since midnight

    const [startHour, startMinute] = preferences.quietHoursStart
      .split(":")
      .map(Number);
    const [endHour, endMinute] = preferences.quietHoursEnd
      .split(":")
      .map(Number);

    const startTime = startHour * 60 + startMinute;
    const endTime = endHour * 60 + endMinute;

    // Handle case where quiet hours span midnight
    if (startTime > endTime) {
      return currentTime >= startTime || currentTime <= endTime;
    } else {
      return currentTime >= startTime && currentTime <= endTime;
    }
  }

  /**
   * Check if notification is throttled
   * @param userId User ID
   * @param channel Notification channel
   * @param notificationType Type of notification
   * @returns boolean indicating if notification is throttled
   */
  private isThrottled(
    userId: string,
    channel: NotificationChannel,
    notificationType: NotificationType,
  ): boolean {
    const key = `${userId}_${channel}_${notificationType}`;
    const lastSent = this.throttleMap.get(key);
    if (!lastSent) return false;

    const now = Date.now();
    return now - lastSent < this.THROTTLE_WINDOW_MS;
  }

  /**
   * Update throttle map with latest notification timestamp
   * @param userId User ID
   * @param channel Notification channel
   * @param notificationType Type of notification
   */
  private updateThrottleMap(
    userId: string,
    channel: NotificationChannel,
    notificationType: NotificationType,
  ): void {
    const key = `${userId}_${channel}_${notificationType}`;
    this.throttleMap.set(key, Date.now());
  }

  /**
   * Map notification type to prompt type
   * @param notificationType Type of notification
   * @returns Corresponding prompt type or undefined
   */
  private mapToPromptType(
    notificationType: NotificationType,
  ): NotificationPromptType | undefined {
    // Add mapping logic here
    return undefined;
  }

  /**
   * Check if notification should be sent based on thresholds
   * @param promptType Type of notification prompt
   * @param userId User ID
   * @param data Notification data
   * @returns boolean indicating if notification should be sent
   */
  private shouldSendNotificationBasedOnThresholds(
    promptType: NotificationPromptType,
    userId: string,
    data: NotificationData,
  ): boolean {
    // Add threshold logic here
    return true;
  }

  /**
   * Format push notification content
   * @param notificationType Type of notification
   * @param data Notification data
   * @returns Formatted push notification content
   */
  private async formatPushContent(
    notificationType: NotificationType,
    data: NotificationData,
  ): Promise<{ title: string; body: string; data: any }> {
    // Add push content formatting logic here
    return {
      title: "Notification",
      body: "New notification",
      data: {},
    };
  }

  /**
   * Format SMS content
   * @param notificationType Type of notification
   * @param data Notification data
   * @returns Formatted SMS content
   */
  private async formatSmsContent(
    notificationType: NotificationType,
    data: NotificationData,
  ): Promise<string> {
    // Add SMS content formatting logic here
    return "New notification";
  }

  /**
   * Format email content
   * @param notificationType Type of notification
   * @param data Notification data
   * @returns Formatted email content
   */
  private async formatEmailContent(
    notificationType: NotificationType,
    data: NotificationData,
  ): Promise<{ subject: string; html: string }> {
    // Add email content formatting logic here
    return {
      subject: "New notification",
      html: "<p>You have a new notification</p>",
    };
  }

  /**
   * Format in-app notification content
   * @param notificationType Type of notification
   * @param data Notification data
   * @returns Formatted in-app notification content
   */
  private async formatInAppContent(
    notificationType: NotificationType,
    data: NotificationData,
  ): Promise<{ title: string; body: string }> {
    // Add in-app content formatting logic here
    return {
      title: "Notification",
      body: "New notification",
    };
  }
}

// Export a singleton instance
export const notificationService = NotificationService.getInstance();
