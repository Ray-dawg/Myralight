import { supabase } from "@/lib/supabase";
import { logger } from "@/api/utils/logger";

/**
 * Service for managing payment processor configurations
 */
export class PaymentProcessorService {
  /**
   * Get all payment processors
   */
  async getAllProcessors() {
    try {
      const { data, error } = await supabase
        .from("payment_processors")
        .select("*")
        .order("name");

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error("Error fetching payment processors:", error);
      throw error;
    }
  }

  /**
   * Get active payment processors
   */
  async getActiveProcessors() {
    try {
      const { data, error } = await supabase
        .from("payment_processors")
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error("Error fetching active payment processors:", error);
      throw error;
    }
  }

  /**
   * Get a payment processor by ID
   */
  async getProcessorById(id: string) {
    try {
      const { data, error } = await supabase
        .from("payment_processors")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error(`Error fetching payment processor ${id}:`, error);
      throw error;
    }
  }

  /**
   * Create a new payment processor
   */
  async createProcessor(processorData: any) {
    try {
      const { data, error } = await supabase
        .from("payment_processors")
        .insert([processorData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error("Error creating payment processor:", error);
      throw error;
    }
  }

  /**
   * Update a payment processor
   */
  async updateProcessor(id: string, processorData: any) {
    try {
      const { data, error } = await supabase
        .from("payment_processors")
        .update(processorData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error(`Error updating payment processor ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete a payment processor
   */
  async deleteProcessor(id: string) {
    try {
      const { error } = await supabase
        .from("payment_processors")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return true;
    } catch (error) {
      logger.error(`Error deleting payment processor ${id}:`, error);
      throw error;
    }
  }

  /**
   * Test a payment processor connection
   */
  async testProcessorConnection(id: string) {
    try {
      const processor = await this.getProcessorById(id);

      if (!processor) {
        throw new Error(`Payment processor ${id} not found`);
      }

      if (processor.processor_type === "EMAIL") {
        // For email processors, we need to test the email configuration
        if (
          !processor.email_addresses ||
          processor.email_addresses.length === 0
        ) {
          throw new Error("No recipient email addresses configured");
        }

        // We would need the email configuration to test
        return {
          success: true,
          message:
            "Email processor configuration looks valid. Use the Test Email button to send a test email.",
        };
      } else if (processor.processor_type === "API") {
        // For API processors, we can test the endpoint
        if (!processor.api_endpoint) {
          throw new Error("API endpoint is required");
        }

        // Send a test request to the API
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };

        if (processor.api_key) {
          headers["X-API-Key"] = processor.api_key;
        }

        const response = await fetch(`${processor.api_endpoint}/test`, {
          method: "GET",
          headers,
        });

        if (!response.ok) {
          throw new Error(
            `API test failed: ${response.status} ${response.statusText}`,
          );
        }

        return {
          success: true,
          message: "API connection test successful",
        };
      } else {
        throw new Error(
          `Unsupported processor type: ${processor.processor_type}`,
        );
      }
    } catch (error: any) {
      logger.error(`Error testing payment processor ${id}:`, error);
      return {
        success: false,
        message: error.message || "Test failed",
      };
    }
  }
}

// Export a singleton instance
export const paymentProcessorService = new PaymentProcessorService();
