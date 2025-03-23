import { supabase } from "@/lib/supabase";
import { logger } from "@/api/utils/logger";
import { format } from "date-fns";

export interface MessageHistoryRecord {
  id: string;
  message_id: string;
  chat_id: string;
  sender_id: string | null;
  sender_type: string;
  content: string;
  message_type: string;
  related_entity_id?: string;
  related_entity_type?: string;
  metadata: Record<string, any>;
  created_at: string;
  is_archived: boolean;
  current_status?: string;
}

export interface MessageStatusRecord {
  id: string;
  message_id: string;
  status: string;
  actor_id?: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface MessageAttachmentRecord {
  id: string;
  message_id: string;
  attachment_url: string;
  attachment_type?: string;
  file_name?: string;
  file_size?: number;
  created_at: string;
}

export interface SystemAuditRecord {
  id: string;
  event_type: string;
  entity_id?: string;
  entity_type?: string;
  actor_id?: string;
  actor_type?: string;
  details: Record<string, any>;
  ip_address?: string;
  created_at: string;
}

export interface MessageHistoryQueryOptions {
  limit?: number;
  offset?: number;
  startDate?: string;
  endDate?: string;
  messageTypes?: string[];
  senderIds?: string[];
  senderTypes?: string[];
  includeArchived?: boolean;
  includeSystemMessages?: boolean;
  searchTerm?: string;
}

export interface MessageExportOptions {
  chatId?: string;
  loadId?: string;
  startDate?: string;
  endDate?: string;
  includeSystemMessages?: boolean;
  format?: "csv" | "json" | "pdf";
}

/**
 * Service for message history and audit trails
 */
class MessageHistoryService {
  /**
   * Log a message to history
   * @param message - Message object
   * @returns Logged message record
   */
  async logMessage(message: {
    message_id: string;
    chat_id: string;
    sender_id?: string;
    sender_type: string;
    content: string;
    message_type?: string;
    related_entity_id?: string;
    related_entity_type?: string;
    metadata?: Record<string, any>;
  }): Promise<MessageHistoryRecord | null> {
    try {
      const {
        message_id,
        chat_id,
        sender_id,
        sender_type,
        content,
        message_type = "user_message",
        related_entity_id,
        related_entity_type,
        metadata = {},
      } = message;

      const { data, error } = await supabase
        .from("message_history")
        .insert({
          message_id,
          chat_id,
          sender_id,
          sender_type,
          content,
          message_type,
          related_entity_id,
          related_entity_type,
          metadata,
        })
        .select()
        .single();

      if (error) throw error;

      logger.info("Message logged to history", { message_id });
      return data as MessageHistoryRecord;
    } catch (error) {
      logger.error("Failed to log message to history", {
        error,
        message_id: message.message_id,
      });
      return null;
    }
  }

  /**
   * Log a message status change
   * @param messageId - Message ID
   * @param status - New status
   * @param actorId - User who changed the status
   * @param metadata - Additional metadata
   * @returns Status log record
   */
  async logMessageStatus(
    messageId: string,
    status: string,
    actorId?: string,
    metadata: Record<string, any> = {},
  ): Promise<MessageStatusRecord | null> {
    try {
      const { data, error } = await supabase
        .from("message_status_history")
        .insert({
          message_id: messageId,
          status,
          actor_id: actorId,
          metadata,
        })
        .select()
        .single();

      if (error) throw error;

      logger.info("Message status change logged", {
        message_id: messageId,
        status,
      });
      return data as MessageStatusRecord;
    } catch (error) {
      logger.error("Failed to log message status", {
        error,
        message_id: messageId,
      });
      return null;
    }
  }

  /**
   * Log a message attachment
   * @param messageId - Message ID
   * @param attachmentUrl - URL of the attachment
   * @param attachmentType - Type of attachment
   * @param fileName - Name of the file
   * @param fileSize - Size of the file in bytes
   * @returns Attachment record
   */
  async logMessageAttachment(
    messageId: string,
    attachmentUrl: string,
    attachmentType?: string,
    fileName?: string,
    fileSize?: number,
  ): Promise<MessageAttachmentRecord | null> {
    try {
      const { data, error } = await supabase
        .from("message_attachment_history")
        .insert({
          message_id: messageId,
          attachment_url: attachmentUrl,
          attachment_type: attachmentType,
          file_name: fileName,
          file_size: fileSize,
        })
        .select()
        .single();

      if (error) throw error;

      logger.info("Message attachment logged", {
        message_id: messageId,
        attachment_url: attachmentUrl,
      });
      return data as MessageAttachmentRecord;
    } catch (error) {
      logger.error("Failed to log message attachment", {
        error,
        message_id: messageId,
      });
      return null;
    }
  }

  /**
   * Get message history for a chat
   * @param chatId - Chat ID
   * @param options - Query options
   * @returns Message history
   */
  async getChatHistory(
    chatId: string,
    options: MessageHistoryQueryOptions = {},
  ): Promise<MessageHistoryRecord[]> {
    try {
      const {
        limit = 50,
        offset = 0,
        startDate,
        endDate,
        messageTypes,
        senderIds,
        senderTypes,
        includeArchived = false,
        includeSystemMessages = true,
        searchTerm,
      } = options;

      let query = supabase
        .from("message_history_with_status")
        .select("*")
        .eq("chat_id", chatId)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (!includeArchived) {
        query = query.eq("is_archived", false);
      }

      if (startDate) {
        query = query.gte("created_at", startDate);
      }

      if (endDate) {
        query = query.lte("created_at", endDate);
      }

      if (messageTypes && messageTypes.length) {
        query = query.in("message_type", messageTypes);
      }

      if (senderIds && senderIds.length) {
        query = query.in("sender_id", senderIds);
      }

      if (senderTypes && senderTypes.length) {
        query = query.in("sender_type", senderTypes);
      }

      if (!includeSystemMessages) {
        query = query.neq("message_type", "system_message");
      }

      if (searchTerm) {
        query = query.ilike("content", `%${searchTerm}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data as MessageHistoryRecord[];
    } catch (error) {
      logger.error("Failed to get chat history", { error, chat_id: chatId });
      return [];
    }
  }

  /**
   * Get message history for a load/shipment
   * @param loadId - Load ID
   * @param options - Query options
   * @returns Message history
   */
  async getLoadMessageHistory(
    loadId: string,
    options: MessageHistoryQueryOptions = {},
  ): Promise<MessageHistoryRecord[]> {
    try {
      const {
        limit = 100,
        offset = 0,
        startDate,
        endDate,
        messageTypes,
        senderIds,
        senderTypes,
        includeArchived = false,
        includeSystemMessages = true,
        searchTerm,
      } = options;

      // First get all chats related to this load
      const { data: chats, error: chatError } = await supabase
        .from("load_chats")
        .select("id")
        .eq("load_id", loadId);

      if (chatError) throw chatError;

      const chatIds = chats?.map((chat) => chat.id) || [];

      // Build the query
      let query = supabase
        .from("message_history_with_status")
        .select("*")
        .or(`chat_id.in.(${chatIds.join(",")}),related_entity_id.eq.${loadId}`)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (!includeArchived) {
        query = query.eq("is_archived", false);
      }

      if (startDate) {
        query = query.gte("created_at", startDate);
      }

      if (endDate) {
        query = query.lte("created_at", endDate);
      }

      if (messageTypes && messageTypes.length) {
        query = query.in("message_type", messageTypes);
      }

      if (senderIds && senderIds.length) {
        query = query.in("sender_id", senderIds);
      }

      if (senderTypes && senderTypes.length) {
        query = query.in("sender_type", senderTypes);
      }

      if (!includeSystemMessages) {
        query = query.neq("message_type", "system_message");
      }

      if (searchTerm) {
        query = query.ilike("content", `%${searchTerm}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data as MessageHistoryRecord[];
    } catch (error) {
      logger.error("Failed to get load message history", {
        error,
        load_id: loadId,
      });
      return [];
    }
  }

  /**
   * Search message history
   * @param searchParams - Search parameters
   * @returns Search results
   */
  async searchMessages(searchParams: {
    searchTerm?: string;
    chatIds?: string[];
    loadIds?: string[];
    senderIds?: string[];
    senderTypes?: string[];
    messageTypes?: string[];
    startDate?: string;
    endDate?: string;
    includeArchived?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<MessageHistoryRecord[]> {
    try {
      const {
        searchTerm,
        chatIds,
        loadIds,
        senderIds,
        senderTypes,
        messageTypes,
        startDate,
        endDate,
        includeArchived = false,
        limit = 50,
        offset = 0,
      } = searchParams;

      // Start building the query
      let query = supabase
        .from("message_history_with_status")
        .select("*")
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (!includeArchived) {
        query = query.eq("is_archived", false);
      }

      if (searchTerm) {
        query = query.ilike("content", `%${searchTerm}%`);
      }

      if (chatIds && chatIds.length) {
        query = query.in("chat_id", chatIds);
      }

      if (loadIds && loadIds.length) {
        // Get chat IDs for these loads
        const { data: chats, error: chatError } = await supabase
          .from("load_chats")
          .select("id")
          .in("load_id", loadIds);

        if (chatError) throw chatError;

        const chatIdsFromLoads = chats?.map((chat) => chat.id) || [];

        // Either the chat is related to these loads or the message directly references the load
        if (chatIdsFromLoads.length > 0) {
          query = query.or(
            `chat_id.in.(${chatIdsFromLoads.join(",")}),related_entity_id.in.(${loadIds.join(",")})`,
          );
        } else if (loadIds.length > 0) {
          query = query.in("related_entity_id", loadIds);
        }
      }

      if (senderIds && senderIds.length) {
        query = query.in("sender_id", senderIds);
      }

      if (senderTypes && senderTypes.length) {
        query = query.in("sender_type", senderTypes);
      }

      if (messageTypes && messageTypes.length) {
        query = query.in("message_type", messageTypes);
      }

      if (startDate) {
        query = query.gte("created_at", startDate);
      }

      if (endDate) {
        query = query.lte("created_at", endDate);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data as MessageHistoryRecord[];
    } catch (error) {
      logger.error("Failed to search messages", {
        error,
        search_params: searchParams,
      });
      return [];
    }
  }

  /**
   * Export message history
   * @param exportParams - Export parameters
   * @returns Exported data as string
   */
  async exportMessageHistory(
    exportParams: MessageExportOptions,
  ): Promise<string> {
    try {
      const {
        chatId,
        loadId,
        startDate,
        endDate,
        includeSystemMessages = true,
        format = "csv",
      } = exportParams;

      if (!chatId && !loadId) {
        throw new Error("Either chatId or loadId is required for export");
      }

      let messages: MessageHistoryRecord[] = [];

      if (chatId) {
        messages = await this.getChatHistory(chatId, {
          startDate,
          endDate,
          includeSystemMessages,
          limit: 10000, // High limit for export
        });
      } else if (loadId) {
        messages = await this.getLoadMessageHistory(loadId, {
          startDate,
          endDate,
          includeSystemMessages,
          limit: 10000, // High limit for export
        });
      }

      if (format === "json") {
        return JSON.stringify(messages, null, 2);
      } else if (format === "csv") {
        // Format for CSV
        const csvRows = [
          // CSV Header
          [
            "Message ID",
            "Timestamp",
            "Sender ID",
            "Sender Type",
            "Message Type",
            "Status",
            "Content",
          ],
        ];

        // Add message data
        messages.forEach((msg) => {
          csvRows.push([
            msg.message_id,
            format(new Date(msg.created_at), "yyyy-MM-dd HH:mm:ss"),
            msg.sender_id || "system",
            msg.sender_type,
            msg.message_type,
            msg.current_status || "sent",
            msg.content.replace(/"/g, '""'), // Escape quotes for CSV
          ]);
        });

        // Convert to CSV string
        return csvRows
          .map((row) => row.map((cell) => `"${cell}"`).join(","))
          .join("\n");
      } else {
        throw new Error(`Unsupported export format: ${format}`);
      }
    } catch (error) {
      logger.error("Failed to export message history", {
        error,
        export_params: exportParams,
      });
      throw error;
    }
  }

  /**
   * Get audit trail for a specific entity
   * @param entityId - Entity ID (load, payment, etc.)
   * @param entityType - Entity type
   * @param options - Query options
   * @returns Audit trail
   */
  async getAuditTrail(
    entityId: string,
    entityType: string,
    options: {
      limit?: number;
      offset?: number;
      startDate?: string;
      endDate?: string;
    } = {},
  ): Promise<MessageHistoryRecord[]> {
    try {
      const { limit = 100, offset = 0, startDate, endDate } = options;

      let query = supabase
        .from("message_history")
        .select("*")
        .eq("related_entity_id", entityId)
        .eq("related_entity_type", entityType)
        .order("created_at", { ascending: true })
        .range(offset, offset + limit - 1);

      if (startDate) {
        query = query.gte("created_at", startDate);
      }

      if (endDate) {
        query = query.lte("created_at", endDate);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data as MessageHistoryRecord[];
    } catch (error) {
      logger.error("Failed to get audit trail", {
        error,
        entity_id: entityId,
        entity_type: entityType,
      });
      return [];
    }
  }

  /**
   * Log a system audit event
   * @param eventType - Type of event
   * @param details - Event details
   * @param entityId - Related entity ID
   * @param entityType - Related entity type
   * @param actorId - User who performed the action
   * @param actorType - Type of user
   * @param ipAddress - IP address
   * @returns Audit record
   */
  async logAuditEvent(
    eventType: string,
    details: Record<string, any>,
    entityId?: string,
    entityType?: string,
    actorId?: string,
    actorType?: string,
    ipAddress?: string,
  ): Promise<SystemAuditRecord | null> {
    try {
      const { data, error } = await supabase
        .from("system_audit_log")
        .insert({
          event_type: eventType,
          details,
          entity_id: entityId,
          entity_type: entityType,
          actor_id: actorId,
          actor_type: actorType,
          ip_address: ipAddress,
        })
        .select()
        .single();

      if (error) throw error;

      logger.info("Audit event logged", {
        event_type: eventType,
        entity_id: entityId,
      });
      return data as SystemAuditRecord;
    } catch (error) {
      logger.error("Failed to log audit event", {
        error,
        event_type: eventType,
      });
      return null;
    }
  }

  /**
   * Archive old messages to maintain performance
   * @param olderThanDays - Archive messages older than days
   * @returns Number of archived messages
   */
  async archiveOldMessages(olderThanDays = 90): Promise<number> {
    try {
      const { data, error } = await supabase.rpc("archive_old_messages", {
        older_than_days: olderThanDays,
      });

      if (error) throw error;

      const archivedCount = data as number;
      logger.info(
        `Archived ${archivedCount} messages older than ${olderThanDays} days`,
      );

      return archivedCount;
    } catch (error) {
      logger.error("Failed to archive old messages", {
        error,
        days: olderThanDays,
      });
      return 0;
    }
  }

  /**
   * Get message by ID with its current status
   * @param messageId - Message ID
   * @returns Message with status
   */
  async getMessageById(
    messageId: string,
  ): Promise<MessageHistoryRecord | null> {
    try {
      const { data, error } = await supabase
        .from("message_history_with_status")
        .select("*")
        .eq("message_id", messageId)
        .single();

      if (error) throw error;

      return data as MessageHistoryRecord;
    } catch (error) {
      logger.error("Failed to get message by ID", {
        error,
        message_id: messageId,
      });
      return null;
    }
  }

  /**
   * Get message status history
   * @param messageId - Message ID
   * @returns Status history
   */
  async getMessageStatusHistory(
    messageId: string,
  ): Promise<MessageStatusRecord[]> {
    try {
      const { data, error } = await supabase
        .from("message_status_history")
        .select("*")
        .eq("message_id", messageId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      return data as MessageStatusRecord[];
    } catch (error) {
      logger.error("Failed to get message status history", {
        error,
        message_id: messageId,
      });
      return [];
    }
  }

  /**
   * Get message attachments
   * @param messageId - Message ID
   * @returns Attachments
   */
  async getMessageAttachments(
    messageId: string,
  ): Promise<MessageAttachmentRecord[]> {
    try {
      const { data, error } = await supabase
        .from("message_attachment_history")
        .select("*")
        .eq("message_id", messageId);

      if (error) throw error;

      return data as MessageAttachmentRecord[];
    } catch (error) {
      logger.error("Failed to get message attachments", {
        error,
        message_id: messageId,
      });
      return [];
    }
  }
}

// Export singleton instance
export const messageHistoryService = new MessageHistoryService();
