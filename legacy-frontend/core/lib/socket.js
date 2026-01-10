import { io } from "socket.io-client";

let socket = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY_BASE = 1000; // 1 second

export const initializeSocket = () => {
  if (socket) {
    return socket;
  }

  // Socket.IO connects to the ROOT server URL, not the /api path
  const socketUrl = import.meta.env.VITE_API_URL || "http://localhost:5002";
  console.log("🔌 [Socket.IO] Initializing connection to:", socketUrl);

  socket = io(socketUrl, {
    withCredentials: true, // Send cookies with the connection
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
    reconnectionDelay: RECONNECT_DELAY_BASE,
    reconnectionDelayMax: 5000,
    timeout: 10000,
  });

  // Connection event handlers
  socket.on("connect", () => {
    console.log("✅ [Socket.IO] Connected! Socket ID:", socket.id);
    reconnectAttempts = 0;
  });

  socket.on("disconnect", (reason) => {
    console.log("❌ [Socket.IO] Disconnected. Reason:", reason);
    if (reason === "io server disconnect") {
      // Server disconnected, manually reconnect
      socket.connect();
    }
  });

  socket.on("connect_error", (error) => {
    console.error("🔴 [Socket.IO] Connection error:", error.message);
    console.error("🔴 [Socket.IO] Error details:", error);
    reconnectAttempts++;

    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      console.error("❌ [Socket.IO] Max reconnection attempts reached");
      // You can emit a custom event here to show UI notification
      window.dispatchEvent(new CustomEvent("socket-connection-failed"));
    }
  });

  socket.on("reconnect", (attemptNumber) => {
    console.log("🔄 Socket reconnected after", attemptNumber, "attempts");
    reconnectAttempts = 0;
    // Rejoin all match rooms
    window.dispatchEvent(new CustomEvent("socket-reconnected"));
  });

  socket.on("reconnect_attempt", (attemptNumber) => {
    console.log("🔄 Reconnection attempt", attemptNumber);
  });

  socket.on("reconnect_error", (error) => {
    console.error("🔴 Reconnection error:", error.message);
  });

  socket.on("reconnect_failed", () => {
    console.error("❌ Reconnection failed after max attempts");
    window.dispatchEvent(new CustomEvent("socket-connection-failed"));
  });

  // Staged call events
  socket.on("staged-call-ended-by-user", (data) => {
    console.log("📞 [Socket.IO] Staged call ended by other user:", data);
    window.dispatchEvent(
      new CustomEvent("staged-call-ended", { detail: data })
    );
  });

  return socket;
};

export const getSocket = () => {
  if (!socket) {
    throw new Error("Socket not initialized. Call initializeSocket first.");
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    reconnectAttempts = 0;
  }
};

export const isSocketConnected = () => {
  return socket && socket.connected;
};

export const getReconnectAttempts = () => {
  return reconnectAttempts;
};
