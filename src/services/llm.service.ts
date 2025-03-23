/**
 * LLM Service
 *
 * This service handles interactions with the LLM for generating content
 * such as notifications, ETA predictions, and other natural language outputs.
 */

import { logger } from "@/api/utils/logger";

// Define response structure for LLM calls
export interface LLMResponse {
  text: string;
  tokenUsage: number;
  latency: number;
  metadata?: Record<string, any>;
}

/**
 * LLM Service for handling interactions with language models
 */
export class LLMService {
  private static instance: LLMService;
  private apiKey: string;
  private apiEndpoint: string;
  private modelName: string;

  private constructor() {
    // Initialize with default values or from environment
    this.apiKey = process.env.LLM_API_KEY || "";
    this.apiEndpoint =
      process.env.LLM_API_ENDPOINT ||
      "https://api.openai.com/v1/chat/completions";
    this.modelName = process.env.LLM_MODEL_NAME || "gpt-4o";
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): LLMService {
    if (!LLMService.instance) {
      LLMService.instance = new LLMService();
    }
    return LLMService.instance;
  }

  /**
   * Configure the LLM service
   */
  public configure(config: {
    apiKey?: string;
    apiEndpoint?: string;
    modelName?: string;
  }): void {
    if (config.apiKey) this.apiKey = config.apiKey;
    if (config.apiEndpoint) this.apiEndpoint = config.apiEndpoint;
    if (config.modelName) this.modelName = config.modelName;
  }

  /**
   * Generate content using the LLM
   */
  public async generateContent(prompt: string): Promise<LLMResponse> {
    try {
      const startTime = Date.now();

      // In a real implementation, this would call the LLM API
      // For now, we'll simulate a response
      const response = await this.simulateLLMResponse(prompt);

      const endTime = Date.now();
      const latency = endTime - startTime;

      return {
        text: response.text,
        tokenUsage: response.tokenUsage,
        latency,
        metadata: response.metadata,
      };
    } catch (error) {
      logger.error(`Error generating content with LLM: ${error}`);
      throw error;
    }
  }

  /**
   * Parse structured data from LLM response
   */
  public parseStructuredResponse(
    response: string,
    format: string,
  ): Record<string, any> {
    try {
      // This is a simplified parser that extracts key-value pairs from the response
      // In a real implementation, this would be more robust
      const result: Record<string, any> = {};

      if (format === "notification") {
        // Parse notification format
        const titleMatch = response.match(/TITLE:\s*(.+)/);
        const bodyMatch = response.match(/BODY:\s*(.+)/);
        const urgencyMatch = response.match(/URGENCY:\s*(.+)/);
        const actionMatch = response.match(/ACTION BUTTON:\s*(.+)/);

        if (titleMatch) result.title = titleMatch[1].trim();
        if (bodyMatch) result.body = bodyMatch[1].trim();
        if (urgencyMatch) result.urgency = urgencyMatch[1].trim().toLowerCase();
        if (actionMatch) result.action = actionMatch[1].trim();

        return result;
      }

      if (format === "sms") {
        // Parse SMS format
        const messageMatch = response.match(/MESSAGE:\s*(.+)/s);
        const urgencyMatch = response.match(/URGENCY:\s*(.+)/);

        if (messageMatch) result.message = messageMatch[1].trim();
        if (urgencyMatch) result.urgency = urgencyMatch[1].trim().toLowerCase();

        return result;
      }

      if (format === "email") {
        // Parse email format
        const subjectMatch = response.match(/SUBJECT:\s*(.+)/);
        const greetingMatch = response.match(/GREETING:\s*(.+)/);
        const bodyMatch = response.match(/BODY:\s*([\s\S]*?)\nCALL TO ACTION:/);
        const ctaMatch = response.match(/CALL TO ACTION:\s*(.+)/);
        const closingMatch = response.match(/CLOSING:\s*(.+)/);
        const urgencyMatch = response.match(/URGENCY:\s*(.+)/);

        if (subjectMatch) result.subject = subjectMatch[1].trim();
        if (greetingMatch) result.greeting = greetingMatch[1].trim();
        if (bodyMatch) result.body = bodyMatch[1].trim();
        if (ctaMatch) result.callToAction = ctaMatch[1].trim();
        if (closingMatch) result.closing = closingMatch[1].trim();
        if (urgencyMatch) result.urgency = urgencyMatch[1].trim().toLowerCase();

        return result;
      }

      if (format === "push") {
        // Parse push notification format
        const titleMatch = response.match(/TITLE:\s*(.+)/);
        const bodyMatch = response.match(/BODY:\s*(.+)/);
        const urgencyMatch = response.match(/URGENCY:\s*(.+)/);
        const deepLinkMatch = response.match(/DEEP LINK:\s*(.+)/);

        if (titleMatch) result.title = titleMatch[1].trim();
        if (bodyMatch) result.body = bodyMatch[1].trim();
        if (urgencyMatch) result.urgency = urgencyMatch[1].trim().toLowerCase();
        if (deepLinkMatch) result.deepLink = deepLinkMatch[1].trim();

        return result;
      }

      if (format === "in_app") {
        // Parse in-app notification format
        const titleMatch = response.match(/TITLE:\s*(.+)/);
        const bodyMatch = response.match(/BODY:\s*(.+)/);
        const urgencyMatch = response.match(/URGENCY:\s*(.+)/);
        const actionMatch = response.match(/ACTION BUTTON:\s*(.+)/);

        if (titleMatch) result.title = titleMatch[1].trim();
        if (bodyMatch) result.body = bodyMatch[1].trim();
        if (urgencyMatch) result.urgency = urgencyMatch[1].trim().toLowerCase();
        if (actionMatch) result.action = actionMatch[1].trim();

        return result;
      }

      // Default parsing for other formats
      const lines = response.split("\n");
      for (const line of lines) {
        const parts = line.split(":");
        if (parts.length >= 2) {
          const key = parts[0].trim().toLowerCase();
          const value = parts.slice(1).join(":").trim();
          result[key] = value;
        }
      }

      return result;
    } catch (error) {
      logger.error(`Error parsing structured response: ${error}`);
      return {};
    }
  }

  /**
   * Simulate LLM response for development/testing
   * In production, this would be replaced with actual API calls
   */
  private async simulateLLMResponse(prompt: string): Promise<{
    text: string;
    tokenUsage: number;
    metadata?: Record<string, any>;
  }> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Estimate token usage based on prompt length
    const promptTokens = Math.ceil(prompt.length / 4);
    const responseTokens = Math.ceil(promptTokens * 0.6);

    // Generate mock responses based on prompt content
    let responseText = "";

    if (prompt.includes("eta_update") && prompt.includes("sms")) {
      responseText =
        "MESSAGE: TruckingSaaS: Load #12345 ETA updated to 3:45PM (30min later) due to traffic on I-95. No action needed. Track at app.truckingsaas.com/loads/12345\nURGENCY: Medium";
    } else if (prompt.includes("delay_alert") && prompt.includes("sms")) {
      responseText =
        "MESSAGE: TruckingSaaS ALERT: Load #12345 delayed 2hrs due to accident on I-95. New ETA 5:30PM. We'll update as situation changes. Questions? Call 555-123-4567\nURGENCY: High";
    } else if (prompt.includes("eta_update") && prompt.includes("in_app")) {
      responseText =
        "TITLE: ETA Updated: Load #12345\nBODY: Delivery now expected at 3:45 PM (30 minutes later) due to traffic conditions on I-95.\nURGENCY: Medium\nACTION BUTTON: View Tracking Details";
    } else if (prompt.includes("geofence_entry") && prompt.includes("in_app")) {
      responseText =
        "TITLE: Arrived at Delivery Location\nBODY: Your driver has arrived at ABC Distribution Center (2:15 PM).\nURGENCY: Medium\nACTION BUTTON: View Delivery Details";
    } else if (prompt.includes("weather_alert") && prompt.includes("push")) {
      responseText =
        "TITLE: Weather Alert: Heavy Snow Ahead\nBODY: Snowfall expected on I-80. Reduce speed, maintain safe distance.\nURGENCY: High\nDEEP LINK: WeatherMapScreen";
    } else if (prompt.includes("email")) {
      responseText =
        "SUBJECT: Updated ETA for Load #12345 - Now 3:45 PM\nGREETING: Hello Shipping Team,\nBODY: The estimated time of arrival for your Load #12345 has been updated to 3:45 PM today, which is approximately 30 minutes later than previously scheduled.\n\nThis adjustment is due to heavier than usual traffic conditions on I-95 near Baltimore. Our system is continuously monitoring the situation, and we'll notify you of any further changes.\n\nYou can view real-time tracking information for this shipment on your dashboard.\nCALL TO ACTION: No immediate action is required from your team.\nCLOSING: Thank you for your understanding,\nThe TruckingSaaS Team\nURGENCY: Medium";
    } else {
      responseText =
        "TITLE: Generic Notification\nBODY: This is a simulated response for development purposes.\nURGENCY: Medium\nACTION BUTTON: Acknowledge";
    }

    return {
      text: responseText,
      tokenUsage: promptTokens + responseTokens,
      metadata: {
        model: this.modelName,
        promptTokens,
        responseTokens,
        totalTokens: promptTokens + responseTokens,
      },
    };
  }
}

// Export singleton instance
export const llmService = LLMService.getInstance();
