import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";

/**
 * Validate create chat request
 */
export const validateCreateChat = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { participantIds, name, isGroup, loadId } = req.body;

  // Check if participantIds is an array and has at least one participant
  if (!Array.isArray(participantIds) || participantIds.length === 0) {
    return res
      .status(400)
      .json({
        error: "participantIds must be an array with at least one participant",
      });
  }

  // If it's a group chat, name is required
  if (
    isGroup === true &&
    (!name || typeof name !== "string" || name.trim() === "")
  ) {
    return res.status(400).json({ error: "name is required for group chats" });
  }

  // If loadId is provided, it must be a string
  if (
    loadId !== undefined &&
    (typeof loadId !== "string" || loadId.trim() === "")
  ) {
    return res.status(400).json({ error: "loadId must be a valid string" });
  }

  next();
};

/**
 * Validate send message request
 */
export const validateSendMessage = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { content, attachmentUrl, attachmentType } = req.body;

  // Content is required
  if (!content || typeof content !== "string" || content.trim() === "") {
    return res.status(400).json({ error: "content is required" });
  }

  // If attachmentUrl is provided, attachmentType is required
  if (
    attachmentUrl &&
    (!attachmentType ||
      typeof attachmentType !== "string" ||
      attachmentType.trim() === "")
  ) {
    return res
      .status(400)
      .json({
        error: "attachmentType is required when attachmentUrl is provided",
      });
  }

  // If attachmentType is provided, attachmentUrl is required
  if (
    attachmentType &&
    (!attachmentUrl ||
      typeof attachmentUrl !== "string" ||
      attachmentUrl.trim() === "")
  ) {
    return res
      .status(400)
      .json({
        error: "attachmentUrl is required when attachmentType is provided",
      });
  }

  next();
};

/**
 * Validate add participant request
 */
export const validateAddParticipant = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { newUserId, role } = req.body;

  // newUserId is required
  if (!newUserId || typeof newUserId !== "string" || newUserId.trim() === "") {
    return res.status(400).json({ error: "newUserId is required" });
  }

  // If role is provided, it must be either "admin" or "member"
  if (
    role &&
    (typeof role !== "string" || (role !== "admin" && role !== "member"))
  ) {
    return res
      .status(400)
      .json({ error: "role must be either 'admin' or 'member'" });
  }

  next();
};

/**
 * Validate system message request
 */
export const validateSystemMessage = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { content, eventType } = req.body;

  // Content is required
  if (!content || typeof content !== "string" || content.trim() === "") {
    return res.status(400).json({ error: "content is required" });
  }

  // If eventType is provided, it must be a string
  if (eventType && (typeof eventType !== "string" || eventType.trim() === "")) {
    return res.status(400).json({ error: "eventType must be a valid string" });
  }

  next();
};
