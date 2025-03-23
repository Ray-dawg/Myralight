import { supabase } from "@/lib/supabase";
import { logger } from "@/api/utils/logger";
import { chatService, ChatMessage } from "@/lib/chat";
import { notificationService } from "./notification.service";

export interface AutomatedMessageTemplate {
  key: string;
  text: string;
  requiresAction?: boolean;
}

export interface MessageRecipient {
  id: string;
  role: "shipper" | "carrier" | "driver" | "admin";
  load_reference?: string;
}

export interface AutomatedMessageParams {
  recipient_id: string;
  load_id: string;
  message_type: string;
  template_data: Record<string, any>;
  sender_type?: "system";
}

export const automatedMessageService = {
  /**
   * Message templates for different notification types
   */
  templates: {
    // Load assignment templates
    load_assigned:
      "🚚 You have been assigned load #{{load_number}}. Pickup at {{pickup_location}} on {{pickup_date}}. Deliver to {{delivery_location}} by {{delivery_date}}. Cargo: {{cargo_details}}",
    load_assigned_to_driver:
      "📋 Driver {{driver_name}} has been assigned load #{{load_number}} for pickup on {{pickup_date}}",

    // Document templates
    document_uploaded:
      "📄 New document uploaded: {{document_type}} - {{document_name}} for load #{{load_number}} by {{uploader_name}}{{#if requires_action}} - ACTION REQUIRED{{/if}}",

    // Payment templates
    payment_issued:
      "💰 Payment of {{amount}} has been issued for load #{{load_number}} via {{payment_method}}. Reference: Invoice #{{invoice_number}}",
    payment_issued_to_driver:
      "💳 Driver {{driver_name}} has been paid {{amount}} for load #{{load_number}} (Invoice #{{invoice_number}})",

    // Status change templates
    shipment_status_picked_up:
      "🚚 Load #{{load_number}} has been picked up at {{location}} on {{timestamp}} by {{updated_by}}",
    shipment_status_in_transit:
      "🛣️ Load #{{load_number}} is now in transit. Updated at {{timestamp}} by {{updated_by}}",
    shipment_status_delivered:
      "✅ Load #{{load_number}} has been delivered to {{location}} on {{timestamp}} by {{updated_by}}",
    shipment_status_delayed:
      "⚠️ Alert: Load #{{load_number}} has been delayed. Updated at {{timestamp}} by {{updated_by}}",
  },

  /**
   * Handle load assignment event
   * @param eventData - Load assignment data
   */
  async handleLoadAssigned(eventData: any) {
    try {
      const { load_id, driver_id, carrier_id, load_details } = eventData;

      // Generate message for driver
      if (driver_id) {
        await this.sendAutomatedMessage({
          recipient_id: driver_id,
          load_id,
          message_type: "load_assigned",
          template_data: {
            load_number: load_details.reference_number,
            pickup_location: load_details.pickup_location,
            pickup_date: load_details.pickup_date,
            delivery_location: load_details.delivery_location,
            delivery_date: load_details.delivery_date,
            cargo_details: load_details.cargo_description,
          },
        });
      }

      // Generate message for carrier dispatchers
      if (carrier_id) {
        const { data: dispatchers } = await supabase
          .from("users")
          .select("*")
          .eq("carrier_id", carrier_id)
          .eq("role", "dispatcher");

        if (dispatchers && dispatchers.length > 0) {
          for (const dispatcher of dispatchers) {
            const { data: driverData } = await supabase
              .from("users")
              .select("first_name, last_name")
              .eq("id", driver_id)
              .single();

            const driverName = driverData
              ? `${driverData.first_name} ${driverData.last_name}`
              : "Assigned driver";

            await this.sendAutomatedMessage({
              recipient_id: dispatcher.id,
              load_id,
              message_type: "load_assigned_to_driver",
              template_data: {
                driver_name: driverName,
                load_number: load_details.reference_number,
                pickup_date: load_details.pickup_date,
              },
            });
          }
        }
      }

      logger.info(`Generated load assignment messages for load ${load_id}`);
    } catch (error) {
      logger.error("Failed to generate load assignment messages", {
        error,
        load_id: eventData.load_id,
      });
    }
  },

  /**
   * Handle document upload event
   * @param eventData - Document upload data
   */
  async handleDocumentUploaded(eventData: any) {
    try {
      const {
        document_id,
        document_type,
        uploader_id,
        load_id,
        document_name,
      } = eventData;

      // Determine recipients based on document type and load
      const recipients = await this.determineDocumentRecipients(
        document_type,
        load_id,
      );

      // Get uploader name
      const { data: uploaderData } = await supabase
        .from("users")
        .select("first_name, last_name")
        .eq("id", uploader_id)
        .single();

      const uploaderName = uploaderData
        ? `${uploaderData.first_name} ${uploaderData.last_name}`
        : "A user";

      // Get load reference number
      const loadRef = await this.getLoadReferenceNumber(load_id);

      // Send notification to each recipient
      for (const recipient of recipients) {
        await this.sendAutomatedMessage({
          recipient_id: recipient.id,
          load_id,
          message_type: "document_uploaded",
          template_data: {
            document_type: document_type,
            document_name: document_name,
            load_number: loadRef,
            uploader_name: uploaderName,
            requires_action: this.documentRequiresAction(
              document_type,
              recipient.role,
            ),
          },
        });
      }

      logger.info(
        `Generated document upload messages for document ${document_id}`,
      );
    } catch (error) {
      logger.error("Failed to generate document upload messages", {
        error,
        document_id: eventData.document_id,
      });
    }
  },

  /**
   * Handle shipment status change event
   * @param eventData - Shipment status data
   */
  async handleShipmentStatusChange(eventData: any) {
    try {
      const { load_id, new_status, updated_by_id, location, timestamp } =
        eventData;

      // Get all stakeholders for this load
      const stakeholders = await this.getLoadStakeholders(load_id);

      // Get updater name
      const { data: updaterData } = await supabase
        .from("users")
        .select("first_name, last_name")
        .eq("id", updated_by_id)
        .single();

      const updaterName = updaterData
        ? `${updaterData.first_name} ${updaterData.last_name}`
        : "A user";

      // Get load reference number
      const loadRef = await this.getLoadReferenceNumber(load_id);

      // Send appropriate messages based on status
      for (const stakeholder of stakeholders) {
        await this.sendAutomatedMessage({
          recipient_id: stakeholder.id,
          load_id,
          message_type: `shipment_status_${new_status.toLowerCase()}`,
          template_data: {
            load_number: loadRef,
            status: this.formatStatus(new_status),
            location: location || "N/A",
            timestamp: this.formatTimestamp(
              timestamp || new Date().toISOString(),
            ),
            updated_by: updaterName,
          },
        });
      }

      logger.info(
        `Generated status change messages for load ${load_id}, new status: ${new_status}`,
      );
    } catch (error) {
      logger.error("Failed to generate status change messages", {
        error,
        load_id: eventData.load_id,
      });
    }
  },

  /**
   * Handle payment issued event
   * @param eventData - Payment data
   */
  async handlePaymentIssued(eventData: any) {
    try {
      const {
        payment_id,
        amount,
        load_id,
        payee_id,
        payment_method,
        invoice_number,
      } = eventData;

      // Get load reference number
      const loadRef = await this.getLoadReferenceNumber(load_id);

      // Send notification to payee
      await this.sendAutomatedMessage({
        recipient_id: payee_id,
        load_id,
        message_type: "payment_issued",
        template_data: {
          amount: this.formatCurrency(amount),
          load_number: loadRef,
          payment_method: payment_method,
          invoice_number: invoice_number,
          payment_date: new Date().toISOString(),
        },
      });

      // Notify carrier admin if applicable
      const { data: payeeData } = await supabase
        .from("users")
        .select("carrier_id, first_name, last_name")
        .eq("id", payee_id)
        .single();

      if (payeeData?.carrier_id) {
        const { data: carrierAdmins } = await supabase
          .from("users")
          .select("id")
          .eq("carrier_id", payeeData.carrier_id)
          .eq("role", "admin");

        if (carrierAdmins && carrierAdmins.length > 0) {
          const payeeName = `${payeeData.first_name} ${payeeData.last_name}`;

          for (const admin of carrierAdmins) {
            await this.sendAutomatedMessage({
              recipient_id: admin.id,
              load_id,
              message_type: "payment_issued_to_driver",
              template_data: {
                driver_name: payeeName,
                amount: this.formatCurrency(amount),
                load_number: loadRef,
                invoice_number: invoice_number,
              },
            });
          }
        }
      }

      logger.info(
        `Generated payment notification messages for payment ${payment_id}`,
      );
    } catch (error) {
      logger.error("Failed to generate payment notification messages", {
        error,
        payment_id: eventData.payment_id,
      });
    }
  },

  /**
   * Send an automated message using message templates
   * @param params - Message parameters
   * @returns Promise<ChatMessage | null> - Message delivery info
   */
  async sendAutomatedMessage(
    params: AutomatedMessageParams,
  ): Promise<ChatMessage | null> {
    try {
      const {
        recipient_id,
        load_id,
        message_type,
        template_data,
        sender_type = "system",
      } = params;

      // Get message template
      const template = this.getMessageTemplate(message_type);

      // Apply template with data
      const messageText = this.applyTemplate(template, template_data);

      // Send message through chat service
      const message = await chatService.sendMessage({
        load_id,
        sender_id: "system",
        sender_type,
        message: messageText,
        chat_id: undefined, // Will be determined by the chat service
        attachments: [],
        read_by: [],
        status: "sending",
      });

      // Trigger notification for the message
      try {
        await notificationService.notifyNewMessage(message.id);
      } catch (notifyError) {
        logger.error(
          "Failed to send notification for automated message:",
          notifyError,
        );
      }

      return message;
    } catch (error) {
      logger.error("Failed to send automated message", { error, params });
      return null;
    }
  },

  /**
   * Get message template for a specific message type
   * @param messageType - Type of message
   * @returns string - Message template
   */
  getMessageTemplate(messageType: string): string {
    return (
      this.templates[messageType as keyof typeof this.templates] ||
      `Update for load: {{load_number}}`
    );
  },

  /**
   * Apply template with data using simple template engine
   * @param template - Message template
   * @param data - Template data
   * @returns string - Rendered message
   */
  applyTemplate(template: string, data: Record<string, any>): string {
    return template.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
      if (key.startsWith("#if ")) {
        // Handle conditional
        const condition = key.substring(4);
        return data[condition] ? "" : match;
      }

      return data[key] !== undefined ? String(data[key]) : "";
    });
  },

  /**
   * Format currency amount
   * @param amount - Amount to format
   * @returns string - Formatted currency
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  },

  /**
   * Format timestamp to readable date/time
   * @param timestamp - ISO timestamp
   * @returns string - Formatted date/time
   */
  formatTimestamp(timestamp: string): string {
    return new Date(timestamp).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    });
  },

  /**
   * Format status for display
   * @param status - Raw status
   * @returns string - Formatted status
   */
  formatStatus(status: string): string {
    const statusMap: Record<string, string> = {
      PICKED_UP: "Picked Up",
      IN_TRANSIT: "In Transit",
      DELIVERED: "Delivered",
      DELAYED: "Delayed",
    };

    return statusMap[status] || status;
  },

  /**
   * Determine if document requires action from recipient
   * @param documentType - Type of document
   * @param recipientRole - Role of recipient
   * @returns boolean - Whether action is required
   */
  documentRequiresAction(documentType: string, recipientRole: string): boolean {
    const actionMatrix: Record<string, Record<string, boolean>> = {
      BOL: { shipper: false, carrier: false, driver: false, admin: true },
      PROOF_OF_DELIVERY: {
        shipper: true,
        carrier: false,
        driver: false,
        admin: true,
      },
      RATE_CONFIRMATION: {
        shipper: false,
        carrier: true,
        driver: false,
        admin: false,
      },
      INVOICE: { shipper: true, carrier: false, driver: false, admin: true },
    };

    return (
      actionMatrix[documentType]?.[
        recipientRole as keyof (typeof actionMatrix)[typeof documentType]
      ] || false
    );
  },

  /**
   * Get all stakeholders for a load
   * @param loadId - Load ID
   * @returns Promise<MessageRecipient[]> - Array of stakeholders
   */
  async getLoadStakeholders(loadId: string): Promise<MessageRecipient[]> {
    try {
      // Get load details
      const { data: load } = await supabase
        .from("loads")
        .select("*, shipper:shipper_id(*), carrier:carrier_id(*)")
        .eq("id", loadId)
        .single();

      if (!load) {
        throw new Error(`Load not found: ${loadId}`);
      }

      // Get all involved parties
      const stakeholders: MessageRecipient[] = [];

      // Add driver
      if (load.driver_id) {
        stakeholders.push({
          id: load.driver_id,
          role: "driver",
          load_reference: load.reference_number,
        });
      }

      // Add carrier dispatchers and admins
      if (load.carrier_id) {
        const { data: carrierUsers } = await supabase
          .from("users")
          .select("id, role")
          .eq("carrier_id", load.carrier.id)
          .in("role", ["dispatcher", "admin"]);

        if (carrierUsers) {
          carrierUsers.forEach((user) => {
            stakeholders.push({
              id: user.id,
              role: "carrier",
              load_reference: load.reference_number,
            });
          });
        }
      }

      // Add shipper contacts
      if (load.shipper_id) {
        const { data: shipperUsers } = await supabase
          .from("users")
          .select("id")
          .eq("shipper_id", load.shipper.id);

        if (shipperUsers) {
          shipperUsers.forEach((user) => {
            stakeholders.push({
              id: user.id,
              role: "shipper",
              load_reference: load.reference_number,
            });
          });
        }
      }

      // Add platform admins
      const { data: admins } = await supabase
        .from("users")
        .select("id")
        .eq("role", "platform_admin");

      if (admins) {
        admins.forEach((admin) => {
          stakeholders.push({
            id: admin.id,
            role: "admin",
            load_reference: load.reference_number,
          });
        });
      }

      return stakeholders;
    } catch (error) {
      logger.error("Failed to get load stakeholders", { error, loadId });
      return [];
    }
  },

  /**
   * Determine recipients for document notifications
   * @param documentType - Type of document
   * @param loadId - Load ID
   * @returns Promise<MessageRecipient[]> - Array of recipients
   */
  async determineDocumentRecipients(
    documentType: string,
    loadId: string,
  ): Promise<MessageRecipient[]> {
    // Different documents need to notify different stakeholders
    const notificationMatrix: Record<string, string[]> = {
      BOL: ["driver", "carrier", "admin"],
      PROOF_OF_DELIVERY: ["shipper", "carrier", "admin"],
      RATE_CONFIRMATION: ["driver", "carrier", "shipper", "admin"],
      INVOICE: ["shipper", "admin"],
      INSPECTION: ["driver", "carrier", "admin"],
    };

    // Get roles that should be notified for this document type
    const rolesToNotify = notificationMatrix[documentType] || ["admin"];

    // Get all stakeholders for the load
    const allStakeholders = await this.getLoadStakeholders(loadId);

    // Filter stakeholders by role
    return allStakeholders.filter((stakeholder) =>
      rolesToNotify.includes(stakeholder.role),
    );
  },

  /**
   * Get load reference number
   * @param loadId - Load ID
   * @returns Promise<string> - Load reference number
   */
  async getLoadReferenceNumber(loadId: string): Promise<string> {
    try {
      const { data: load } = await supabase
        .from("loads")
        .select("reference_number")
        .eq("id", loadId)
        .single();

      return load?.reference_number || loadId;
    } catch (error) {
      logger.error("Failed to get load reference number", { error, loadId });
      return loadId;
    }
  },

  /**
   * Initialize event listeners for business events
   */
  setupEventListeners() {
    // This would connect to your event system
    // For example, if using an event emitter:
    /*
    eventEmitter.on('load:assigned', this.handleLoadAssigned.bind(this));
    eventEmitter.on('document:uploaded', this.handleDocumentUploaded.bind(this));
    eventEmitter.on('shipment:status_change', this.handleShipmentStatusChange.bind(this));
    eventEmitter.on('payment:issued', this.handlePaymentIssued.bind(this));
    */

    logger.info("Automated message service initialized with event listeners");
  },

  /**
   * Initialize the automated message service
   */
  init() {
    this.setupEventListeners();
    logger.info("Automated message service initialized");
    return this;
  },
};
