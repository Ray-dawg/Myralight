import { supabase } from "./supabase";
import { logger } from "@/api/utils/logger";
import { notificationService } from "@/services/notification.service";

export interface ChatMessage {
  id: string;
  load_id: string;
  chat_id?: string;
  sender_id: string;
  sender_type: "shipper" | "carrier" | "driver" | "system";
  message: string;
  created_at: string;
  attachments?: string[];
  read_by?: string[];
  status?: "sending" | "sent" | "delivered" | "read";
}

export interface ChatSession {
  id: string;
  load_id: string;
  created_at: string;
  status: "active" | "archived" | "closed";
  metadata?: Record<string, any>;
}

export const chatService = {
  async initializeLoadChat(loadId: string) {
    try {
      const { data, error } = await supabase
        .from("load_chats")
        .insert([{ load_id: loadId, status: "active" }]);

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error("Failed to initialize load chat:", error);
      throw error;
    }
  },

  async sendMessage(message: Omit<ChatMessage, "id" | "created_at">) {
    try {
      const { data, error } = await supabase
        .from("load_chat_messages")
        .insert([{ ...message, status: "sending" }])
        .select()
        .single();

      if (error) throw error;

      // Update message status to sent
      await supabase
        .from("load_chat_messages")
        .update({ status: "sent" })
        .eq("id", data.id);

      // Trigger notifications for the new message
      try {
        await notificationService.notifyNewMessage(data.id);
      } catch (notifyError) {
        logger.error("Failed to send notification for message:", notifyError);
      }

      return data;
    } catch (error) {
      logger.error("Failed to send message:", error);
      throw error;
    }
  },

  async getMessages(loadId: string, limit = 50, offset = 0) {
    try {
      const { data, error } = await supabase
        .from("load_chat_messages")
        .select("*")
        .eq("load_id", loadId)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return data as ChatMessage[];
    } catch (error) {
      logger.error("Failed to get messages:", error);
      throw error;
    }
  },

  async markMessageAsRead(messageId: string, userId: string) {
    try {
      const { data: message, error: fetchError } = await supabase
        .from("load_chat_messages")
        .select("*")
        .eq("id", messageId)
        .single();

      if (fetchError) throw fetchError;

      const readBy = message.read_by || [];
      if (!readBy.includes(userId)) {
        readBy.push(userId);

        const { error: updateError } = await supabase
          .from("load_chat_messages")
          .update({ read_by: readBy, status: "read" })
          .eq("id", messageId);

        if (updateError) throw updateError;
      }

      return true;
    } catch (error) {
      logger.error("Failed to mark message as read:", error);
      return false;
    }
  },

  subscribeToLoadChat(
    loadId: string,
    onMessage: (message: ChatMessage) => void,
  ) {
    return supabase
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
          onMessage(payload.new as ChatMessage);
        },
      )
      .subscribe();
  },

  async getChatSessions(
    userId: string,
    userType: string,
    limit = 20,
    offset = 0,
  ) {
    try {
      const { data: participations, error: participationError } = await supabase
        .from("load_chat_participants")
        .select("chat_id")
        .eq("user_id", userId)
        .eq("user_type", userType)
        .eq("is_active", true);

      if (participationError) throw participationError;
      if (!participations || participations.length === 0) return [];

      const chatIds = participations.map((p) => p.chat_id);

      const { data: sessions, error: sessionsError } = await supabase
        .from("load_chats")
        .select("*")
        .in("id", chatIds)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (sessionsError) throw sessionsError;
      return sessions as ChatSession[];
    } catch (error) {
      logger.error("Failed to get chat sessions:", error);
      return [];
    }
  },

  async markMessagesAsDelivered(loadId: string) {
    try {
      const { error } = await supabase
        .from("load_chat_messages")
        .update({ status: "delivered" })
        .eq("load_id", loadId)
        .eq("status", "sent");

      if (error) throw error;
      return true;
    } catch (error) {
      logger.error("Failed to mark messages as delivered:", error);
      return false;
    }
  },
};
