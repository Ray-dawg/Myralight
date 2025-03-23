import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { logger } from "../utils/logger";
import { messageHistoryService } from "@/services/message-history.service";

const router = Router();

/**
 * @route GET /api/message-history/chat/:chatId
 * @desc Get message history for a chat
 * @access Private
 */
router.get("/chat/:chatId", authenticate, async (req, res) => {
  try {
    const { chatId } = req.params;
    const {
      limit,
      offset,
      startDate,
      endDate,
      messageTypes,
      senderIds,
      senderTypes,
      includeArchived,
      includeSystemMessages,
      searchTerm,
    } = req.query;

    const options = {
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
      startDate: startDate as string,
      endDate: endDate as string,
      messageTypes: messageTypes
        ? (messageTypes as string).split(",")
        : undefined,
      senderIds: senderIds ? (senderIds as string).split(",") : undefined,
      senderTypes: senderTypes ? (senderTypes as string).split(",") : undefined,
      includeArchived: includeArchived === "true",
      includeSystemMessages: includeSystemMessages !== "false",
      searchTerm: searchTerm as string,
    };

    const messages = await messageHistoryService.getChatHistory(
      chatId,
      options,
    );

    res.json(messages);
  } catch (error) {
    logger.error("Error getting chat history:", error);
    res.status(500).json({ error: "Failed to get chat history" });
  }
});

/**
 * @route GET /api/message-history/load/:loadId
 * @desc Get message history for a load
 * @access Private
 */
router.get("/load/:loadId", authenticate, async (req, res) => {
  try {
    const { loadId } = req.params;
    const {
      limit,
      offset,
      startDate,
      endDate,
      messageTypes,
      senderIds,
      senderTypes,
      includeArchived,
      includeSystemMessages,
      searchTerm,
    } = req.query;

    const options = {
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
      startDate: startDate as string,
      endDate: endDate as string,
      messageTypes: messageTypes
        ? (messageTypes as string).split(",")
        : undefined,
      senderIds: senderIds ? (senderIds as string).split(",") : undefined,
      senderTypes: senderTypes ? (senderTypes as string).split(",") : undefined,
      includeArchived: includeArchived === "true",
      includeSystemMessages: includeSystemMessages !== "false",
      searchTerm: searchTerm as string,
    };

    const messages = await messageHistoryService.getLoadMessageHistory(
      loadId,
      options,
    );

    res.json(messages);
  } catch (error) {
    logger.error("Error getting load message history:", error);
    res.status(500).json({ error: "Failed to get load message history" });
  }
});

/**
 * @route GET /api/message-history/search
 * @desc Search message history
 * @access Private
 */
router.get("/search", authenticate, async (req, res) => {
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
      includeArchived,
      limit,
      offset,
    } = req.query;

    const searchParams = {
      searchTerm: searchTerm as string,
      chatIds: chatIds ? (chatIds as string).split(",") : undefined,
      loadIds: loadIds ? (loadIds as string).split(",") : undefined,
      senderIds: senderIds ? (senderIds as string).split(",") : undefined,
      senderTypes: senderTypes ? (senderTypes as string).split(",") : undefined,
      messageTypes: messageTypes
        ? (messageTypes as string).split(",")
        : undefined,
      startDate: startDate as string,
      endDate: endDate as string,
      includeArchived: includeArchived === "true",
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
    };

    const messages = await messageHistoryService.searchMessages(searchParams);

    res.json(messages);
  } catch (error) {
    logger.error("Error searching messages:", error);
    res.status(500).json({ error: "Failed to search messages" });
  }
});

/**
 * @route GET /api/message-history/export
 * @desc Export message history
 * @access Private
 */
router.get("/export", authenticate, async (req, res) => {
  try {
    const {
      chatId,
      loadId,
      startDate,
      endDate,
      includeSystemMessages,
      format,
    } = req.query;

    if (!chatId && !loadId) {
      return res
        .status(400)
        .json({ error: "Either chatId or loadId is required" });
    }

    const exportParams = {
      chatId: chatId as string,
      loadId: loadId as string,
      startDate: startDate as string,
      endDate: endDate as string,
      includeSystemMessages: includeSystemMessages !== "false",
      format: (format as "csv" | "json" | "pdf") || "csv",
    };

    const exportData =
      await messageHistoryService.exportMessageHistory(exportParams);

    // Set appropriate headers based on format
    if (exportParams.format === "csv") {
      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="message-history-${Date.now()}.csv"`,
      );
    } else if (exportParams.format === "json") {
      res.setHeader("Content-Type", "application/json");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="message-history-${Date.now()}.json"`,
      );
    }

    res.send(exportData);
  } catch (error) {
    logger.error("Error exporting message history:", error);
    res.status(500).json({ error: "Failed to export message history" });
  }
});

/**
 * @route GET /api/message-history/audit/:entityType/:entityId
 * @desc Get audit trail for an entity
 * @access Private
 */
router.get("/audit/:entityType/:entityId", authenticate, async (req, res) => {
  try {
    const { entityType, entityId } = req.params;
    const { limit, offset, startDate, endDate } = req.query;

    const options = {
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
      startDate: startDate as string,
      endDate: endDate as string,
    };

    const auditTrail = await messageHistoryService.getAuditTrail(
      entityId,
      entityType,
      options,
    );

    res.json(auditTrail);
  } catch (error) {
    logger.error("Error getting audit trail:", error);
    res.status(500).json({ error: "Failed to get audit trail" });
  }
});

/**
 * @route GET /api/message-history/message/:messageId
 * @desc Get message by ID with status
 * @access Private
 */
router.get("/message/:messageId", authenticate, async (req, res) => {
  try {
    const { messageId } = req.params;
    const message = await messageHistoryService.getMessageById(messageId);

    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    res.json(message);
  } catch (error) {
    logger.error("Error getting message:", error);
    res.status(500).json({ error: "Failed to get message" });
  }
});

/**
 * @route GET /api/message-history/message/:messageId/status
 * @desc Get message status history
 * @access Private
 */
router.get("/message/:messageId/status", authenticate, async (req, res) => {
  try {
    const { messageId } = req.params;
    const statusHistory =
      await messageHistoryService.getMessageStatusHistory(messageId);

    res.json(statusHistory);
  } catch (error) {
    logger.error("Error getting message status history:", error);
    res.status(500).json({ error: "Failed to get message status history" });
  }
});

/**
 * @route GET /api/message-history/message/:messageId/attachments
 * @desc Get message attachments
 * @access Private
 */
router.get(
  "/message/:messageId/attachments",
  authenticate,
  async (req, res) => {
    try {
      const { messageId } = req.params;
      const attachments =
        await messageHistoryService.getMessageAttachments(messageId);

      res.json(attachments);
    } catch (error) {
      logger.error("Error getting message attachments:", error);
      res.status(500).json({ error: "Failed to get message attachments" });
    }
  },
);

/**
 * @route POST /api/message-history/archive
 * @desc Archive old messages
 * @access Private (Admin only)
 */
router.post("/archive", authenticate, async (req, res) => {
  try {
    // Check if user is admin
    const user = (req as any).user;
    if (user.role !== "admin") {
      return res
        .status(403)
        .json({ error: "Only admins can archive messages" });
    }

    const { olderThanDays = 90 } = req.body;
    const archivedCount =
      await messageHistoryService.archiveOldMessages(olderThanDays);

    res.json({ success: true, archivedCount });
  } catch (error) {
    logger.error("Error archiving messages:", error);
    res.status(500).json({ error: "Failed to archive messages" });
  }
});

export default router;
