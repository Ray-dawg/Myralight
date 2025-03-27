// Follow this setup guide to integrate the Deno runtime into your Supabase project:
// https://supabase.com/docs/guides/functions/deno-runtime

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Create a Supabase client with the Admin key
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      console.error("Missing Supabase credentials");
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

    const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Get the request body
    const { email, action, ip, isAdminRequest } = await req.json();

    if (!email || !action) {
      return new Response(
        JSON.stringify({ error: "email and action are required" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        },
      );
    }

    // Validate action
    const validActions = ["login", "register", "reset"];
    if (!validActions.includes(action)) {
      return new Response(JSON.stringify({ error: "Invalid action" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Check for account lockout if this is a login attempt
    if (action === "login") {
      // Get user profile to check if account is locked
      const { data: profile, error: profileError } = await supabaseAdmin
        .from("profiles")
        .select("account_locked, account_locked_until")
        .eq("email", email)
        .single();

      if (!profileError && profile) {
        // Check if account is locked
        if (profile.account_locked) {
          // Check if lockout period has expired
          if (
            profile.account_locked_until &&
            new Date(profile.account_locked_until) > new Date()
          ) {
            // Calculate remaining lockout time in seconds
            const remainingTime = Math.ceil(
              (new Date(profile.account_locked_until).getTime() -
                new Date().getTime()) /
                1000,
            );

            return new Response(
              JSON.stringify({
                limited: true,
                locked: true,
                message: `Account is temporarily locked due to multiple failed login attempts. Please try again later.`,
                remainingTime: remainingTime,
              }),
              {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
              },
            );
          } else {
            // Lockout period has expired, unlock the account
            await supabaseAdmin
              .from("profiles")
              .update({
                account_locked: false,
                account_locked_until: null,
                failed_login_attempts: 0,
              })
              .eq("email", email);
          }
        }
      }
    }

    // Check IP whitelist for admin access
    if (isAdminRequest && ip) {
      const { data: whitelistedIp, error: whitelistError } = await supabaseAdmin
        .from("admin_ip_whitelist")
        .select("ip_address")
        .eq("ip_address", ip)
        .single();

      if (whitelistError || !whitelistedIp) {
        console.warn(`Admin access attempt from non-whitelisted IP: ${ip}`);
        return new Response(
          JSON.stringify({
            limited: true,
            message:
              "Access denied: Your IP address is not authorized to access the admin panel.",
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 403,
          },
        );
      }
    }

    // Get rate limit configuration
    const maxAttempts = {
      login: 5,
      register: 3,
      reset: 3,
    };
    const timeWindow = 60 * 60; // 1 hour in seconds

    // Calculate the timestamp for the start of the time window
    const now = new Date();
    const timeWindowStart = new Date(
      now.getTime() - timeWindow * 1000,
    ).toISOString();

    // Count failed attempts within the time window
    const { count, error: countError } = await supabaseAdmin
      .from("auth_attempts")
      .select("*", { count: "exact", head: true })
      .eq("email", email)
      .eq("action", action)
      .eq("success", false)
      .gte("created_at", timeWindowStart);

    if (countError) {
      console.error("Error counting attempts:", countError);
      // If there's an error, allow the action to proceed
      return new Response(JSON.stringify({ limited: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Check if the user has exceeded the rate limit
    if (count && count >= maxAttempts[action]) {
      return new Response(
        JSON.stringify({
          limited: true,
          message: `Too many ${action} attempts. Please try again later.`,
          remainingTime: timeWindow, // Seconds until the rate limit resets
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        },
      );
    }

    // User has not exceeded the rate limit
    return new Response(JSON.stringify({ limited: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error checking rate limit:", error);
    // If there's an error, allow the action to proceed
    return new Response(
      JSON.stringify({ limited: false, error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  }
});
