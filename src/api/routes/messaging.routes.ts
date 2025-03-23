import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import {
  getUserChats,
  getChatMessages,
  createChat,
  sendMessage,
  markMessagesAsRead,
  getChatParticipants,
  addChatParticipant,
  removeChatParticipant,
  sendSystemMessage,
  getUnreadMessageCount,
  getRecentChats,
} from "../controllers/messaging.controller";

const router = Router();

/**
 * @route GET /api/messaging/chats
 * @desc Get all chats for the authenticated user
 * @access Private
 */
router.get("/chats", authenticate, getUserChats);

/**
 * @route GET /api/messaging/chats/:chatId/messages
 * @desc Get messages for a specific chat
 * @access Private
 */
router.get("/chats/:chatId/messages", authenticate, getChatMessages);

/**
 * @route POST /api/messaging/chats
 * @desc Create a new chat
 * @access Private
 */
router.post("/chats", authenticate, createChat);

/**
 * @route POST /api/messaging/chats/:chatId/messages
 * @desc Send a message to a chat
 * @access Private
 */
router.post("/chats/:chatId/messages", authenticate, sendMessage);

/**
 * @route PUT /api/messaging/chats/:chatId/read
 * @desc Mark all messages in a chat as read
 * @access Private
 */
router.put("/chats/:chatId/read", authenticate, markMessagesAsRead);

/**
 * @route GET /api/messaging/chats/:chatId/participants
 * @desc Get participants of a chat
 * @access Private
 */
router.get("/chats/:chatId/participants", authenticate, getChatParticipants);

/**
 * @route POST /api/messaging/chats/:chatId/participants
 * @desc Add a participant to a chat
 * @access Private
 */
router.post("/chats/:chatId/participants", authenticate, addChatParticipant);

/**
 * @route DELETE /api/messaging/chats/:chatId/participants/:participantId
 * @desc Remove a participant from a chat
 * @access Private
 */
router.delete(
  "/chats/:chatId/participants/:participantId",
  authenticate,
  removeChatParticipant,
);

/**
 * @route POST /api/messaging/chats/:chatId/system-message
 * @desc Send a system message to a chat
 * @access Private
 */
router.post("/chats/:chatId/system-message", authenticate, sendSystemMessage);

/**
 * @route GET /api/messaging/unread-count
 * @desc Get unread message count for a user
 * @access Private
 */
router.get("/unread-count", authenticate, getUnreadMessageCount);

/**
 * @route GET /api/messaging/recent-chats
 * @desc Get recent chats with unread messages
 * @access Private
 */
router.get("/recent-chats", authenticate, getRecentChats);

export default router;
