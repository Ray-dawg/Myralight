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

export interface ChatSession {
  id: string;
  name: string | null;
  created_at: string;
  updated_at: string;
  last_message: string | null;
  last_message_at: string | null;
  is_group: boolean;
  load_id: string | null;
}

export interface ChatMessage {
  id: string;
  chat_id: string;
  sender_id: string | null;
  content: string;
  attachment_url: string | null;
  attachment_type: string | null;
  created_at: string;
  updated_at: string;
  status: "sent" | "delivered" | "read";
  is_system_message: boolean;
  event_type: string | null;
}

export interface ChatParticipant {
  id: string;
  chat_id: string;
  user_id: string;
  role: "admin" | "member";
  joined_at: string;
  users?: {
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  };
}

export class MessagingService {
  private static instance: MessagingService;

  private constructor() {}

  public static getInstance(): MessagingService {
    if (!MessagingService.instance) {
      MessagingService.instance = new MessagingService();
    }
    return MessagingService.instance;
  }

  /**
   * Get all chats for a user
   * @param userId User ID
   * @returns List of chat sessions
   */
  public async getUserChats(userId: string): Promise<ChatSession[]> {
    try {
      const { data, error } = await supabase
        .from("chat_participants")
        .select(
          `
          chat_id,
          chats:chat_id(id, name, created_at, updated_at, last_message, last_message_at, is_group, load_id)
        `,
        )
        .eq("user_id", userId);

      if (error) throw error;

      // Transform the data to get the chats
      return data.map((item: any) => item.chats);
    } catch (error) {
      logger.error("Error getting user chats:", error);
      throw new Error("Failed to get user chats");
    }
  }

  /**
   * Get messages for a specific chat
   * @param chatId Chat ID
   * @param userId User ID (for authorization)
   * @param limit Maximum number of messages to return
   * @param before Timestamp to get messages before
   * @returns List of messages
   */
  public async getChatMessages(
    chatId: string,
    userId: string,
    limit: number = 50,
    before?: string,
  ): Promise<ChatMessage[]> {
    try {
      // Check if user is a participant in the chat
      const { data: participant, error: participantError } = await supabase
        .from("chat_participants")
        .select("id")
        .eq("chat_id", chatId)
        .eq("user_id", userId)
        .single();

      if (participantError || !participant) {
        throw new Error("Not authorized to access this chat");
      }

      // Get messages
      let query = supabase
        .from("messages")
        .select("*")
        .eq("chat_id", chatId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (before) {
        query = query.lt("created_at", before);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data as ChatMessage[];
    } catch (error) {
      logger.error("Error getting chat messages:", error);
      throw new Error("Failed to get chat messages");
    }
  }

  /**
   * Create a new chat session
   * @param participantIds Array of user IDs to include in the chat
   * @param name Optional chat name (required for group chats)
   * @param isGroup Whether this is a group chat
   * @param loadId Optional load ID to associate with the chat
   * @returns New chat session
   */
  public async createChat(
    participantIds: string[],
    name?: string,
    isGroup: boolean = false,
    loadId?: string,
  ): Promise<ChatSession> {
    try {
      // Create chat using RPC function
      const { data, error } = await supabase.rpc("create_chat", {
        participant_ids: participantIds,
        chat_name: name,
        is_group_chat: isGroup,
        load_id: loadId,
      });

      if (error) throw error;

      // Notify all participants via WebSocket
      participantIds.forEach((participantId) => {
        wsService.sendMessage("chat:session_created", {
          chat_id: data.id,
          name,
          is_group: isGroup,
          load_id: loadId,
          participant_id: participantId,
        });
      });

      return data as ChatSession;
    } catch (error) {
      logger.error("Error creating chat:", error);
      throw new Error("Failed to create chat");
    }
  }

  /**
   * Send a message to a chat
   * @param chatId Chat ID
   * @param senderId Sender user ID
   * @param content Message content
   * @param attachmentUrl Optional attachment URL
   * @param attachmentType Optional attachment type
   * @returns New message
   */
  public async sendMessage(
    chatId: string,
    senderId: string,
    content: string,
    attachmentUrl?: string,
    attachmentType?: string,
  ): Promise<ChatMessage> {
    try {
      // Check if user is a participant in the chat
      const { data: participant, error: participantError } = await supabase
        .from("chat_participants")
        .select("id")
        .eq("chat_id", chatId)
        .eq("user_id", senderId)
        .single();

      if (participantError || !participant) {
        throw new Error("Not authorized to send messages to this chat");
      }

      // Create message
      const { data: message, error } = await supabase
        .from("messages")
        .insert({
          chat_id: chatId,
          sender_id: senderId,
          content,
          attachment_url: attachmentUrl,
          attachment_type: attachmentType,
          status: "sent",
        })
        .select()
        .single();

      if (error) throw error;

      // Update last message in chat
      await supabase
        .from("chats")
        .update({
          last_message: content,
          last_message_at: new Date().toISOString(),
        })
        .eq("id", chatId);

      // Get all participants to notify
      const { data: chatParticipants, error: participantsError } =
        await supabase
          .from("chat_participants")
          .select("user_id")
          .eq("chat_id", chatId);

      if (!participantsError && chatParticipants) {
        // Notify all participants via WebSocket
        chatParticipants.forEach((participant) => {
          if (participant.user_id !== senderId) {
            // Don't notify sender
            wsService.sendMessage("message:received", {
              message,
              recipient_id: participant.user_id,
            });
          }
        });
      }

      return message as ChatMessage;
    } catch (error) {
      logger.error("Error sending message:", error);
      throw new Error("Failed to send message");
    }
  }

  /**
   * Send a system message to a chat
   * @param chatId Chat ID
   * @param content Message content
   * @param eventType Optional event type for system messages
   * @returns New system message
   */
  public async sendSystemMessage(
    chatId: string,
    content: string,
    eventType?: string,
  ): Promise<ChatMessage> {
    try {
      // Create system message
      const { data: message, error } = await supabase
        .from("messages")
        .insert({
          chat_id: chatId,
          sender_id: null, // null sender indicates system message
          content,
          is_system_message: true,
          event_type: eventType,
          status: "delivered", // System messages are automatically delivered
        })
        .select()
        .single();

      if (error) throw error;

      // Update last message in chat
      await supabase
        .from("chats")
        .update({
          last_message: content,
          last_message_at: new Date().toISOString(),
        })
        .eq("id", chatId);

      // Get all participants to notify
      const { data: chatParticipants, error: participantsError } =
        await supabase
          .from("chat_participants")
          .select("user_id")
          .eq("chat_id", chatId);

      if (!participantsError && chatParticipants) {
        // Notify all participants via WebSocket
        chatParticipants.forEach((participant) => {
          wsService.sendMessage("message:system", {
            message,
            recipient_id: participant.user_id,
          });
        });
      }

      return message as ChatMessage;
    } catch (error) {
      logger.error("Error sending system message:", error);
      throw new Error("Failed to send system message");
    }
  }

  /**
   * Mark all messages in a chat as read for a user
   * @param chatId Chat ID
   * @param userId User ID
   * @returns Success status
   */
  public async markMessagesAsRead(
    chatId: string,
    userId: string,
  ): Promise<boolean> {
    try {
      // Check if user is a participant in the chat
      const { data: participant, error: participantError } = await supabase
        .from("chat_participants")
        .select("id")
        .eq("chat_id", chatId)
        .eq("user_id", userId)
        .single();

      if (participantError || !participant) {
        throw new Error("Not authorized to access this chat");
      }

      // Mark messages as read using RPC function
      const { error } = await supabase.rpc("mark_chat_messages_as_read", {
        p_chat_id: chatId,
        p_user_id: userId,
      });

      if (error) throw error;

      // Notify other participants that this user has read messages
      const { data: chatParticipants, error: participantsError } =
        await supabase
          .from("chat_participants")
          .select("user_id")
          .eq("chat_id", chatId);

      if (!participantsError && chatParticipants) {
        chatParticipants.forEach((participant) => {
          if (participant.user_id !== userId) {
            wsService.sendMessage("message:read", {
              chat_id: chatId,
              user_id: userId,
              read_at: new Date().toISOString(),
              recipient_id: participant.user_id,
            });
          }
        });
      }

      return true;
    } catch (error) {
      logger.error("Error marking messages as read:", error);
      throw new Error("Failed to mark messages as read");
    }
  }

  /**
   * Get unread message count for a user
   * @param userId User ID
   * @returns Unread message count
   */
  public async getUnreadMessageCount(userId: string): Promise<number> {
    try {
      // Get unread message count using RPC function
      const { data, error } = await supabase.rpc("get_unread_message_count", {
        p_user_id: userId,
      });

      if (error) throw error;

      return data as number;
    } catch (error) {
      logger.error("Error getting unread message count:", error);
      throw new Error("Failed to get unread message count");
    }
  }

  /**
   * Get recent chats with unread messages for a user
   * @param userId User ID
   * @param limit Maximum number of chats to return
   * @returns Recent chats with unread messages
   */
  public async getRecentChatsWithUnread(
    userId: string,
    limit: number = 5,
  ): Promise<any[]> {
    try {
      // Get recent chats with unread messages
      const { data, error } = await supabase.rpc(
        "get_recent_chats_with_unread",
        {
          p_user_id: userId,
          p_limit: limit,
        },
      );

      if (error) throw error;

      return data as any[];
    } catch (error) {
      logger.error("Error getting recent chats with unread:", error);
      throw new Error("Failed to get recent chats with unread");
    }
  }
}
