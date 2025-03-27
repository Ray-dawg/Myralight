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
    const { userId, role } = await req.json();

    if (!userId || !role) {
      return new Response(
        JSON.stringify({ error: "userId and role are required" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        },
      );
    }

    // Validate role
    const validRoles = ["admin", "driver", "carrier", "shipper"];
    if (!validRoles.includes(role)) {
      return new Response(JSON.stringify({ error: "Invalid role" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Fetch user permissions based on role
    const { data: permissions, error: permissionsError } = await supabaseAdmin
      .from("role_permissions")
      .select("permission")
      .eq("role", role);

    if (permissionsError) {
      console.error("Error fetching permissions:", permissionsError);
      // Continue without permissions if there's an error
    }

    // Extract permission strings from the result
    const permissionList = permissions
      ? permissions.map((p) => p.permission)
      : [];

    // Set custom claims for the user with short expiry for sensitive actions
    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      user_metadata: {
        role,
        permissions: permissionList,
        security: {
          tokenIssuedAt: new Date().toISOString(),
          sensitiveActionExpiry: new Date(
            Date.now() + 5 * 60 * 1000,
          ).toISOString(), // 5 minutes
        },
      },
    });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Custom claims set for user ${userId}`,
        role,
        permissions: permissionList,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
