import { Request, Response } from "express";
import { securityAuditService } from "../../services/security-audit.service";
import { logger } from "../utils/logger";

/**
 * Get security audit events
 */
export const getSecurityEvents = async (req: Request, res: Response) => {
  try {
    const events = await securityAuditService.getSecurityEvents();
    return res.status(200).json({ events });
  } catch (error) {
    logger.error("Error fetching security events:", error);
    return res.status(500).json({ error: "Failed to fetch security events" });
  }
};

/**
 * Clear security audit events
 */
export const clearSecurityEvents = async (req: Request, res: Response) => {
  try {
    const result = await securityAuditService.clearSecurityEvents();
    if (result) {
      return res
        .status(200)
        .json({ message: "Security events cleared successfully" });
    } else {
      return res.status(500).json({ error: "Failed to clear security events" });
    }
  } catch (error) {
    logger.error("Error clearing security events:", error);
    return res.status(500).json({ error: "Failed to clear security events" });
  }
};

/**
 * Run a manual security audit
 */
export const runSecurityAudit = async (req: Request, res: Response) => {
  try {
    // Log the audit initiation
    logger.info("Manual security audit triggered", {
      user: (req as any).user?.id || "unknown",
      ip: req.ip || req.headers["x-forwarded-for"] || "unknown",
    });

    // Use the security audit service to run the audit
    const result = await securityAuditService.runSecurityAudit(
      "manual",
      (req as any).user?.id || "unknown",
    );

    if (!result.success) {
      return res
        .status(500)
        .json({ error: result.error || "Failed to initiate security audit" });
    }

    return res.status(200).json({
      message: "Security audit initiated",
      auditId: result.auditId,
      status: "in_progress",
    });
  } catch (error) {
    logger.error("Error initiating security audit:", error);
    return res.status(500).json({ error: "Failed to initiate security audit" });
  }
};

/**
 * Get security audit status
 */
export const getAuditStatus = async (req: Request, res: Response) => {
  try {
    const { auditId } = req.params;

    // Get the audit record from the database
    const auditRecord = await securityAuditService.getAuditStatus(auditId);

    if (!auditRecord) {
      return res.status(404).json({ error: "Audit record not found" });
    }

    return res.status(200).json(auditRecord);
  } catch (error) {
    logger.error("Error fetching audit status:", error);
    return res.status(500).json({ error: "Failed to fetch audit status" });
  }
};

/**
 * Get security scan results
 */
export const getSecurityScanResults = async (req: Request, res: Response) => {
  try {
    const { data, error } = await securityAuditService.getSecurityScanResults();

    if (error) {
      return res
        .status(500)
        .json({ error: "Failed to fetch security scan results" });
    }

    return res.status(200).json({ results: data });
  } catch (error) {
    logger.error("Error fetching security scan results:", error);
    return res
      .status(500)
      .json({ error: "Failed to fetch security scan results" });
  }
};

/**
 * Get vulnerability reports
 */
export const getVulnerabilityReports = async (req: Request, res: Response) => {
  try {
    const { data, error } =
      await securityAuditService.getVulnerabilityReports();

    if (error) {
      return res
        .status(500)
        .json({ error: "Failed to fetch vulnerability reports" });
    }

    return res.status(200).json({ reports: data });
  } catch (error) {
    logger.error("Error fetching vulnerability reports:", error);
    return res
      .status(500)
      .json({ error: "Failed to fetch vulnerability reports" });
  }
};
