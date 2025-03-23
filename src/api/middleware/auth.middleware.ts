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
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    // Add user to request object
    (req as any).user = user;

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
