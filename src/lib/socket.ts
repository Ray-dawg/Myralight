import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function initializeSocket() {
  if (socket) return socket;

  socket = io(window.location.origin, {
    path: "/socket.io",
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.on("connect", () => {
    console.log("Connected to WebSocket server");
  });

  socket.on("disconnect", () => {
    console.log("Disconnected from WebSocket server");
  });

  socket.on("error", (error) => {
    console.error("WebSocket error:", error);
  });

  return socket;
}

export function getSocket() {
  return socket;
}

export function closeSocket() {
  if (socket) {
    socket.close();
    socket = null;
  }
}
