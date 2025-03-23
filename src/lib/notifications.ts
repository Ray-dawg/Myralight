import { supabase } from "./supabase";
import { getCurrentUser } from "./auth";
import { getSocket } from "./messaging";
import { PushNotificationService } from "../services/push-notification.service";

const pushNotificationService = PushNotificationService.getInstance();

// Notification types
export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: "message" | "system" | "load" | "document" | "alert";
  reference_id?: string;
  reference_type?: string;
  created_at: string;
  read_at?: string;
  action_url?: string;
}

// Subscribe to notifications
export function subscribeToNotifications(
  callback: (notification: Notification) => void,
) {
  const socket = getSocket();

  getCurrentUser().then((user) => {
    if (!user) return;

    socket.emit("subscribe-notifications", { userId: user.id });

    socket.on(
      `notifications:${user.id}`,
      async (notification: Notification) => {
        await pushNotificationService.sendPushNotification(
          user.id,
          notification.message,
          notification.type,
          {
            referenceId: notification.reference_id,
            referenceType: notification.reference_type,
            actionUrl: notification.action_url,
          },
        );
        callback(notification);
      },
    );
  });

  return () => {
    getCurrentUser().then((user) => {
      if (!user) return;
      socket.off(`notifications:${user.id}`);
      socket.emit("unsubscribe-notifications", { userId: user.id });
    });
  };
}

// Get user notifications
export async function getUserNotifications(
  limit: number = 20,
  offset: number = 0,
  includeRead: boolean = false,
) {
  const user = await getCurrentUser();
  if (!user) throw new Error("User not authenticated");

  let query = supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit)
    .range(offset, offset + limit - 1);

  if (!includeRead) {
    query = query.is("read_at", null);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data;
}

// Mark notification as read
export async function markNotificationAsRead(notificationId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("User not authenticated");

  const { data, error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("user_id", user.id);

  if (error) throw error;
  return data;
}

// Mark all notifications as read
export async function markAllNotificationsAsRead() {
  const user = await getCurrentUser();
  if (!user) throw new Error("User not authenticated");

  const { data, error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .is("read_at", null);

  if (error) throw error;
  return data;
}

// Delete notification
export async function deleteNotification(notificationId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("User not authenticated");

  const { data, error } = await supabase
    .from("notifications")
    .delete()
    .eq("id", notificationId)
    .eq("user_id", user.id);

  if (error) throw error;
  return data;
}

// Get unread notification count
export async function getUnreadNotificationCount() {
  const user = await getCurrentUser();
  if (!user) return 0;

  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact" })
    .eq("user_id", user.id)
    .is("read_at", null);

  if (error) {
    console.error("Error getting unread notification count:", error);
    return 0;
  }

  return count || 0;
}
