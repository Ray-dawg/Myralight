import { logger } from "@/api/utils/logger";
import { EventTypes, listenToEvent } from "@/lib/events";
import { automatedMessageService } from "./automated-message.service";

/**
 * Service to handle business events and trigger appropriate actions
 */
export const eventHandlerService = {
  /**
   * Initialize event handlers
   */
  init() {
    this.setupEventListeners();
    logger.info("Event handler service initialized");
    return this;
  },

  /**
   * Set up event listeners for business events
   */
  setupEventListeners() {
    // Load events
    listenToEvent(EventTypes.LOAD_ASSIGNED, this.handleLoadAssigned);

    // Document events
    listenToEvent(EventTypes.DOCUMENT_UPLOADED, this.handleDocumentUploaded);

    // Shipment status events
    listenToEvent(
      EventTypes.SHIPMENT_STATUS_CHANGE,
      this.handleShipmentStatusChange,
    );

    // Payment events
    listenToEvent(EventTypes.PAYMENT_ISSUED, this.handlePaymentIssued);

    logger.info("Event listeners registered");
  },

  /**
   * Handle load assignment event
   * @param data Load assignment data
   */
  handleLoadAssigned(data: any) {
    logger.info("Load assigned event received", { loadId: data.load_id });
    automatedMessageService.handleLoadAssigned(data);
  },

  /**
   * Handle document upload event
   * @param data Document upload data
   */
  handleDocumentUploaded(data: any) {
    logger.info("Document uploaded event received", {
      documentId: data.document_id,
    });
    automatedMessageService.handleDocumentUploaded(data);
  },

  /**
   * Handle shipment status change event
   * @param data Shipment status data
   */
  handleShipmentStatusChange(data: any) {
    logger.info("Shipment status change event received", {
      loadId: data.load_id,
      newStatus: data.new_status,
    });
    automatedMessageService.handleShipmentStatusChange(data);
  },

  /**
   * Handle payment issued event
   * @param data Payment data
   */
  handlePaymentIssued(data: any) {
    logger.info("Payment issued event received", {
      paymentId: data.payment_id,
    });
    automatedMessageService.handlePaymentIssued(data);
  },
};
