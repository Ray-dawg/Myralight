import { io, Socket } from "socket.io-client";

export class WebSocketService {
  private static instance: WebSocketService;
  private socket: Socket | null = null;
  private messageListeners: Map<string, Function[]> = new Map();

  private constructor() {
    this.initializeSocket();
  }

  public static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  private initializeSocket() {
    const wsUrl =
      import.meta.env.VITE_CONVEX_URL ||
      "https://unique-trout-650.convex.cloud";

    this.socket = io(wsUrl, {
      transports: ["websocket", "polling"],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    if (!this.socket) return;

    this.socket.on("connect", () => {
      console.log("Connected to WebSocket server");
    });

    this.socket.on("disconnect", () => {
      console.log("Disconnected from WebSocket server");
    });

    this.socket.on("error", (error) => {
      console.error("WebSocket error:", error);
    });
  }

  public emit(event: string, data: any) {
    if (this.socket) {
      this.socket.emit(event, data);
    }
  }

  public onMessageReceived(callback: (message: any) => void): void {
    if (this.socket) {
      this.socket.on("message", callback);
    }
  }

  public sendMessage(event: string, data: any): void {
    if (this.socket) {
      this.socket.emit(event, data);
    }
  }

  public subscribeToLoad(loadId: string): void {
    if (this.socket) {
      this.socket.emit("subscribe:load", loadId);
    }
  }

  public unsubscribeFromLoad(loadId: string): void {
    if (this.socket) {
      this.socket.emit("unsubscribe:load", loadId);
    }
  }
}

// Export a singleton instance
export const wsService = WebSocketService.getInstance();
