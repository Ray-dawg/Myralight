import { io, Socket } from "socket.io-client";
import { logger } from "@/api/utils/logger";

let socket: Socket | null = null;

export function initializeWebSocket() {
  if (socket) return socket;

  const wsUrl =
    import.meta.env.VITE_CONVEX_URL || "https://unique-trout-650.convex.cloud";

  try {
    socket = io(wsUrl, {
      transports: ["websocket", "polling"],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on("connect", () => {
      logger.info(`Connected to WebSocket server: ${socket?.id}`);
    });

    socket.on("disconnect", () => {
      logger.info("Disconnected from WebSocket server");
    });

    socket.on("error", (error) => {
      logger.error("WebSocket error:", error);
    });

    setupEventListeners();
  } catch (error) {
    logger.error("Failed to initialize WebSocket:", error);
  }

  return socket;
}

function setupEventListeners() {
  if (!socket) return;

  socket.on("load:status_change", (data) => {
    logger.info(`Received load status change: ${JSON.stringify(data)}`);
    window.dispatchEvent(
      new CustomEvent("load:status_change", { detail: data }),
    );
  });

  socket.on("load:assigned", (data) => {
    logger.info(`Received load assignment: ${JSON.stringify(data)}`);
    window.dispatchEvent(new CustomEvent("load:assigned", { detail: data }));
  });

  socket.on("driver:location_update", (data) => {
    logger.info(`Received driver location update: ${JSON.stringify(data)}`);
    window.dispatchEvent(
      new CustomEvent("driver:location_update", { detail: data }),
    );
  });

  socket.on("geofence:entry", (data) => {
    logger.info(`Received geofence entry event: ${JSON.stringify(data)}`);
    window.dispatchEvent(new CustomEvent("geofence:entry", { detail: data }));
  });

  socket.on("geofence:exit", (data) => {
    logger.info(`Received geofence exit event: ${JSON.stringify(data)}`);
    window.dispatchEvent(new CustomEvent("geofence:exit", { detail: data }));
  });

  socket.on("document:uploaded", (data) => {
    logger.info(`Received document upload event: ${JSON.stringify(data)}`);
    window.dispatchEvent(
      new CustomEvent("document:uploaded", { detail: data }),
    );
  });
}

export function getWebSocket() {
  return socket || initializeWebSocket();
}

export function closeWebSocket() {
  if (socket) {
    socket.close();
    socket = null;
  }
}

export function sendMessage(event: string, data: any) {
  const ws = getWebSocket();
  if (!ws) {
    logger.error("WebSocket not connected");
    return;
  }

  ws.emit(event, data);
  logger.info(`Sent message: ${event} with data: ${JSON.stringify(data)}`);
}
