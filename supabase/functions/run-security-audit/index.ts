import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

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
    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization header is required" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Extract the token
    const token = authHeader.split(" ")[1];
    if (!token) {
      return new Response(
        JSON.stringify({ error: "Bearer token is required" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    // Get the user from the token
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Get user's role from the database
    const { data: userRecord, error: roleError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (roleError || !userRecord) {
      return new Response(
        JSON.stringify({ error: "User not found in database" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Check if user is an admin
    if (userRecord.role !== "admin") {
      return new Response(
        JSON.stringify({ error: "Insufficient permissions" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Parse request body
    const { auditType = "manual" } = await req.json();

    // Create a new security audit record
    const { data: auditRecord, error: auditError } = await supabase
      .from("security_audits")
      .insert([
        {
          triggered_by: user.id,
          status: "in_progress",
          started_at: new Date().toISOString(),
          audit_type: auditType,
        },
      ])
      .select()
      .single();

    if (auditError) {
      return new Response(
        JSON.stringify({ error: "Failed to create audit record" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Simulate running security checks
    // In a real implementation, you would perform actual security checks here
    // or trigger a background job to run the checks

    // For demonstration purposes, we'll just update the audit record after a delay
    setTimeout(async () => {
      try {
        // Generate some mock findings
        const mockFindings = {
          vulnerabilities: [
            {
              type: "dependency",
              severity: "high",
              component: "@some-package/with-vulnerability",
              description:
                "Outdated dependency with known security vulnerabilities",
            },
            {
              type: "code",
              severity: "medium",
              component: "src/lib/auth.service.ts",
              description: "Potential insecure authentication implementation",
            },
          ],
          securityScore: 85,
          passedChecks: 42,
          failedChecks: 3,
          recommendations: [
            "Update dependencies with known vulnerabilities",
            "Implement Content Security Policy headers",
            "Enable HTTP Strict Transport Security",
          ],
        };

        // Update the audit record with the findings
        await supabase
          .from("security_audits")
          .update({
            status: "completed",
            completed_at: new Date().toISOString(),
            findings: mockFindings,
          })
          .eq("id", auditRecord.id);

        // Insert vulnerability reports
        for (const vuln of mockFindings.vulnerabilities) {
          await supabase.from("vulnerability_reports").insert([
            {
              audit_id: auditRecord.id,
              vulnerability_type: vuln.type,
              severity: vuln.severity,
              affected_component: vuln.component,
              description: vuln.description,
              remediation_steps:
                "Update to the latest version or implement recommended security controls",
              status: "open",
            },
          ]);
        }
      } catch (error) {
        console.error("Error updating audit record:", error);
      }
    }, 5000); // Simulate a 5-second audit process

    // Return the audit record ID
    return new Response(
      JSON.stringify({
        message: "Security audit initiated",
        auditId: auditRecord.id,
        status: "in_progress",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error running security audit:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
