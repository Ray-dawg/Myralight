import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { logger } from "../utils/logger";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_KEY || "";

if (!supabaseUrl || !supabaseKey) {
  logger.error(
    "Supabase URL or service key not found in environment variables",
  );
  throw new Error("Supabase configuration missing");
}

const supabase = createClient(supabaseUrl, supabaseKey);

const router = Router();

/**
 * @route GET /api/notifications
 * @desc Get notifications for the authenticated user
 * @access Private
 */
router.get("/", authenticate, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;
    const includeRead = req.query.includeRead === "true";

    let query = supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit)
      .range(offset, offset + limit - 1);

    if (!includeRead) {
      query = query.is("read_at", null);
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json(data);
  } catch (error) {
    logger.error("Error getting notifications:", error);
    res.status(500).json({ error: "Failed to get notifications" });
  }
});

/**
 * @route GET /api/notifications/count
 * @desc Get unread notification count for the authenticated user
 * @access Private
 */
router.get("/count", authenticate, async (req, res) => {
  try {
    const userId = (req as any).user.id;

    const { count, error } = await supabase
      .from("notifications")
      .select("id", { count: "exact" })
      .eq("user_id", userId)
      .is("read_at", null);

    if (error) throw error;

    res.json({ count: count || 0 });
  } catch (error) {
    logger.error("Error getting notification count:", error);
    res.status(500).json({ error: "Failed to get notification count" });
  }
});

/**
 * @route PUT /api/notifications/:id/read
 * @desc Mark a notification as read
 * @access Private
 */
router.put("/:id/read", authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;

    const { data, error } = await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", userId)
      .select();

    if (error) throw error;

    res.json(data[0] || { success: true });
  } catch (error) {
    logger.error("Error marking notification as read:", error);
    res.status(500).json({ error: "Failed to mark notification as read" });
  }
});

/**
 * @route PUT /api/notifications/read-all
 * @desc Mark all notifications as read
 * @access Private
 */
router.put("/read-all", authenticate, async (req, res) => {
  try {
    const userId = (req as any).user.id;

    const { data, error } = await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("user_id", userId)
      .is("read_at", null);

    if (error) throw error;

    res.json({ success: true });
  } catch (error) {
    logger.error("Error marking all notifications as read:", error);
    res.status(500).json({ error: "Failed to mark all notifications as read" });
  }
});

/**
 * @route DELETE /api/notifications/:id
 * @desc Delete a notification
 * @access Private
 */
router.delete("/:id", authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;

    const { data, error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) throw error;

    res.json({ success: true });
  } catch (error) {
    logger.error("Error deleting notification:", error);
    res.status(500).json({ error: "Failed to delete notification" });
  }
});

export default router;
