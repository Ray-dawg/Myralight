import { supabase } from "./supabase";
import { TABLES } from "../config/supabase.config";
import { logAuthEvent, LogLevel } from "./auth.logger";

/**
 * Interface for email sending parameters
 */
export interface EmailParams {
  to: string;
  templateType: string;
  subject?: string;
  variables?: Record<string, string | number | boolean>;
}

/**
 * Service for sending emails using customizable templates
 */
export const emailService = {
  /**
   * Sends an email using a template from the database
   * @param params Email parameters including recipient, template type, and variables
   * @returns Promise resolving to success status and optional error message
   */
  async sendTemplatedEmail(
    params: EmailParams,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { to, templateType, subject, variables } = params;

      // Call the Supabase Edge Function to send the email
      const { data, error } = await supabase.functions.invoke(
        "supabase-functions-send-custom-email",
        {
          body: {
            email: to,
            templateType,
            subject,
            variables: {
              ...variables,
              current_date: new Date().toLocaleDateString(),
            },
          },
        },
      );

      if (error) {
        console.error("Error sending email:", error);
        // Log the email sending failure
        await logAuthEvent({
          event_type: "email_send_failure",
          email: to,
          level: LogLevel.ERROR,
          details: { template_type: templateType, error: error.message },
        });
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error("Exception in sendTemplatedEmail:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown error sending email",
      };
    }
  },

  /**
   * Sends a verification email
   * @param email Recipient email address
   * @param verificationUrl URL for email verification
   * @returns Promise resolving to success status and optional error message
   */
  async sendVerificationEmail(
    email: string,
    verificationUrl: string,
  ): Promise<{ success: boolean; error?: string }> {
    return this.sendTemplatedEmail({
      to: email,
      templateType: "verification",
      variables: {
        verification_url: verificationUrl,
        user_email: email,
      },
    });
  },

  /**
   * Sends a password reset email
   * @param email Recipient email address
   * @param resetUrl URL for password reset
   * @returns Promise resolving to success status and optional error message
   */
  async sendPasswordResetEmail(
    email: string,
    resetUrl: string,
  ): Promise<{ success: boolean; error?: string }> {
    return this.sendTemplatedEmail({
      to: email,
      templateType: "reset_password",
      variables: {
        reset_url: resetUrl,
        user_email: email,
      },
    });
  },

  /**
   * Sends a magic link login email
   * @param email Recipient email address
   * @param magicLinkUrl URL for passwordless login
   * @returns Promise resolving to success status and optional error message
   */
  async sendMagicLinkEmail(
    email: string,
    magicLinkUrl: string,
  ): Promise<{ success: boolean; error?: string }> {
    return this.sendTemplatedEmail({
      to: email,
      templateType: "magic_link",
      variables: {
        magic_link_url: magicLinkUrl,
        user_email: email,
      },
    });
  },

  /**
   * Sends a welcome email after registration
   * @param email Recipient email address
   * @param name User's name
   * @returns Promise resolving to success status and optional error message
   */
  async sendWelcomeEmail(
    email: string,
    name?: string,
  ): Promise<{ success: boolean; error?: string }> {
    return this.sendTemplatedEmail({
      to: email,
      templateType: "welcome",
      variables: {
        user_name: name || email,
        user_email: email,
      },
    });
  },

  /**
   * Sends an MFA enabled confirmation email
   * @param email Recipient email address
   * @param name User's name
   * @returns Promise resolving to success status and optional error message
   */
  async sendMfaEnabledEmail(
    email: string,
    name?: string,
  ): Promise<{ success: boolean; error?: string }> {
    return this.sendTemplatedEmail({
      to: email,
      templateType: "mfa_enabled",
      variables: {
        user_name: name || email,
        user_email: email,
      },
    });
  },

  /**
   * Fetches all available email templates
   * @returns Promise resolving to array of templates
   */
  async getEmailTemplates(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from(TABLES.EMAIL_TEMPLATES)
        .select("*")
        .order("template_type");

      if (error) {
        console.error("Error fetching email templates:", error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error("Exception in getEmailTemplates:", error);
      return [];
    }
  },

  /**
   * Updates an email template
   * @param id Template ID
   * @param updates Template updates
   * @returns Promise resolving to success status and optional error message
   */
  async updateEmailTemplate(
    id: string,
    updates: {
      subject?: string;
      html_content?: string;
      text_content?: string;
      is_active?: boolean;
    },
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from(TABLES.EMAIL_TEMPLATES)
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) {
        console.error("Error updating email template:", error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error("Exception in updateEmailTemplate:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown error updating template",
      };
    }
  },
};
