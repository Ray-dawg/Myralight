import { supabase } from "@/lib/supabase";
import { logger } from "@/api/utils/logger";
import { ChatMessage } from "@/lib/chat";

export interface ChatParticipant {
  id: string;
  load_id: string;
  user_id: string;
  user_type: "shipper" | "carrier" | "driver";
  joined_at: string;
  is_active: boolean;
}

export interface ChatSession {
  id: string;
  load_id: string;
  created_at: string;
  status: "active" | "archived" | "closed";
  metadata?: Record<string, any>;
}

export class ChatCreationService {
  /**
   * Creates a new chat session for a load and adds all participants
   * @param loadId The ID of the load
   * @param shipperId The ID of the shipper
   * @param carrierId The ID of the carrier
   * @param driverId The ID of the driver
   * @returns The created chat session
   */
  async createChatForLoad(
    loadId: string,
    shipperId: string,
    carrierId: string,
    driverId: string,
  ): Promise<ChatSession | null> {
    try {
      // Check if a chat already exists for this load
      const { data: existingChat, error: fetchError } = await supabase
        .from("load_chats")
        .select("*")
        .eq("load_id", loadId)
        .eq("status", "active")
        .single();

      if (fetchError && fetchError.code !== "PGRST116") {
        // PGRST116 is the error code for no rows returned
        logger.error("Error checking for existing chat:", fetchError);
        throw fetchError;
      }

      if (existingChat) {
        logger.info(
          `Chat already exists for load ${loadId}: ${existingChat.id}`,
        );
        return existingChat as ChatSession;
      }

      // Start a transaction to create the chat and add participants
      const { data: chatSession, error: createError } = await supabase
        .from("load_chats")
        .insert([{ load_id: loadId, status: "active" }])
        .select()
        .single();

      if (createError) {
        logger.error("Error creating chat session:", createError);
        throw createError;
      }

      // Add participants
      await this.addParticipant(chatSession.id, loadId, shipperId, "shipper");
      await this.addParticipant(chatSession.id, loadId, carrierId, "carrier");
      await this.addParticipant(chatSession.id, loadId, driverId, "driver");

      // Send welcome message
      await this.sendSystemMessage(
        chatSession.id,
        loadId,
        "Chat created for this load. All parties can communicate here.",
      );

      logger.info(
        `Successfully created chat for load ${loadId}: ${chatSession.id}`,
      );
      return chatSession as ChatSession;
    } catch (error) {
      logger.error(`Failed to create chat for load ${loadId}:`, error);
      return null;
    }
  }

  /**
   * Adds a participant to a chat session
   * @param chatId The ID of the chat session
   * @param loadId The ID of the load
   * @param userId The ID of the user
   * @param userType The type of user (shipper, carrier, driver)
   * @returns The created participant
   */
  private async addParticipant(
    chatId: string,
    loadId: string,
    userId: string,
    userType: "shipper" | "carrier" | "driver",
  ): Promise<ChatParticipant | null> {
    try {
      const { data: participant, error } = await supabase
        .from("load_chat_participants")
        .insert([
          {
            chat_id: chatId,
            load_id: loadId,
            user_id: userId,
            user_type: userType,
            is_active: true,
          },
        ])
        .select()
        .single();

      if (error) {
        logger.error(
          `Error adding ${userType} participant to chat ${chatId}:`,
          error,
        );
        throw error;
      }

      logger.info(`Added ${userType} participant ${userId} to chat ${chatId}`);
      return participant as ChatParticipant;
    } catch (error) {
      logger.error(`Failed to add participant to chat ${chatId}:`, error);
      return null;
    }
  }

  /**
   * Sends a system message to a chat session
   * @param chatId The ID of the chat session
   * @param loadId The ID of the load
   * @param message The message to send
   * @returns The sent message
   */
  private async sendSystemMessage(
    chatId: string,
    loadId: string,
    message: string,
  ): Promise<ChatMessage | null> {
    try {
      const { data, error } = await supabase
        .from("load_chat_messages")
        .insert([
          {
            chat_id: chatId,
            load_id: loadId,
            sender_id: "system",
            sender_type: "system",
            message: message,
          },
        ])
        .select()
        .single();

      if (error) {
        logger.error(`Error sending system message to chat ${chatId}:`, error);
        throw error;
      }

      logger.info(`Sent system message to chat ${chatId}`);
      return data as ChatMessage;
    } catch (error) {
      logger.error(`Failed to send system message to chat ${chatId}:`, error);
      return null;
    }
  }

  /**
   * Archives a chat session
   * @param chatId The ID of the chat session
   * @returns True if successful, false otherwise
   */
  async archiveChat(chatId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("load_chats")
        .update({ status: "archived" })
        .eq("id", chatId);

      if (error) {
        logger.error(`Error archiving chat ${chatId}:`, error);
        throw error;
      }

      logger.info(`Archived chat ${chatId}`);
      return true;
    } catch (error) {
      logger.error(`Failed to archive chat ${chatId}:`, error);
      return false;
    }
  }

  /**
   * Gets all participants in a chat session
   * @param chatId The ID of the chat session
   * @returns Array of chat participants
   */
  async getChatParticipants(chatId: string): Promise<ChatParticipant[]> {
    try {
      const { data, error } = await supabase
        .from("load_chat_participants")
        .select("*")
        .eq("chat_id", chatId)
        .eq("is_active", true);

      if (error) {
        logger.error(`Error getting participants for chat ${chatId}:`, error);
        throw error;
      }

      return data as ChatParticipant[];
    } catch (error) {
      logger.error(`Failed to get participants for chat ${chatId}:`, error);
      return [];
    }
  }
}

// Export a singleton instance
export const chatCreationService = new ChatCreationService();
