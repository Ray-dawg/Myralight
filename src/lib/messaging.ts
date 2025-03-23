import { supabase } from "./supabase";
import { v4 as uuidv4 } from "uuid";
import { logger } from "@/api/utils/logger";
import { notificationService } from "@/services/notification.service";
import { storageService } from "./storage";

export interface Message {
  id: string;
  loadId: string;
  senderId: string;
  senderRole: "driver" | "carrier" | "shipper" | "admin";
  content: string;
  attachmentUrl?: string;
  attachmentType?: string;
  timestamp: number;
  isRead: boolean;
}

export function useMessaging() {
  const sendMessage = async (
    loadId: string,
    content: string,
    attachmentUrl?: string,
    attachmentType?: string,
  ) => {
    try {
      // Get current user info from supabase
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Get user role from profiles table
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profileError) throw profileError;

      const senderRole = profile.role as
        | "driver"
        | "carrier"
        | "shipper"
        | "admin";

      // Create message in database
      const messageId = uuidv4();
      const timestamp = Date.now();

      const { error } = await supabase.from("load_chat_messages").insert({
        id: messageId,
        load_id: loadId,
        sender_id: user.id,
        sender_type: senderRole,
        message: content,
        attachments: attachmentUrl ? [attachmentUrl] : [],
        attachment_type: attachmentType,
        read_by: [user.id], // Mark as read by sender
        created_at: new Date(timestamp).toISOString(),
      });

      if (error) throw error;

      // Trigger notifications for other participants
      await notificationService.notifyNewMessage(messageId);

      return messageId;
    } catch (error) {
      logger.error("Error sending message:", error);
      throw error;
    }
  };

  const getMessages = async (
    loadId: string,
    limit = 50,
  ): Promise<Message[]> => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("load_chat_messages")
        .select("*")
        .eq("load_id", loadId)
        .order("created_at", { ascending: true })
        .limit(limit);

      if (error) throw error;

      // Transform to our Message interface
      return (data || []).map((msg) => ({
        id: msg.id,
        loadId: msg.load_id,
        senderId: msg.sender_id,
        senderRole: msg.sender_type,
        content: msg.message,
        attachmentUrl:
          msg.attachments && msg.attachments.length > 0
            ? msg.attachments[0]
            : undefined,
        attachmentType: msg.attachment_type,
        timestamp: new Date(msg.created_at).getTime(),
        isRead: Array.isArray(msg.read_by) && msg.read_by.includes(user.id),
      }));
    } catch (error) {
      logger.error("Error fetching messages:", error);
      return [];
    }
  };

  const markAsRead = async (messageIds: string[]) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // For each message, update the read_by array
      for (const messageId of messageIds) {
        // Get current read_by array
        const { data: message, error: fetchError } = await supabase
          .from("load_chat_messages")
          .select("read_by")
          .eq("id", messageId)
          .single();

        if (fetchError) continue;

        // Add current user to read_by if not already there
        const readBy = Array.isArray(message.read_by) ? message.read_by : [];
        if (!readBy.includes(user.id)) {
          readBy.push(user.id);

          await supabase
            .from("load_chat_messages")
            .update({ read_by: readBy })
            .eq("id", messageId);
        }
      }

      return true;
    } catch (error) {
      logger.error("Error marking messages as read:", error);
      return false;
    }
  };

  const uploadAttachment = async (file: File, loadId: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      return await storageService.uploadFile(file, loadId);
    } catch (error) {
      logger.error("Error uploading attachment:", error);
      return null;
    }
  };

  const subscribeToMessages = (
    loadId: string,
    callback: (message: Message) => void,
  ) => {
    const {
      data: { user },
    } = supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const subscription = supabase
      .channel(`load_chat:${loadId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "load_chat_messages",
          filter: `load_id=eq.${loadId}`,
        },
        (payload) => {
          const msg = payload.new;

          // Transform to our Message interface
          const message: Message = {
            id: msg.id,
            loadId: msg.load_id,
            senderId: msg.sender_id,
            senderRole: msg.sender_type,
            content: msg.message,
            attachmentUrl:
              msg.attachments && msg.attachments.length > 0
                ? msg.attachments[0]
                : undefined,
            attachmentType: msg.attachment_type,
            timestamp: new Date(msg.created_at).getTime(),
            isRead: Array.isArray(msg.read_by) && msg.read_by.includes(user.id),
          };

          callback(message);
        },
      )
      .subscribe();

    // Return unsubscribe function
    return () => {
      subscription.unsubscribe();
    };
  };

  const getUnreadMessageCount = async (loadId?: string): Promise<number> => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return 0;

      let query = supabase
        .from("load_chat_messages")
        .select("id", { count: "exact" })
        .not("read_by", "cs", `{${user.id}}`);

      if (loadId) {
        query = query.eq("load_id", loadId);
      }

      const { count, error } = await query;

      if (error) throw error;
      return count || 0;
    } catch (error) {
      logger.error("Error getting unread message count:", error);
      return 0;
    }
  };

  const createLoadChat = async (
    loadId: string,
    participants: { id: string; role: string }[],
  ) => {
    try {
      // Create chat session
      const { error: chatError } = await supabase.from("load_chats").insert({
        load_id: loadId,
        status: "active",
      });

      if (chatError) throw chatError;

      // Add participants
      const participantRecords = participants.map((p) => ({
        load_id: loadId,
        user_id: p.id,
        user_type: p.role,
        is_active: true,
      }));

      const { error: participantError } = await supabase
        .from("load_chat_participants")
        .insert(participantRecords);

      if (participantError) throw participantError;

      return true;
    } catch (error) {
      logger.error("Error creating load chat:", error);
      return false;
    }
  };

  return {
    sendMessage,
    getMessages,
    markAsRead,
    uploadAttachment,
    subscribeToMessages,
    getUnreadMessageCount,
    createLoadChat,
  };
}
