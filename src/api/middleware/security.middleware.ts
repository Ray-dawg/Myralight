import { Request, Response, NextFunction } from "express";
import { securityAuditService } from "../../services/security-audit.service";
import { logger } from "../utils/logger";

/**
 * Middleware to check for common security vulnerabilities in request data
 */
export const securityCheck = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // Check query parameters
    if (Object.keys(req.query).length > 0) {
      const queryCheck = securityAuditService.checkForVulnerabilities(
        req.query,
        "query parameters",
      );

      if (!queryCheck.safe) {
        logger.warn(
          `Security issues detected in request query: ${queryCheck.issues.join(", ")}`,
        );
        return res.status(400).json({ error: "Invalid request parameters" });
      }
    }

    // Check request body
    if (req.body && Object.keys(req.body).length > 0) {
      const bodyCheck = securityAuditService.checkForVulnerabilities(
        req.body,
        "request body",
      );

      if (!bodyCheck.safe) {
        logger.warn(
          `Security issues detected in request body: ${bodyCheck.issues.join(", ")}`,
        );
        return res.status(400).json({ error: "Invalid request data" });
      }
    }

    // Check URL parameters
    if (req.params && Object.keys(req.params).length > 0) {
      const paramsCheck = securityAuditService.checkForVulnerabilities(
        req.params,
        "URL parameters",
      );

      if (!paramsCheck.safe) {
        logger.warn(
          `Security issues detected in URL parameters: ${paramsCheck.issues.join(", ")}`,
        );
        return res.status(400).json({ error: "Invalid URL parameters" });
      }
    }

    // Log the security check
    securityAuditService.trackSensitiveOperation(
      "security_check",
      (req as any).user?.id || "anonymous",
      {
        path: req.path,
        method: req.method,
        ip: req.ip || req.headers["x-forwarded-for"] || "unknown",
        userAgent: req.headers["user-agent"] || "unknown",
        query: Object.keys(req.query).length > 0,
        body: req.body && Object.keys(req.body).length > 0,
        params: req.params && Object.keys(req.params).length > 0,
      },
    );

    // Continue to the next middleware or route handler
    next();
  } catch (error) {
    logger.error("Error in security middleware:", error);
    next(error);
  }
};

/**
 * Middleware to add security headers to responses
 */
export const securityHeaders = (
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  // Set security headers
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains",
  );
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://images.unsplash.com https://api.dicebear.com; connect-src 'self' https://*.supabase.co",
  );
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(self)",
  );

  // Add a security nonce for inline scripts if needed
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  res.locals.nonce = nonce;

  // Update CSP to use nonce
  res.setHeader(
    "Content-Security-Policy",
    `default-src 'self'; script-src 'self' 'nonce-${nonce}' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://images.unsplash.com https://api.dicebear.com; connect-src 'self' https://*.supabase.co`,
  );

  next();
};

/**
 * Middleware to track sensitive operations
 */
export const trackSensitiveOperation = (operationType: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Get user ID from authenticated request
    const userId = (req as any).user?.id || "anonymous";

    // Track the operation
    securityAuditService.trackSensitiveOperation(operationType, userId, {
      path: req.path,
      method: req.method,
      ip: req.ip || req.headers["x-forwarded-for"] || "unknown",
      userAgent: req.headers["user-agent"] || "unknown",
      timestamp: new Date().toISOString(),
    });

    next();
  };
};

/**
 * Middleware to rate limit requests
 */
export const rateLimit = (maxRequests: number, timeWindowMs: number) => {
  const requestCounts = new Map<string, { count: number; resetTime: number }>();

  return async (req: Request, res: Response, next: NextFunction) => {
    // Get client IP
    const clientIp = req.ip || req.headers["x-forwarded-for"] || "unknown";

    // Get current time
    const now = Date.now();

    // Get or create request count for this IP
    let requestData = requestCounts.get(clientIp);
    if (!requestData || now > requestData.resetTime) {
      requestData = { count: 0, resetTime: now + timeWindowMs };
      requestCounts.set(clientIp, requestData);
    }

    // Increment request count
    requestData.count++;

    // Check if rate limit exceeded
    if (requestData.count > maxRequests) {
      // Log rate limit exceeded
      securityAuditService.trackSensitiveOperation(
        "rate_limit_exceeded",
        (req as any).user?.id || "anonymous",
        {
          path: req.path,
          method: req.method,
          ip: clientIp,
          userAgent: req.headers["user-agent"] || "unknown",
          requestCount: requestData.count,
          timeWindow: timeWindowMs,
        },
      );

      // Set rate limit headers
      res.setHeader(
        "Retry-After",
        Math.ceil((requestData.resetTime - now) / 1000),
      );

      return res
        .status(429)
        .json({ error: "Too many requests, please try again later" });
    }

    // Set rate limit headers
    res.setHeader("X-RateLimit-Limit", maxRequests);
    res.setHeader("X-RateLimit-Remaining", maxRequests - requestData.count);
    res.setHeader("X-RateLimit-Reset", Math.ceil(requestData.resetTime / 1000));

    next();
  };
};

/**
 * Middleware to validate content type
 */
export const validateContentType = (allowedTypes: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Skip for GET and DELETE requests
    if (req.method === "GET" || req.method === "DELETE") {
      return next();
    }

    const contentType = req.headers["content-type"] || "";
    const isAllowed = allowedTypes.some((type) => contentType.includes(type));

    if (!isAllowed) {
      return res.status(415).json({ error: "Unsupported Media Type" });
    }

    next();
  };
};
