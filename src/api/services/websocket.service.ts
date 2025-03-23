import { io } from "socket.io-client";
import { logger } from "../utils/logger";

export class WebSocketService {
  private static instance: WebSocketService;
  private io: any = null;
  private connectedClients: Map<string, string> = new Map(); // userId -> socketId

  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  /**
   * Connect to WebSocket server
   */
  public connect(): void {
    this.io = io(
      import.meta.env.VITE_CONVEX_URL ||
        "https://unique-trout-650.convex.cloud",
      {
        transports: ["websocket"],
        autoConnect: true,
      },
    );

    this.io.on("connect", () => {
      logger.info(`Connected to WebSocket server: ${this.io.id}`);
    });

    // Handle disconnection
    this.io.on("disconnect", () => {
      logger.info(`Disconnected from WebSocket server`);
    });

    // Setup event listeners
    this.setupEventListeners();
  }

  /**
   * Disconnect from WebSocket server
   */
  public disconnect(): void {
    if (this.io) {
      this.io.disconnect();
      this.io = null;
      logger.info("Disconnected from WebSocket server");
    }
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    // Listen for load status changes
    this.io.on("load:status_change", (data) => {
      logger.info(`Received load status change: ${JSON.stringify(data)}`);
      // Handle status change event
    });

    // Listen for load assignments
    this.io.on("load:assigned", (data) => {
      logger.info(`Received load assignment: ${JSON.stringify(data)}`);
      // Handle load assignment event
    });

    // Listen for driver location updates
    this.io.on("driver:location_update", (data) => {
      logger.info(`Received driver location update: ${JSON.stringify(data)}`);
      // Handle driver location update event
    });
  }

  /**
   * Listen for notifications
   */
  public onNotification(
    userId: string,
    callback: (notification: any) => void,
  ): void {
    if (!this.io) {
      logger.error("WebSocket not connected");
      return;
    }

    // Authenticate with the server
    this.io.emit("authenticate", { userId });

    // Listen for notifications
    this.io.on("notification", (notification: any) => {
      logger.info(
        `Received notification for user ${userId}: ${JSON.stringify(notification)}`,
      );
      callback(notification);
    });
  }

  /**
   * Listen for messages
   */
  public onMessageReceived(callback: (message: any) => void): void {
    if (!this.io) {
      logger.error("WebSocket not connected");
      return;
    }

    // Listen for messages
    this.io.on("message", (message: any) => {
      logger.info(`Received message: ${JSON.stringify(message)}`);
      callback(message);
    });
  }

  /**
   * Send a message to the server
   */
  public sendMessage(event: string, data: any): void {
    if (!this.io) {
      logger.error("WebSocket not connected");
      return;
    }

    this.io.emit(event, data);
    logger.info(`Sent message: ${event} with data: ${JSON.stringify(data)}`);
  }

  /**
   * Subscribe to a load
   */
  public subscribeToLoad(loadId: string): void {
    if (!this.io) {
      logger.error("WebSocket not connected");
      return;
    }

    this.io.emit("subscribe:load", loadId);
    logger.info(`Subscribed to load: ${loadId}`);
  }

  /**
   * Unsubscribe from a load
   */
  public unsubscribeFromLoad(loadId: string): void {
    if (!this.io) {
      logger.error("WebSocket not connected");
      return;
    }

    this.io.emit("unsubscribe:load", loadId);
    logger.info(`Unsubscribed from load: ${loadId}`);
  }

  /**
   * Notify about BOL upload
   */
  public notifyBolUpload(loadId: string, document: any): void {
    this.sendMessage("document:uploaded", {
      loadId,
      document,
      timestamp: new Date().toISOString(),
    });
  }
}
