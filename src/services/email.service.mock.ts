import { logger } from "@/api/utils/logger";

/**
 * Mock Service for sending emails in browser environment
 */
export class EmailService {
  private config: any;

  /**
   * Create a new EmailService instance
   * @param config SMTP configuration
   */
  constructor(config: any) {
    this.config = config;
    logger.info("Mock EmailService created with config:", config);
  }

  /**
   * Verify SMTP connection
   * @returns Promise resolving to true if connection is successful
   */
  async verifyConnection(): Promise<boolean> {
    logger.info("Mock SMTP connection verification");
    return true;
  }

  /**
   * Send an email
   * @param options Email options (from, to, subject, text, html, attachments)
   * @returns Promise resolving to the message info
   */
  async sendMail(options: any): Promise<any> {
    try {
      logger.info(`Mock email sent from ${options.from} to ${options.to}`);
      logger.info(`Subject: ${options.subject}`);
      logger.info(`Content: ${options.text || options.html}`);

      return {
        messageId: `mock-${Date.now()}@example.com`,
        envelope: {
          from: options.from,
          to: options.to,
        },
      };
    } catch (error) {
      logger.error("Error sending mock email:", error);
      throw error;
    }
  }

  /**
   * Send a test email
   * @param to Recipient email address
   * @param from Sender email address
   * @returns Promise resolving to the message info
   */
  async sendTestEmail(to: string, from: string): Promise<any> {
    const options = {
      from,
      to,
      subject: "SMTP Configuration Test",
      text: "This is a test email to verify your SMTP configuration.",
      html: "<h1>SMTP Test</h1><p>This is a test email to verify your SMTP configuration.</p>",
    };

    return this.sendMail(options);
  }
}
