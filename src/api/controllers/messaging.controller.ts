import { Request, Response } from "express";
import { createClient } from "@supabase/supabase-js";
import { logger } from "../utils/logger";
import { WebSocketService } from "../services/websocket.service";

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  logger.error("Supabase URL or key not found in environment variables");
  throw new Error("Supabase configuration missing");
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const wsService = WebSocketService.getInstance();

/**
 * Get all chats for the authenticated user
 * @route GET /api/messaging/chats
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Object} List of chat sessions
 */
export const getUserChats = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

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
    const chats = data.map((item: any) => item.chats);

    res.json(chats);
  } catch (error) {
    logger.error("Error getting chats:", error);
    res.status(500).json({ error: "Failed to get chats" });
  }
};

/**
 * Get messages for a specific chat
 * @route GET /api/messaging/chats/:chatId/messages
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Object} List of messages
 */
export const getChatMessages = async (req: Request, res: Response) => {
  try {
    const { chatId } = req.params;
    const userId = (req as any).user.id;
    const limit = parseInt(req.query.limit as string) || 50;
    const before = req.query.before as string;

    // Check if user is a participant in the chat
    const { data: participant, error: participantError } = await supabase
      .from("chat_participants")
      .select("id")
      .eq("chat_id", chatId)
      .eq("user_id", userId)
      .single();

    if (participantError || !participant) {
      return res
        .status(403)
        .json({ error: "Not authorized to access this chat" });
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

    res.json(data);
  } catch (error) {
    logger.error("Error getting messages:", error);
    res.status(500).json({ error: "Failed to get messages" });
  }
};

/**
 * Create a new chat session
 * @route POST /api/messaging/chats
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Object} New chat session details
 */
export const createChat = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { participantIds, name, isGroup, loadId } = req.body;

    // Make sure the current user is included in participants
    if (!participantIds.includes(userId)) {
      participantIds.push(userId);
    }

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

    res.json(data);
  } catch (error) {
    logger.error("Error creating chat:", error);
    res.status(500).json({ error: "Failed to create chat" });
  }
};

/**
 * Send a message to a chat
 * @route POST /api/messaging/chats/:chatId/messages
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Object} New message details
 */
export const sendMessage = async (req: Request, res: Response) => {
  try {
    const { chatId } = req.params;
    const userId = (req as any).user.id;
    const { content, attachmentUrl, attachmentType } = req.body;

    // Check if user is a participant in the chat
    const { data: participant, error: participantError } = await supabase
      .from("chat_participants")
      .select("id")
      .eq("chat_id", chatId)
      .eq("user_id", userId)
      .single();

    if (participantError || !participant) {
      return res
        .status(403)
        .json({ error: "Not authorized to send messages to this chat" });
    }

    // Create message
    const { data: message, error } = await supabase
      .from("messages")
      .insert({
        chat_id: chatId,
        sender_id: userId,
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
    const { data: chatParticipants, error: participantsError } = await supabase
      .from("chat_participants")
      .select("user_id")
      .eq("chat_id", chatId);

    if (!participantsError && chatParticipants) {
      // Notify all participants via WebSocket
      chatParticipants.forEach((participant) => {
        if (participant.user_id !== userId) {
          // Don't notify sender
          wsService.sendMessage("message:received", {
            message,
            recipient_id: participant.user_id,
          });
        }
      });
    }

    res.json(message);
  } catch (error) {
    logger.error("Error sending message:", error);
    res.status(500).json({ error: "Failed to send message" });
  }
};

/**
 * Mark all messages in a chat as read
 * @route PUT /api/messaging/chats/:chatId/read
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Object} Success status
 */
export const markMessagesAsRead = async (req: Request, res: Response) => {
  try {
    const { chatId } = req.params;
    const userId = (req as any).user.id;

    // Check if user is a participant in the chat
    const { data: participant, error: participantError } = await supabase
      .from("chat_participants")
      .select("id")
      .eq("chat_id", chatId)
      .eq("user_id", userId)
      .single();

    if (participantError || !participant) {
      return res
        .status(403)
        .json({ error: "Not authorized to access this chat" });
    }

    // Mark messages as read using RPC function
    const { error } = await supabase.rpc("mark_chat_messages_as_read", {
      p_chat_id: chatId,
      p_user_id: userId,
    });

    if (error) throw error;

    // Notify other participants that this user has read messages
    const { data: chatParticipants, error: participantsError } = await supabase
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

    res.json({ success: true });
  } catch (error) {
    logger.error("Error marking messages as read:", error);
    res.status(500).json({ error: "Failed to mark messages as read" });
  }
};

/**
 * Get participants of a chat
 * @route GET /api/messaging/chats/:chatId/participants
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Object} List of chat participants
 */
export const getChatParticipants = async (req: Request, res: Response) => {
  try {
    const { chatId } = req.params;
    const userId = (req as any).user.id;

    // Check if user is a participant in the chat
    const { data: participant, error: participantError } = await supabase
      .from("chat_participants")
      .select("id")
      .eq("chat_id", chatId)
      .eq("user_id", userId)
      .single();

    if (participantError || !participant) {
      return res
        .status(403)
        .json({ error: "Not authorized to access this chat" });
    }

    // Get participants
    const { data, error } = await supabase
      .from("chat_participants")
      .select(
        `
        id,
        chat_id,
        user_id,
        role,
        joined_at,
        users:user_id(id, email, first_name, last_name, avatar_url)
      `,
      )
      .eq("chat_id", chatId);

    if (error) throw error;

    res.json(data);
  } catch (error) {
    logger.error("Error getting chat participants:", error);
    res.status(500).json({ error: "Failed to get chat participants" });
  }
};

/**
 * Add a participant to a chat
 * @route POST /api/messaging/chats/:chatId/participants
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Object} New participant details
 */
export const addChatParticipant = async (req: Request, res: Response) => {
  try {
    const { chatId } = req.params;
    const userId = (req as any).user.id;
    const { newUserId, role = "member" } = req.body;

    // Check if user is an admin in the chat
    const { data: adminCheck, error: adminError } = await supabase
      .from("chat_participants")
      .select("id")
      .eq("chat_id", chatId)
      .eq("user_id", userId)
      .eq("role", "admin")
      .single();

    if (adminError || !adminCheck) {
      return res
        .status(403)
        .json({ error: "Only chat admins can add participants" });
    }

    // Add participant
    const { data, error } = await supabase
      .from("chat_participants")
      .insert([{ chat_id: chatId, user_id: newUserId, role }])
      .select();

    if (error) throw error;

    // Notify all participants about the new member
    const { data: chatParticipants, error: participantsError } = await supabase
      .from("chat_participants")
      .select("user_id")
      .eq("chat_id", chatId);

    if (!participantsError && chatParticipants) {
      chatParticipants.forEach((participant) => {
        wsService.sendMessage("chat:participant_added", {
          chat_id: chatId,
          new_participant: data[0],
          recipient_id: participant.user_id,
        });
      });
    }

    res.json(data[0]);
  } catch (error) {
    logger.error("Error adding chat participant:", error);
    res.status(500).json({ error: "Failed to add chat participant" });
  }
};

/**
 * Remove a participant from a chat
 * @route DELETE /api/messaging/chats/:chatId/participants/:participantId
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Object} Success status
 */
export const removeChatParticipant = async (req: Request, res: Response) => {
  try {
    const { chatId, participantId } = req.params;
    const userId = (req as any).user.id;

    // Check if user is an admin in the chat or removing themselves
    const { data: adminCheck, error: adminError } = await supabase
      .from("chat_participants")
      .select("id")
      .eq("chat_id", chatId)
      .eq("user_id", userId)
      .eq("role", "admin")
      .single();

    const isSelf = participantId === userId;

    if (!isSelf && (adminError || !adminCheck)) {
      return res
        .status(403)
        .json({ error: "Only chat admins can remove participants" });
    }

    // Remove participant
    const { data, error } = await supabase
      .from("chat_participants")
      .delete()
      .eq("chat_id", chatId)
      .eq("user_id", participantId);

    if (error) throw error;

    // Notify all participants about the removal
    const { data: chatParticipants, error: participantsError } = await supabase
      .from("chat_participants")
      .select("user_id")
      .eq("chat_id", chatId);

    if (!participantsError && chatParticipants) {
      chatParticipants.forEach((participant) => {
        wsService.sendMessage("chat:participant_removed", {
          chat_id: chatId,
          removed_user_id: participantId,
          recipient_id: participant.user_id,
        });
      });
    }

    res.json({ success: true });
  } catch (error) {
    logger.error("Error removing chat participant:", error);
    res.status(500).json({ error: "Failed to remove chat participant" });
  }
};

/**
 * Send a system message to a chat
 * @route POST /api/messaging/chats/:chatId/system-message
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Object} New message details
 */
export const sendSystemMessage = async (req: Request, res: Response) => {
  try {
    const { chatId } = req.params;
    const { content, eventType } = req.body;

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
    const { data: chatParticipants, error: participantsError } = await supabase
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

    res.json(message);
  } catch (error) {
    logger.error("Error sending system message:", error);
    res.status(500).json({ error: "Failed to send system message" });
  }
};

/**
 * Get unread message count for a user
 * @route GET /api/messaging/unread-count
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Object} Unread message count
 */
export const getUnreadMessageCount = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    // Get unread message count using RPC function
    const { data, error } = await supabase.rpc("get_unread_message_count", {
      p_user_id: userId,
    });

    if (error) throw error;

    res.json({ unreadCount: data });
  } catch (error) {
    logger.error("Error getting unread message count:", error);
    res.status(500).json({ error: "Failed to get unread message count" });
  }
};

/**
 * Get recent chats with unread messages
 * @route GET /api/messaging/recent-chats
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Object} Recent chats with unread messages
 */
export const getRecentChats = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const limit = parseInt(req.query.limit as string) || 5;

    // Get recent chats with unread messages
    const { data, error } = await supabase.rpc("get_recent_chats_with_unread", {
      p_user_id: userId,
      p_limit: limit,
    });

    if (error) throw error;

    res.json(data);
  } catch (error) {
    logger.error("Error getting recent chats:", error);
    res.status(500).json({ error: "Failed to get recent chats" });
  }
};
