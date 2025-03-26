// Follow this setup guide to integrate the Deno runtime into your Supabase project:
// https://supabase.com/docs/guides/functions/deno-runtime

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Define log levels
enum LogLevel {
  INFO = "info",
  WARNING = "warning",
  ERROR = "error",
  SECURITY = "security",
}

// Define auth event types
enum AuthEventType {
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

// Parse user agent string to extract device information
const parseUserAgent = (userAgent: string): any => {
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

// Check if an IP address is suspicious (e.g., known VPN, proxy, or TOR exit node)
// This is a placeholder - in a real implementation, you would use a service or database
const isSuspiciousIP = async (ip: string): Promise<boolean> => {
  // Placeholder implementation
  // In a real application, you might check against a database or use a service
  const suspiciousIPs = ["127.0.0.1"]; // Example only - not actually suspicious
  return suspiciousIPs.includes(ip);
};

// Analyze authentication patterns for potential security issues
const analyzeAuthAttempt = async (
  supabaseAdmin: any,
  email: string,
  action: string,
  success: boolean,
  ip: string,
  userAgent: string,
): Promise<{ suspicious: boolean; reason?: string }> => {
  try {
    // Get recent auth attempts for this email
    const timeWindow = 1 * 60 * 60; // 1 hour in seconds
    const now = new Date();
    const timeWindowStart = new Date(
      now.getTime() - timeWindow * 1000,
    ).toISOString();

    const { data, error } = await supabaseAdmin
      .from("auth_attempts")
      .select("*")
      .eq("email", email)
      .gte("created_at", timeWindowStart);

    if (error) {
      console.error("Error analyzing auth attempts:", error);
      return { suspicious: false };
    }

    if (!data || data.length === 0) {
      return { suspicious: false };
    }

    // Count failed login attempts
    const failedAttempts = data.filter(
      (log: any) => log.action === "login" && !log.success,
    ).length;

    // Check for attempts from multiple locations/devices
    const uniqueIPs = new Set(data.map((log: any) => log.ip_address));

    // Determine if activity is suspicious
    let suspicious = false;
    let reason = "";

    // Check for brute force attempts
    if (action === "login" && !success && failedAttempts >= 5) {
      suspicious = true;
      reason += `Multiple failed login attempts (${failedAttempts}) in the last hour. `;
    }

    // Check for unusual location/device patterns
    if (uniqueIPs.size >= 3) {
      suspicious = true;
      reason += `Attempts from multiple IP addresses (${uniqueIPs.size}) in the last hour. `;
    }

    // Check if current IP is suspicious
    const ipSuspicious = await isSuspiciousIP(ip);
    if (ipSuspicious) {
      suspicious = true;
      reason += `Login attempt from suspicious IP address. `;
    }

    return { suspicious, reason: reason.trim() };
  } catch (error) {
    console.error("Exception in analyzeAuthAttempt:", error);
    return { suspicious: false };
  }
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Create a Supabase client with the Admin key
    // Use environment variables that are automatically available in Supabase Edge Functions
    const supabaseUrl =
      Deno.env.get("SUPABASE_URL") || Deno.env.get("VITE_SUPABASE_URL");
    const supabaseKey =
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ||
      Deno.env.get("SUPABASE_SERVICE_KEY") ||
      Deno.env.get("SUPABASE_ANON_KEY") ||
      Deno.env.get("VITE_SUPABASE_ANON_KEY");

    // Log available environment variables for debugging
    console.log("Available environment variables:", {
      SUPABASE_URL: !!Deno.env.get("SUPABASE_URL"),
      VITE_SUPABASE_URL: !!Deno.env.get("VITE_SUPABASE_URL"),
      SUPABASE_SERVICE_ROLE_KEY: !!Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
      SUPABASE_SERVICE_KEY: !!Deno.env.get("SUPABASE_SERVICE_KEY"),
      SUPABASE_ANON_KEY: !!Deno.env.get("SUPABASE_ANON_KEY"),
      VITE_SUPABASE_ANON_KEY: !!Deno.env.get("VITE_SUPABASE_ANON_KEY"),
    });

    // Use the variables directly without additional fallback logic
    const finalSupabaseUrl = supabaseUrl;
    const finalSupabaseKey = supabaseKey;

    if (!finalSupabaseUrl || !finalSupabaseKey) {
      console.error("Missing Supabase credentials", {
        supabaseUrl: !!finalSupabaseUrl,
        supabaseKey: !!finalSupabaseKey,
        envKeys: Object.keys(Deno.env.toObject()).filter(
          (key) => key.includes("SUPABASE") || key.includes("VITE_SUPABASE"),
        ),
      });
      return new Response(
        JSON.stringify({
          error: "Server configuration error - Supabase credentials not found",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        },
      );
    }

    const supabaseAdmin = createClient(finalSupabaseUrl, finalSupabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Get the request body
    const { email, action, success, userId, csrfToken } = await req.json();

    // Verify CSRF token if this is a login action
    if (action === "login") {
      // Get the CSRF token from the cookie
      const cookies = req.headers.get("cookie") || "";
      const cookieTokenMatch = cookies.match(/csrf_token=([^;]+)/);
      const cookieToken = cookieTokenMatch ? cookieTokenMatch[1] : null;

      // If no token in cookie or tokens don't match, reject the request
      if (!cookieToken || !csrfToken || cookieToken !== csrfToken) {
        console.error("CSRF token validation failed", {
          cookieToken: cookieToken ? "present" : "missing",
          requestToken: csrfToken ? "present" : "missing",
          match: cookieToken === csrfToken,
        });

        return new Response(
          JSON.stringify({
            error: "Invalid security token",
            success: false,
            securityEventId: `sec-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`,
            suspicious: true,
            reason: "CSRF token validation failed",
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 403,
          },
        );
      }
    }

    if (!email || !action || success === undefined) {
      return new Response(
        JSON.stringify({ error: "email, action, and success are required" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        },
      );
    }

    // Validate action
    const validActions = ["login", "register", "reset", "verify", "mfa"];
    if (!validActions.includes(action)) {
      return new Response(JSON.stringify({ error: "Invalid action" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Get client IP and user agent from request headers
    const ip =
      req.headers.get("x-forwarded-for") ||
      req.headers.get("x-real-ip") ||
      "unknown";
    const userAgent = req.headers.get("user-agent") || "unknown";

    // Parse device information from user agent
    const deviceInfo = parseUserAgent(userAgent);

    // Generate a security event ID
    const securityEventId = `sec-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;

    // Map action to AuthEventType
    let eventType: AuthEventType;
    if (action === "login") {
      eventType = success
        ? AuthEventType.LOGIN_SUCCESS
        : AuthEventType.LOGIN_FAILURE;
    } else if (action === "register") {
      eventType = AuthEventType.REGISTER;
    } else if (action === "reset") {
      eventType = AuthEventType.PASSWORD_RESET_REQUEST;
    } else if (action === "verify") {
      eventType = AuthEventType.EMAIL_VERIFICATION;
    } else if (action === "mfa") {
      eventType = success
        ? AuthEventType.MFA_CHALLENGE_SUCCESS
        : AuthEventType.MFA_CHALLENGE_FAILURE;
    } else {
      eventType = AuthEventType.SUSPICIOUS_ACTIVITY;
    }

    // Analyze the authentication attempt for suspicious patterns
    const analysis = await analyzeAuthAttempt(
      supabaseAdmin,
      email,
      action,
      success,
      ip,
      userAgent,
    );

    // Determine log level based on success and suspicion
    let logLevel = LogLevel.INFO;
    if (!success) {
      logLevel = LogLevel.WARNING;
    }
    if (analysis.suspicious) {
      logLevel = LogLevel.SECURITY;

      // If suspicious activity detected, log a separate security event
      await supabaseAdmin.from("auth_logs").insert([
        {
          event_type: AuthEventType.SUSPICIOUS_ACTIVITY,
          email,
          user_id: userId,
          ip_address: ip,
          user_agent: userAgent,
          level: LogLevel.SECURITY,
          details: {
            securityEventId,
            reason: analysis.reason,
            deviceInfo,
            action,
            originalEventType: eventType,
          },
          created_at: new Date().toISOString(),
        },
      ]);

      // If we detect a potential brute force attack, log it specifically
      if (
        action === "login" &&
        !success &&
        analysis.reason?.includes("Multiple failed login attempts")
      ) {
        await supabaseAdmin.from("auth_logs").insert([
          {
            event_type: AuthEventType.BRUTE_FORCE_DETECTED,
            email,
            user_id: userId,
            ip_address: ip,
            user_agent: userAgent,
            level: LogLevel.SECURITY,
            details: {
              securityEventId,
              deviceInfo,
              relatedTo: eventType,
            },
            created_at: new Date().toISOString(),
          },
        ]);
      }
    }

    // Record the authentication attempt in auth_attempts table
    const { error: attemptsError } = await supabaseAdmin
      .from("auth_attempts")
      .insert([
        {
          email,
          action,
          success,
          ip_address: ip,
          user_agent: userAgent,
          device_info: deviceInfo,
          security_event_id: securityEventId,
          suspicious: analysis.suspicious,
          created_at: new Date().toISOString(),
        },
      ]);

    if (attemptsError) {
      console.error("Error recording auth attempt:", attemptsError);
      return new Response(JSON.stringify({ error: attemptsError.message }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Also log to auth_logs table for comprehensive security logging
    const { error: logsError } = await supabaseAdmin.from("auth_logs").insert([
      {
        event_type: eventType,
        email,
        user_id: userId,
        ip_address: ip,
        user_agent: userAgent,
        level: logLevel,
        details: {
          securityEventId,
          action,
          success,
          deviceInfo,
          suspicious: analysis.suspicious,
          suspiciousReason: analysis.reason,
        },
        created_at: new Date().toISOString(),
      },
    ]);

    if (logsError) {
      console.error("Error logging auth event:", logsError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        securityEventId,
        suspicious: analysis.suspicious,
        reason: analysis.reason,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    console.error("Error recording auth attempt:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
