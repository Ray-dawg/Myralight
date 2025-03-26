// Follow this setup guide to integrate the Deno runtime into your Supabase project:
// https://supabase.com/docs/guides/functions/deno-runtime

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Credentials": "true",
};

// Generate a random CSRF token
function generateCsrfToken(): string {
  const array = new Uint8Array(32); // 256 bits of randomness
  crypto.getRandomValues(array);
  return encode(array);
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Only allow GET requests for token generation
    if (req.method !== "GET") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 405,
      });
    }

    // Generate a new CSRF token
    const csrfToken = generateCsrfToken();

    // Set the token in a cookie that is HttpOnly, Secure, and SameSite=Strict
    const cookieOptions = [
      `csrf_token=${csrfToken}`,
      "Max-Age=3600", // 1 hour
      "Path=/",
      "HttpOnly",
      "SameSite=Strict",
    ];

    // Add Secure flag in production
    if (Deno.env.get("ENVIRONMENT") === "production") {
      cookieOptions.push("Secure");
    }

    // Return the CSRF token to the client
    return new Response(
      JSON.stringify({
        csrfToken: csrfToken,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "Set-Cookie": cookieOptions.join(";"),
        },
        status: 200,
      },
    );
  } catch (error) {
    console.error("Error generating CSRF token:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate security token" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      },
    );
  }
});
