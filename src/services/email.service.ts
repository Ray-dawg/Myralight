import { logger } from "@/api/utils/logger";

// Import the appropriate implementation based on environment
let EmailServiceImpl: any;

// Check if we're in a Node.js environment
if (typeof window === "undefined") {
  // Server-side (Node.js)
  import("./email.service.node").then((module) => {
    EmailServiceImpl = module.EmailService;
  });
} else {
  // Client-side (browser)
  import("./email.service.mock").then((module) => {
    EmailServiceImpl = module.EmailService;
  });
}

/**
 * Service for sending emails
 * This is a facade that uses either the real nodemailer implementation
 * in Node.js or a mock implementation in the browser
 */
export class EmailService {
  private implementation: any;

  /**
   * Create a new EmailService instance
   * @param config SMTP configuration
   */
  constructor(config: any) {
    // For browser environments, use the mock implementation
    if (typeof window !== "undefined") {
      import("./email.service.mock").then((module) => {
        this.implementation = new module.EmailService(config);
      });
    } else {
      // For Node.js environments, use the real implementation
      import("./email.service.node").then((module) => {
        this.implementation = new module.EmailService(config);
      });
    }

    // Create a temporary mock implementation until the dynamic import resolves
    this.implementation = {
      verifyConnection: async () => {
        logger.info("Email service not fully initialized yet");
        return false;
      },
      sendMail: async () => {
        logger.info("Email service not fully initialized yet");
        throw new Error("Email service not fully initialized yet");
      },
      sendTestEmail: async () => {
        logger.info("Email service not fully initialized yet");
        throw new Error("Email service not fully initialized yet");
      },
    };
  }

  /**
   * Verify SMTP connection
   * @returns Promise resolving to true if connection is successful
   */
  async verifyConnection(): Promise<boolean> {
    return this.implementation.verifyConnection();
  }

  /**
   * Send an email
   * @param options Email options (from, to, subject, text, html, attachments)
   * @returns Promise resolving to the message info
   */
  async sendMail(options: any): Promise<any> {
    return this.implementation.sendMail(options);
  }

  /**
   * Send a test email
   * @param to Recipient email address
   * @param from Sender email address
   * @returns Promise resolving to the message info
   */
  async sendTestEmail(to: string, from: string): Promise<any> {
    return this.implementation.sendTestEmail(to, from);
  }
}
