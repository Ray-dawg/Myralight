import { logger } from "@/api/utils/logger";
import { chatCreationService } from "@/services/chat.service";

// Event types
export type LoadAssignedEvent = {
  loadId: string;
  shipperId: string;
  carrierId: string;
  driverId: string;
};

// Event handlers
export const handleLoadAssigned = async (event: LoadAssignedEvent) => {
  try {
    logger.info(`Load assigned event received for load ${event.loadId}`);

    // Create a chat for the load
    const chatSession = await chatCreationService.createChatForLoad(
      event.loadId,
      event.shipperId,
      event.carrierId,
      event.driverId,
    );

    if (chatSession) {
      logger.info(`Chat created successfully for load ${event.loadId}`);
      return true;
    } else {
      logger.error(`Failed to create chat for load ${event.loadId}`);
      return false;
    }
  } catch (error) {
    logger.error(
      `Error handling load assigned event for load ${event.loadId}:`,
      error,
    );
    return false;
  }
};

// Event emitter
type EventHandler<T> = (event: T) => Promise<boolean>;
type EventMap = {
  "load:assigned": EventHandler<LoadAssignedEvent>;
};

class EventEmitter {
  private handlers: Partial<{
    [K in keyof EventMap]: EventHandler<any>[];
  }> = {};

  on<K extends keyof EventMap>(event: K, handler: EventMap[K]) {
    if (!this.handlers[event]) {
      this.handlers[event] = [];
    }
    this.handlers[event]!.push(handler);
  }

  async emit<K extends keyof EventMap>(
    event: K,
    data: Parameters<EventMap[K]>[0],
  ) {
    const handlers = this.handlers[event] || [];
    const results = await Promise.allSettled(
      handlers.map((handler) => handler(data)),
    );

    // Log any rejected promises
    results.forEach((result, index) => {
      if (result.status === "rejected") {
        logger.error(
          `Handler ${index} for event ${String(event)} failed:`,
          result.reason,
        );
      }
    });

    return results.every(
      (result) => result.status === "fulfilled" && result.value === true,
    );
  }
}

// Create and export a singleton instance
export const eventEmitter = new EventEmitter();

// Register event handlers
eventEmitter.on("load:assigned", handleLoadAssigned);
