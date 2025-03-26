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
      Deno.env.get("SUPABASE_SERVICE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );

    // Get the request body
    const { templateType, email, subject, variables, authToken } =
      await req.json();

    // Check authorization for template management if authToken is provided
    if (authToken) {
      const { data: userData, error: authError } =
        await supabaseAdmin.auth.getUser(authToken);

      if (authError || !userData?.user) {
        return new Response(JSON.stringify({ error: "Unauthorized access" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401,
        });
      }

      // Check if user has admin role
      const { data: profile, error: profileError } = await supabaseAdmin
        .from("profiles")
        .select("role")
        .eq("id", userData.user.id)
        .single();

      if (profileError || profile?.role !== "admin") {
        return new Response(
          JSON.stringify({ error: "Insufficient permissions" }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 403,
          },
        );
      }
    }

    if (!templateType || !email) {
      return new Response(
        JSON.stringify({ error: "templateType and email are required" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        },
      );
    }

    // Fetch the email template
    const { data: template, error: templateError } = await supabaseAdmin
      .from("email_templates")
      .select("*")
      .eq("template_type", templateType)
      .eq("is_active", true)
      .single();

    if (templateError || !template) {
      return new Response(
        JSON.stringify({ error: "Template not found or inactive" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 404,
        },
      );
    }

    // Replace variables in the template
    let htmlContent = template.html_content;
    let textContent = template.text_content;
    let emailSubject = subject || template.subject;

    if (variables) {
      Object.entries(variables).forEach(([key, value]) => {
        const regex = new RegExp(`{{${key}}}`, "g");
        htmlContent = htmlContent.replace(regex, String(value));
        textContent = textContent.replace(regex, String(value));
        emailSubject = emailSubject.replace(regex, String(value));
      });
    }

    // Send the email using Supabase's email service
    // Note: This requires email service to be configured in Supabase
    const { error: emailError } = await supabaseAdmin.auth.admin.sendEmail({
      email,
      subject: emailSubject,
      template_html: htmlContent,
      template_text: textContent,
    });

    if (emailError) {
      console.error("Error sending email:", emailError);
      return new Response(JSON.stringify({ error: emailError.message }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    // Extract client information from request headers
    const ip_address =
      req.headers.get("x-forwarded-for") ||
      req.headers.get("x-real-ip") ||
      "unknown";
    const user_agent = req.headers.get("user-agent") || "unknown";

    // Log the email sending event
    const { error: logError } = await supabaseAdmin.from("auth_logs").insert([
      {
        event_type: "email_sent",
        email,
        level: "info",
        ip_address,
        user_agent,
        details: {
          template_type: templateType,
          subject: emailSubject,
        },
        created_at: new Date().toISOString(),
      },
    ]);

    if (logError) {
      console.error("Error logging email event:", logError);
      // Non-critical error, continue
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Email sent to ${email}`,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    console.error("Error sending custom email:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
