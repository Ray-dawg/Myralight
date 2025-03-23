import nodemailer from "nodemailer";
import { logger } from "@/api/utils/logger";

/**
 * Service for sending emails
 */
export class EmailService {
  private transporter: nodemailer.Transporter;

  /**
   * Create a new EmailService instance
   * @param config SMTP configuration
   */
  constructor(config: nodemailer.TransportOptions) {
    this.transporter = nodemailer.createTransport(config);
  }

  /**
   * Verify SMTP connection
   * @returns Promise resolving to true if connection is successful
   */
  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      logger.error("SMTP connection verification failed:", error);
      return false;
    }
  }

  /**
   * Send an email
   * @param options Email options (from, to, subject, text, html, attachments)
   * @returns Promise resolving to the message info
   */
  async sendMail(
    options: nodemailer.SendMailOptions,
  ): Promise<nodemailer.SentMessageInfo> {
    try {
      const info = await this.transporter.sendMail(options);
      logger.info(`Email sent: ${info.messageId}`);
      return info;
    } catch (error) {
      logger.error("Error sending email:", error);
      throw error;
    }
  }

  /**
   * Send a test email
   * @param to Recipient email address
   * @param from Sender email address
   * @returns Promise resolving to the message info
   */
  async sendTestEmail(
    to: string,
    from: string,
  ): Promise<nodemailer.SentMessageInfo> {
    const options: nodemailer.SendMailOptions = {
      from,
      to,
      subject: "SMTP Configuration Test",
      text: "This is a test email to verify your SMTP configuration.",
      html: "<h1>SMTP Test</h1><p>This is a test email to verify your SMTP configuration.</p>",
    };

    return this.sendMail(options);
  }
}
