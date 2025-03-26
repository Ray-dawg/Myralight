import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/use-toast";

interface EmailTemplate {
  id: string;
  template_type: string;
  subject: string;
  html_content: string;
  text_content: string;
  is_active: boolean;
  updated_at: string;
}

const templateTypeLabels: Record<string, string> = {
  verification: "Email Verification",
  reset_password: "Password Reset",
  magic_link: "Magic Link Login",
  welcome: "Welcome Email",
  mfa_enabled: "MFA Enabled",
  account_activity: "Account Activity",
};

const EmailTemplateEditor: React.FC = () => {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] =
    useState<EmailTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState<"html" | "text">("html");
  const [hasEditPermission, setHasEditPermission] = useState(false);

  // Form state
  const [subject, setSubject] = useState("");
  const [htmlContent, setHtmlContent] = useState("");
  const [textContent, setTextContent] = useState("");
  const [isActive, setIsActive] = useState(true);

  // Preview data for template variables
  const previewData = {
    verification_url: "https://example.com/verify?token=sample-token",
    reset_url: "https://example.com/reset-password?token=sample-token",
    magic_link_url: "https://example.com/auth/callback?token=sample-token",
    user_name: "John Doe",
    user_email: "john.doe@example.com",
    company_name: "Modern Trucking Platform",
    current_date: new Date().toLocaleDateString(),
    support_email: "support@example.com",
  };

  useEffect(() => {
    fetchTemplates();
    checkPermissions();
  }, [user]);

  const checkPermissions = async () => {
    if (!user) {
      setHasEditPermission(false);
      return;
    }

    try {
      // Get user profile to check role
      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error checking permissions:", error);
        setHasEditPermission(false);
        return;
      }

      // Only admin users can edit email templates
      setHasEditPermission(data?.role === "admin");
    } catch (error) {
      console.error("Error in checkPermissions:", error);
      setHasEditPermission(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("email_templates")
        .select("*")
        .order("template_type");

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error("Error fetching email templates:", error);
      toast({
        title: "Error",
        description: "Failed to load email templates",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateSelect = (templateType: string) => {
    const template =
      templates.find((t) => t.template_type === templateType) || null;
    setSelectedTemplate(template);

    if (template) {
      setSubject(template.subject);
      setHtmlContent(template.html_content);
      setTextContent(template.text_content);
      setIsActive(template.is_active);
    } else {
      resetForm();
    }
  };

  const resetForm = () => {
    setSubject("");
    setHtmlContent("");
    setTextContent("");
    setIsActive(true);
  };

  const saveTemplate = async () => {
    if (!selectedTemplate || !hasEditPermission) return;

    try {
      setSaving(true);

      const { error } = await supabase
        .from("email_templates")
        .update({
          subject,
          html_content: htmlContent,
          text_content: textContent,
          is_active: isActive,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedTemplate.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Email template updated successfully",
      });

      // Refresh templates
      await fetchTemplates();
    } catch (error) {
      console.error("Error saving email template:", error);
      toast({
        title: "Error",
        description: "Failed to save email template",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const renderPreview = () => {
    if (!selectedTemplate) return null;

    // Replace template variables with preview data
    let content = previewMode === "html" ? htmlContent : textContent;

    Object.entries(previewData).forEach(([key, value]) => {
      content = content.replace(new RegExp(`{{${key}}}`, "g"), value);
    });

    if (previewMode === "html") {
      return (
        <div className="border rounded-md p-4 bg-white">
          <div dangerouslySetInnerHTML={{ __html: content }} />
        </div>
      );
    } else {
      return (
        <pre className="border rounded-md p-4 bg-gray-50 whitespace-pre-wrap font-mono text-sm">
          {content}
        </pre>
      );
    }
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Email Template Editor</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Email Templates</CardTitle>
              <CardDescription>Select a template to edit</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="py-4 text-center">Loading templates...</div>
              ) : (
                <div className="space-y-2">
                  {templates.map((template) => (
                    <Button
                      key={template.id}
                      variant={
                        selectedTemplate?.id === template.id
                          ? "default"
                          : "outline"
                      }
                      className="w-full justify-start"
                      onClick={() =>
                        handleTemplateSelect(template.template_type)
                      }
                    >
                      {templateTypeLabels[template.template_type] ||
                        template.template_type}
                    </Button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          {selectedTemplate ? (
            <Card>
              <CardHeader>
                <CardTitle>
                  Edit{" "}
                  {templateTypeLabels[selectedTemplate.template_type] ||
                    selectedTemplate.template_type}{" "}
                  Template
                </CardTitle>
                <CardDescription>
                  Last updated:{" "}
                  {new Date(selectedTemplate.updated_at).toLocaleString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="editor" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="editor">Editor</TabsTrigger>
                    <TabsTrigger value="preview">Preview</TabsTrigger>
                  </TabsList>

                  <TabsContent value="editor" className="space-y-4">
                    {!hasEditPermission && (
                      <div
                        className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4"
                        role="alert"
                      >
                        <p className="font-bold">Read-Only Mode</p>
                        <p>
                          You don't have permission to edit email templates.
                          Only admin users can make changes.
                        </p>
                      </div>
                    )}
                    <div className="space-y-2">
                      <label htmlFor="subject" className="text-sm font-medium">
                        Subject
                      </label>
                      <Input
                        id="subject"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="Email subject"
                        disabled={!hasEditPermission}
                      />
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="html-content"
                        className="text-sm font-medium"
                      >
                        HTML Content
                      </label>
                      <Textarea
                        id="html-content"
                        value={htmlContent}
                        onChange={(e) => setHtmlContent(e.target.value)}
                        placeholder="HTML content"
                        className="min-h-[200px] font-mono"
                        disabled={!hasEditPermission}
                      />
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="text-content"
                        className="text-sm font-medium"
                      >
                        Text Content
                      </label>
                      <Textarea
                        id="text-content"
                        value={textContent}
                        onChange={(e) => setTextContent(e.target.value)}
                        placeholder="Plain text content"
                        className="min-h-[100px] font-mono"
                        disabled={!hasEditPermission}
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="is-active"
                        checked={isActive}
                        onChange={(e) => setIsActive(e.target.checked)}
                        className="rounded border-gray-300"
                        disabled={!hasEditPermission}
                      />
                      <label
                        htmlFor="is-active"
                        className="text-sm font-medium"
                      >
                        Active
                      </label>
                    </div>
                  </TabsContent>

                  <TabsContent value="preview">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium">Preview</h3>
                        <Select
                          value={previewMode}
                          onValueChange={(value) =>
                            setPreviewMode(value as "html" | "text")
                          }
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Preview mode" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="html">HTML</SelectItem>
                            <SelectItem value="text">Plain Text</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="border rounded-md">
                        <div className="border-b p-2 bg-gray-50">
                          <strong>Subject:</strong> {subject}
                        </div>
                        <div className="p-4">{renderPreview()}</div>
                      </div>

                      <div className="bg-gray-50 p-4 rounded-md">
                        <h4 className="text-sm font-medium mb-2">
                          Available Variables
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {Object.entries(previewData).map(([key]) => (
                            <code
                              key={key}
                              className="text-xs bg-gray-100 p-1 rounded"
                            >
                              {`{{${key}}}`}
                            </code>
                          ))}
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => setSelectedTemplate(null)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={saveTemplate}
                  disabled={saving || !hasEditPermission}
                  title={
                    !hasEditPermission
                      ? "You don't have permission to edit templates"
                      : ""
                  }
                >
                  {saving ? "Saving..." : "Save Template"}
                </Button>
              </CardFooter>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <h3 className="text-lg font-medium mb-2">
                    Select a template to edit
                  </h3>
                  <p className="text-gray-500">
                    Choose an email template from the list on the left
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailTemplateEditor;
