/**
 * Authentication logging service
 * Provides structured logging for authentication events
 */

import { supabase } from "./supabase";
import { TABLES } from "../config/supabase.config";
import { UserRole } from "./auth.types";

// Ensure we have the auth_logs table in the TABLES config
// This is a safeguard in case the table name isn't defined
if (!TABLES.AUTH_LOGS) {
  console.warn(
    "AUTH_LOGS table not defined in supabase.config.ts, using 'auth_logs' as default",
  );
}

// Define log levels
export enum LogLevel {
  INFO = "info",
  WARNING = "warning",
  ERROR = "error",
  SECURITY = "security",
}

// Define auth event types
export enum AuthEventType {
  LOGIN_SUCCESS = "login_success",
  LOGIN_FAILURE = "login_failure",
  LOGOUT = "logout",
  REGISTER = "register",
  PASSWORD_RESET_REQUEST = "password_reset_request",
  PASSWORD_RESET_COMPLETE = "password_reset_complete",
  EMAIL_VERIFICATION = "email_verification",
  PROFILE_UPDATE = "profile_update",
  MFA_ENABLED = "mfa_enabled",
  MFA_DISABLED = "mfa_disabled",
  MFA_CHALLENGE_SUCCESS = "mfa_challenge_success",
  MFA_CHALLENGE_FAILURE = "mfa_challenge_failure",
  ACCOUNT_LOCKED = "account_locked",
  ACCOUNT_UNLOCKED = "account_unlocked",
  ROLE_CHANGED = "role_changed",
  SUSPICIOUS_ACTIVITY = "suspicious_activity",
  RATE_LIMIT_EXCEEDED = "rate_limit_exceeded",
  PERMISSION_CHANGED = "permission_changed",
  ACCESS_DENIED = "access_denied",
  UNUSUAL_LOCATION = "unusual_location",
  BRUTE_FORCE_DETECTED = "brute_force_detected",
  SESSION_HIJACKING_ATTEMPT = "session_hijacking_attempt",
  ACCOUNT_RECOVERY_ATTEMPT = "account_recovery_attempt",
}

// Interface for auth log entry
export interface AuthLogEntry {
  id?: string;
  event_type: AuthEventType;
  user_id?: string;
  email?: string;
  role?: UserRole;
  ip_address?: string;
  user_agent?: string;
  details?: Record<string, any>;
  level: LogLevel;
  created_at?: string;
}

/**
 * Logs an authentication event to the database
 * @param entry The log entry to record
 * @returns Promise resolving to success status
 */
export const logAuthEvent = async (entry: AuthLogEntry): Promise<boolean> => {
  try {
    // Add timestamp if not provided
    if (!entry.created_at) {
      entry.created_at = new Date().toISOString();
    }

    // Get client IP and user agent if available from browser
    if (
      typeof window !== "undefined" &&
      !entry.ip_address &&
      !entry.user_agent
    ) {
      // We can't get IP directly from client, but we can set user agent
      entry.user_agent = window.navigator.userAgent || "unknown";
      // IP will be captured server-side from request headers
    }

    // For security-related events, ensure they are properly tagged
    if (
      isSecurityEvent(entry.event_type) &&
      entry.level !== LogLevel.SECURITY
    ) {
      entry.level = LogLevel.SECURITY;
    }

    // Add additional context for security events
    if (entry.level === LogLevel.SECURITY) {
      // Enrich with additional data if not already present
      entry.details = {
        ...entry.details,
        timestamp: new Date().toISOString(),
        environment: import.meta.env.MODE || "production",
        securityEventId: generateSecurityEventId(),
        ...entry.details,
      };
    }

    // Insert log entry into the database
    const tableName = TABLES.AUTH_LOGS || "auth_logs";
    const { error } = await supabase.from(tableName).insert([entry]);

    if (error) {
      console.error("Error logging auth event:", error);
      // Fall back to console logging if database insert fails
      consoleLogAuthEvent(entry);
      return false;
    }

    // Also log to console in development environment
    if (import.meta.env.DEV) {
      consoleLogAuthEvent(entry);
    }

    return true;
  } catch (error) {
    console.error("Exception in logAuthEvent:", error);
    consoleLogAuthEvent(entry);
    return false;
  }
};

/**
 * Determines if an event type is security-related
 * @param eventType The event type to check
 * @returns Boolean indicating if it's a security event
 */
const isSecurityEvent = (eventType: AuthEventType): boolean => {
  const securityEvents = [
    AuthEventType.LOGIN_FAILURE,
    AuthEventType.ACCOUNT_LOCKED,
    AuthEventType.ACCOUNT_UNLOCKED,
    AuthEventType.ROLE_CHANGED,
    AuthEventType.SUSPICIOUS_ACTIVITY,
    AuthEventType.MFA_CHALLENGE_FAILURE,
    AuthEventType.RATE_LIMIT_EXCEEDED,
    AuthEventType.PERMISSION_CHANGED,
    AuthEventType.ACCESS_DENIED,
    AuthEventType.UNUSUAL_LOCATION,
    AuthEventType.BRUTE_FORCE_DETECTED,
    AuthEventType.SESSION_HIJACKING_ATTEMPT,
    AuthEventType.ACCOUNT_RECOVERY_ATTEMPT,
  ];

  return securityEvents.includes(eventType);
};

/**
 * Generates a unique ID for security events
 * @returns A unique security event ID
 */
const generateSecurityEventId = (): string => {
  return `sec-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
};

/**
 * Logs an authentication event to the console
 * @param entry The log entry to display
 */
const consoleLogAuthEvent = (entry: AuthLogEntry): void => {
  const timestamp = entry.created_at || new Date().toISOString();
  const userInfo = entry.user_id
    ? `User: ${entry.user_id}`
    : entry.email
      ? `Email: ${entry.email}`
      : "Anonymous";

  // Format based on log level
  switch (entry.level) {
    case LogLevel.ERROR:
      console.error(
        `[AUTH ERROR] [${timestamp}] ${entry.event_type} - ${userInfo}`,
        entry.details || "",
      );
      break;
    case LogLevel.WARNING:
      console.warn(
        `[AUTH WARNING] [${timestamp}] ${entry.event_type} - ${userInfo}`,
        entry.details || "",
      );
      break;
    case LogLevel.SECURITY:
      console.warn(
        `[AUTH SECURITY] [${timestamp}] ${entry.event_type} - ${userInfo}`,
        entry.details || "",
      );
      break;
    case LogLevel.INFO:
    default:
      console.info(
        `[AUTH INFO] [${timestamp}] ${entry.event_type} - ${userInfo}`,
        entry.details || "",
      );
      break;
  }
};

/**
 * Gets client information from request headers
 * @param headers Request headers
 * @returns Object with IP address, user agent, and other client information
 */
export const getClientInfo = (
  headers: Headers,
): { ip: string; userAgent: string; geoInfo?: any; deviceInfo?: any } => {
  const ip =
    headers.get("x-forwarded-for") || headers.get("x-real-ip") || "unknown";

  const userAgent = headers.get("user-agent") || "unknown";

  // Extract device information from user agent
  const deviceInfo = parseUserAgent(userAgent);

  // We don't actually do geo-lookup here as it would require external API calls
  // In a real implementation, you might use a geo-IP service
  const geoInfo = { source: "header-only" };

  return { ip, userAgent, geoInfo, deviceInfo };
};

/**
 * Parses user agent string to extract device information
 * @param userAgent The user agent string
 * @returns Object with device information
 */
const parseUserAgent = (userAgent: string): any => {
  // This is a simple implementation
  // In a real application, you might use a more sophisticated library
  const isMobile = /mobile|android|iphone|ipad|ipod/i.test(
    userAgent.toLowerCase(),
  );
  const isTablet = /tablet|ipad/i.test(userAgent.toLowerCase());
  const isDesktop = !isMobile && !isTablet;

  const browserInfo = {
    isChrome: /chrome/i.test(userAgent) && !/edge|opr\/|edg/i.test(userAgent),
    isFirefox: /firefox/i.test(userAgent),
    isSafari:
      /safari/i.test(userAgent) && !/chrome|edge|opr\/|edg/i.test(userAgent),
    isEdge: /edge|edg/i.test(userAgent),
    isOpera: /opr\//i.test(userAgent),
    isIE: /msie|trident/i.test(userAgent),
  };

  const osInfo = {
    isWindows: /windows/i.test(userAgent),
    isMac: /macintosh|mac os x/i.test(userAgent),
    isLinux: /linux/i.test(userAgent),
    isAndroid: /android/i.test(userAgent),
    isIOS: /iphone|ipad|ipod/i.test(userAgent),
  };

  return {
    deviceType: isMobile ? "mobile" : isTablet ? "tablet" : "desktop",
    browser:
      Object.keys(browserInfo).find(
        (key) => browserInfo[key as keyof typeof browserInfo],
      ) || "unknown",
    os:
      Object.keys(osInfo).find((key) => osInfo[key as keyof typeof osInfo]) ||
      "unknown",
    userAgentRaw: userAgent,
  };
};

/**
 * Retrieves recent auth logs for a specific user
 * @param userId User ID to retrieve logs for
 * @param limit Maximum number of logs to retrieve
 * @returns Promise resolving to array of log entries
 */
export const getUserAuthLogs = async (
  userId: string,
  limit: number = 10,
): Promise<AuthLogEntry[]> => {
  try {
    const tableName = TABLES.AUTH_LOGS || "auth_logs";
    const { data, error } = await supabase
      .from(tableName)
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error retrieving user auth logs:", error);
      return [];
    }

    return data as AuthLogEntry[];
  } catch (error) {
    console.error("Exception in getUserAuthLogs:", error);
    return [];
  }
};

/**
 * Retrieves security-related auth logs for monitoring
 * @param limit Maximum number of logs to retrieve
 * @returns Promise resolving to array of log entries
 */
export const getSecurityLogs = async (
  limit: number = 100,
): Promise<AuthLogEntry[]> => {
  try {
    const tableName = TABLES.AUTH_LOGS || "auth_logs";
    const { data, error } = await supabase
      .from(tableName)
      .select("*")
      .eq("level", LogLevel.SECURITY)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error retrieving security logs:", error);
      return [];
    }

    return data as AuthLogEntry[];
  } catch (error) {
    console.error("Exception in getSecurityLogs:", error);
    return [];
  }
};

/**
 * Analyzes auth logs for suspicious patterns
 * @param userId User ID to analyze logs for
 * @returns Promise resolving to analysis results
 */
export const analyzeUserAuthActivity = async (
  userId: string,
): Promise<{
  suspicious: boolean;
  details?: string;
  riskLevel?: "low" | "medium" | "high";
  securityEvents?: AuthLogEntry[];
}> => {
  try {
    // Get recent login attempts for the user
    const timeWindow = 24 * 60 * 60; // 24 hours in seconds
    const now = new Date();
    const timeWindowStart = new Date(
      now.getTime() - timeWindow * 1000,
    ).toISOString();

    const tableName = TABLES.AUTH_LOGS || "auth_logs";
    const { data, error } = await supabase
      .from(tableName)
      .select("*")
      .eq("user_id", userId)
      .gte("created_at", timeWindowStart)
      .or(
        `event_type.eq.${AuthEventType.LOGIN_SUCCESS},event_type.eq.${AuthEventType.LOGIN_FAILURE},event_type.eq.${AuthEventType.SUSPICIOUS_ACTIVITY},event_type.eq.${AuthEventType.UNUSUAL_LOCATION},event_type.eq.${AuthEventType.BRUTE_FORCE_DETECTED}`,
      );

    if (error) {
      console.error("Error analyzing user auth activity:", error);
      return { suspicious: false };
    }

    if (!data || data.length === 0) {
      return { suspicious: false };
    }

    // Count failed login attempts
    const failedAttempts = data.filter(
      (log) => log.event_type === AuthEventType.LOGIN_FAILURE,
    ).length;

    // Check for logins from multiple locations/devices
    const uniqueIPs = new Set(
      data
        .filter((log) => log.event_type === AuthEventType.LOGIN_SUCCESS)
        .map((log) => log.ip_address),
    );

    // Get all security-related events
    const securityEvents = data.filter(
      (log) => log.level === LogLevel.SECURITY,
    );

    // Check for unusual location logins
    const unusualLocationEvents = data.filter(
      (log) => log.event_type === AuthEventType.UNUSUAL_LOCATION,
    ).length;

    // Check for brute force detection events
    const bruteForceEvents = data.filter(
      (log) => log.event_type === AuthEventType.BRUTE_FORCE_DETECTED,
    ).length;

    // Determine if activity is suspicious
    let suspicious = false;
    let details = "";
    let riskLevel: "low" | "medium" | "high" = "low";

    // Calculate risk score based on various factors
    let riskScore = 0;

    if (failedAttempts >= 3 && failedAttempts < 5) {
      riskScore += 1;
      details += `Multiple failed login attempts (${failedAttempts}) in the last 24 hours. `;
    } else if (failedAttempts >= 5) {
      riskScore += 2;
      suspicious = true;
      details += `Multiple failed login attempts (${failedAttempts}) in the last 24 hours. `;
    }

    if (uniqueIPs.size >= 2 && uniqueIPs.size < 3) {
      riskScore += 1;
      details += `Logins from multiple IP addresses (${uniqueIPs.size}) in the last 24 hours. `;
    } else if (uniqueIPs.size >= 3) {
      riskScore += 2;
      suspicious = true;
      details += `Logins from multiple IP addresses (${uniqueIPs.size}) in the last 24 hours. `;
    }

    if (unusualLocationEvents > 0) {
      riskScore += 2;
      suspicious = true;
      details += `Unusual location login detected (${unusualLocationEvents} events). `;
    }

    if (bruteForceEvents > 0) {
      riskScore += 3;
      suspicious = true;
      details += `Brute force attack detected (${bruteForceEvents} events). `;
    }

    // Determine risk level based on risk score
    if (riskScore >= 4) {
      riskLevel = "high";
    } else if (riskScore >= 2) {
      riskLevel = "medium";
    }

    // If suspicious activity is detected, log it
    if (suspicious) {
      await logAuthEvent({
        event_type: AuthEventType.SUSPICIOUS_ACTIVITY,
        user_id: userId,
        level: LogLevel.SECURITY,
        details: {
          riskLevel,
          riskScore,
          failedAttempts,
          uniqueIPs: Array.from(uniqueIPs),
          unusualLocationEvents,
          bruteForceEvents,
          analysisTimestamp: new Date().toISOString(),
        },
      });
    }

    return {
      suspicious,
      details: details.trim(),
      riskLevel,
      securityEvents: securityEvents as AuthLogEntry[],
    };
  } catch (error) {
    console.error("Exception in analyzeUserAuthActivity:", error);
    return { suspicious: false };
  }
};
