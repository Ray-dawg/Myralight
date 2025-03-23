import { createClient } from "@supabase/supabase-js";
import { logger } from "../utils/logger";
import { WebSocketService } from "./websocket.service";

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  logger.error("Supabase URL or key not found in environment variables");
  throw new Error("Supabase configuration missing");
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const wsService = WebSocketService.getInstance();

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  content: string;
  type: string;
  is_read: boolean;
  created_at: string;
  related_entity_id?: string;
  related_entity_type?: string;
}

export class NotificationService {
  private static instance: NotificationService;

  private constructor() {}

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Create a notification for a user
   * @param userId User ID
   * @param title Notification title
   * @param content Notification content
   * @param type Notification type
   * @param relatedEntityId Optional related entity ID
   * @param relatedEntityType Optional related entity type
   * @returns New notification
   */
  public async createNotification(
    userId: string,
    title: string,
    content: string,
    type: string,
    relatedEntityId?: string,
    relatedEntityType?: string,
  ): Promise<Notification> {
    try {
      // Create notification in database
      const { data: notification, error } = await supabase
        .from("notifications")
        .insert({
          user_id: userId,
          title,
          content,
          type,
          is_read: false,
          related_entity_id: relatedEntityId,
          related_entity_type: relatedEntityType,
        })
        .select()
        .single();

      if (error) throw error;

      // Notify user via WebSocket
      wsService.sendMessage("notification:new", {
        notification,
        recipient_id: userId,
      });

      return notification as Notification;
    } catch (error) {
      logger.error("Error creating notification:", error);
      throw new Error("Failed to create notification");
    }
  }

  /**
   * Create a chat message notification
   * @param userId User ID
   * @param senderName Sender name
   * @param chatId Chat ID
   * @param messageContent Message content
   * @returns New notification
   */
  public async createChatMessageNotification(
    userId: string,
    senderName: string,
    chatId: string,
    messageContent: string,
  ): Promise<Notification> {
    try {
      const title = `New message from ${senderName}`;
      const content =
        messageContent.length > 50
          ? `${messageContent.substring(0, 47)}...`
          : messageContent;

      return await this.createNotification(
        userId,
        title,
        content,
        "new_message",
        chatId,
        "chat",
      );
    } catch (error) {
      logger.error("Error creating chat message notification:", error);
      throw new Error("Failed to create chat message notification");
    }
  }

  /**
   * Mark a notification as read
   * @param notificationId Notification ID
   * @param userId User ID (for authorization)
   * @returns Success status
   */
  public async markNotificationAsRead(
    notificationId: string,
    userId: string,
  ): Promise<boolean> {
    try {
      // Check if notification belongs to user
      const { data: notification, error: notificationError } = await supabase
        .from("notifications")
        .select("id")
        .eq("id", notificationId)
        .eq("user_id", userId)
        .single();

      if (notificationError || !notification) {
        throw new Error("Notification not found or not authorized");
      }

      // Mark notification as read
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notificationId);

      if (error) throw error;

      return true;
    } catch (error) {
      logger.error("Error marking notification as read:", error);
      throw new Error("Failed to mark notification as read");
    }
  }

  /**
   * Mark all notifications as read for a user
   * @param userId User ID
   * @returns Success status
   */
  public async markAllNotificationsAsRead(userId: string): Promise<boolean> {
    try {
      // Mark all notifications as read
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", userId)
        .eq("is_read", false);

      if (error) throw error;

      return true;
    } catch (error) {
      logger.error("Error marking all notifications as read:", error);
      throw new Error("Failed to mark all notifications as read");
    }
  }

  /**
   * Get unread notification count for a user
   * @param userId User ID
   * @returns Unread notification count
   */
  public async getUnreadNotificationCount(userId: string): Promise<number> {
    try {
      // Get unread notification count
      const { count, error } = await supabase
        .from("notifications")
        .select("id", { count: "exact" })
        .eq("user_id", userId)
        .eq("is_read", false);

      if (error) throw error;

      return count || 0;
    } catch (error) {
      logger.error("Error getting unread notification count:", error);
      throw new Error("Failed to get unread notification count");
    }
  }

  /**
   * Get recent notifications for a user
   * @param userId User ID
   * @param limit Maximum number of notifications to return
   * @returns Recent notifications
   */
  public async getRecentNotifications(
    userId: string,
    limit: number = 10,
  ): Promise<Notification[]> {
    try {
      // Get recent notifications
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data as Notification[];
    } catch (error) {
      logger.error("Error getting recent notifications:", error);
      throw new Error("Failed to get recent notifications");
    }
  }
}
