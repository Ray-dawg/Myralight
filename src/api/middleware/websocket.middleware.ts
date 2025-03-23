import { WebSocketService } from "@/services/websocket.service";
import { createServer } from "http";
import { Express } from "express";

export function setupWebSocket(app: Express) {
  const server = createServer(app);
  const wsService = new WebSocketService(server);

  return server;
}
