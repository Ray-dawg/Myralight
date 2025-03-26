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
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );

    // Get the request body
    const { email, action } = await req.json();

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
