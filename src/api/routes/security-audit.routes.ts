import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.middleware";
import { securityAuditService } from "../../services/security-audit.service";
import { logger } from "../utils/logger";

const router = Router();

/**
 * @route GET /api/security-audit/events
 * @desc Get security audit events (admin only)
 * @access Private (Admin)
 */
router.get("/events", authenticate, authorize(["admin"]), async (req, res) => {
  try {
    const events = securityAuditService.getSecurityEvents();
    return res.status(200).json({ events });
  } catch (error) {
    logger.error("Error fetching security events:", error);
    return res.status(500).json({ error: "Failed to fetch security events" });
  }
});

/**
 * @route DELETE /api/security-audit/events
 * @desc Clear security audit events (admin only)
 * @access Private (Admin)
 */
router.delete(
  "/events",
  authenticate,
  authorize(["admin"]),
  async (req, res) => {
    try {
      securityAuditService.clearSecurityEvents();
      return res
        .status(200)
        .json({ message: "Security events cleared successfully" });
    } catch (error) {
      logger.error("Error clearing security events:", error);
      return res.status(500).json({ error: "Failed to clear security events" });
    }
  },
);

/**
 * @route POST /api/security-audit/run
 * @desc Run a manual security audit (admin only)
 * @access Private (Admin)
 */
router.post("/run", authenticate, authorize(["admin"]), async (req, res) => {
  try {
    // This would typically trigger a more comprehensive audit
    // For now, we'll just return a success message
    logger.info("Manual security audit triggered by admin");

    // In a real implementation, you might run various checks here
    // or trigger a background job to run the audit

    return res.status(200).json({
      message: "Security audit initiated",
      auditId: `audit-${Date.now()}`,
      status: "in_progress",
    });
  } catch (error) {
    logger.error("Error initiating security audit:", error);
    return res.status(500).json({ error: "Failed to initiate security audit" });
  }
});

export default router;
