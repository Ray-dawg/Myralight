import { Request, Response, NextFunction } from "express";
import { createClient } from "@supabase/supabase-js";
import { logger } from "../utils/logger";

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseKey) {
  logger.error("Supabase URL or key not found in environment variables");
  throw new Error("Supabase configuration missing");
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Authentication middleware
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // Get the authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res
        .status(401)
        .json({ error: "Authorization header is required" });
    }

    // Extract the token
    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "Bearer token is required" });
    }

    // Verify the token with Supabase
    const {
      data: { user, session },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    // Check if token is in revoked tokens list
    const { data: revokedToken, error: revokedTokenError } = await supabase
      .from("revoked_tokens")
      .select("token_id")
      .eq("token_id", session?.access_token || token)
      .single();

    if (!revokedTokenError && revokedToken) {
      return res.status(401).json({ error: "Token has been revoked" });
    }

    // Check for session hijacking (IP pinning)
    const clientIp =
      req.ip ||
      (req.headers["x-forwarded-for"] as string) ||
      req.socket.remoteAddress;
    const userAgent = req.headers["user-agent"] || "";

    // Get session security data
    const { data: sessionSecurity, error: sessionSecurityError } =
      await supabase
        .from("session_security")
        .select("ip_address, user_agent")
        .eq("session_id", session?.id || "")
        .single();

    // If session security data exists, verify IP and user agent
    if (!sessionSecurityError && sessionSecurity) {
      // Check IP if IP pinning is enabled
      if (
        sessionSecurity.ip_address &&
        sessionSecurity.ip_address !== clientIp
      ) {
        // Log potential session hijacking attempt
        logger.warn(
          `Potential session hijacking: IP mismatch for user ${user.id}. Expected ${sessionSecurity.ip_address}, got ${clientIp}`,
        );

        // Revoke the token
        await supabase.from("revoked_tokens").insert([
          {
            token_id: session?.access_token || token,
            revoked_at: new Date().toISOString(),
          },
        ]);

        return res.status(403).json({
          error: "Session IP mismatch detected. Please log in again.",
        });
      }

      // Check user agent if enabled
      if (
        sessionSecurity.user_agent &&
        !userAgent.includes(sessionSecurity.user_agent.substring(0, 50))
      ) {
        // Log potential session hijacking attempt
        logger.warn(
          `Potential session hijacking: User agent mismatch for user ${user.id}`,
        );

        // Revoke the token
        await supabase.from("revoked_tokens").insert([
          {
            token_id: session?.access_token || token,
            revoked_at: new Date().toISOString(),
          },
        ]);

        return res.status(403).json({
          error: "Session device mismatch detected. Please log in again.",
        });
      }
    } else if (session) {
      // If no session security data exists yet, create it
      await supabase.from("session_security").insert([
        {
          session_id: session.id,
          user_id: user.id,
          ip_address: clientIp,
          user_agent: userAgent.substring(0, 255), // Limit length for storage
          created_at: new Date().toISOString(),
        },
      ]);
    }

    // Check if account is locked
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("account_locked, account_locked_until")
      .eq("id", user.id)
      .single();

    if (!profileError && profile && profile.account_locked) {
      // Check if lockout period has expired
      if (
        profile.account_locked_until &&
        new Date(profile.account_locked_until) > new Date()
      ) {
        return res.status(403).json({
          error:
            "Account is temporarily locked due to multiple failed login attempts",
          lockedUntil: profile.account_locked_until,
        });
      } else {
        // Lockout period has expired, unlock the account
        await supabase
          .from("profiles")
          .update({
            account_locked: false,
            account_locked_until: null,
            failed_login_attempts: 0,
          })
          .eq("id", user.id);
      }
    }

    // Add user to request object
    (req as any).user = user;
    (req as any).session = session;

    // Continue to the next middleware or route handler
    next();
  } catch (error) {
    logger.error("Authentication error:", error);
    return res.status(500).json({ error: "Authentication failed" });
  }
};

/**
 * Role-based authorization middleware
 */
export const authorize = (allowedRoles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Get the user from the request (set by authenticate middleware)
      const user = (req as any).user;
      if (!user) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      // Get user's role from the database
      const { data: userRecord, error } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();

      if (error || !userRecord) {
        return res.status(403).json({ error: "User not found in database" });
      }

      // Check if user's role is allowed
      if (!allowedRoles.includes(userRecord.role)) {
        return res.status(403).json({ error: "Insufficient permissions" });
      }

      // Add role to request object
      (req as any).userRole = userRecord.role;

      // Continue to the next middleware or route handler
      next();
    } catch (error) {
      logger.error("Authorization error:", error);
      return res.status(500).json({ error: "Authorization failed" });
    }
  };
};

/**
 * Admin panel IP whitelist middleware
 */
export const adminIpWhitelist = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // Get client IP address
    const clientIp =
      req.ip ||
      (req.headers["x-forwarded-for"] as string) ||
      req.socket.remoteAddress ||
      "unknown";

    // Clean up IP address (handle potential comma-separated list from proxies)
    const ip = clientIp.split(",")[0].trim();

    // Check if IP is in whitelist
    const { data, error } = await supabase
      .from("admin_ip_whitelist")
      .select("ip_address")
      .eq("ip_address", ip)
      .single();

    if (error || !data) {
      logger.warn(`Admin access attempt from non-whitelisted IP: ${ip}`);
      return res.status(403).json({
        error:
          "Access denied: Your IP address is not authorized to access the admin panel",
      });
    }

    // IP is whitelisted, continue
    next();
  } catch (error) {
    logger.error("IP whitelist check error:", error);
    return res.status(500).json({ error: "IP verification failed" });
  }
};
