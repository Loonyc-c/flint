"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { io, type Socket } from "socket.io-client";
import { useUser } from "@/features/auth/context/UserContext";

// =============================================================================
// Types
// =============================================================================
// aa
interface SocketContextValue {
  socket: Socket | null;
  isConnected: boolean;
  joinMatch: (matchId: string) => void;
  leaveMatch: (matchId: string) => void;
}

// =============================================================================
// Context
// =============================================================================

const SocketContext = createContext<SocketContextValue | null>(null);

// =============================================================================
// Provider
// =============================================================================

// #region agent log
// Helper to extract base URL without path (socket.io connects to root, not /v1)
const getSocketBaseUrl = (url: string): string => {
  try {
    const parsed = new URL(url);
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return url;
  }
};

const RAW_SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL;
const RAW_API_URL = process.env.NEXT_PUBLIC_API_URL;
// If SOCKET_URL is not set, use API_URL but strip any path (like /v1)
const SOCKET_URL = RAW_SOCKET_URL || (RAW_API_URL ? getSocketBaseUrl(RAW_API_URL) : "http://localhost:9999");

const debugLog = (location: string, message: string, data: Record<string, unknown>, hypothesisId: string) => {
  console.log(`[DEBUG-${hypothesisId}] ${location}: ${message}`, data);
  // Also send to local debug server if available
  fetch('http://127.0.0.1:7242/ingest/b19804b6-4386-4870-8813-100e008e11a3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location,message,data,timestamp:Date.now(),sessionId:'debug-session',hypothesisId})}).catch(()=>{});
};
// #endregion

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, token } = useUser();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const joinedMatches = useRef<Set<string>>(new Set());

  // Initialize socket connection
  useEffect(() => {
    // #region agent log
    debugLog('SocketContext.tsx:useEffect', 'Socket init check', { 
      hasUser: !!user?.id, 
      hasToken: !!token, 
      tokenLength: token?.length || 0, 
      SOCKET_URL_FINAL: SOCKET_URL,
      RAW_SOCKET_URL: RAW_SOCKET_URL || 'NOT_SET', 
      RAW_API_URL: RAW_API_URL || 'NOT_SET'
    }, 'A');
    // #endregion

    if (!user?.id || !token) {
      // Disconnect if user logs out
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    // #region agent log
    debugLog('SocketContext.tsx:createSocket', 'Creating socket connection', { userId: user.id, SOCKET_URL, tokenPreview: token.substring(0, 20) + '...' }, 'A,C');
    // #endregion

    // Create socket connection
    const newSocket = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    });

    // Connection events
    newSocket.on("connect", () => {
      // #region agent log
      debugLog('SocketContext.tsx:onConnect', 'Socket connected successfully', { socketId: newSocket.id, transport: newSocket.io.engine?.transport?.name }, 'D,E');
      // #endregion
      setIsConnected(true);

      // Rejoin any match rooms after reconnection
      joinedMatches.current.forEach((matchId) => {
        newSocket.emit("join-match", matchId);
      });
    });

    newSocket.on("disconnect", (reason) => {
      // #region agent log
      debugLog('SocketContext.tsx:onDisconnect', 'Socket disconnected', { reason, socketId: newSocket.id }, 'D');
      // #endregion
      setIsConnected(false);
    });

    newSocket.on("connect_error", (error) => {
      // #region agent log
      debugLog('SocketContext.tsx:onConnectError', 'Socket connection error', { errorMessage: error.message, errorName: error.name, SOCKET_URL }, 'B,C,D,E');
      // #endregion
      setIsConnected(false);
    });

    newSocket.on("error", (error) => {
      // #region agent log
      debugLog('SocketContext.tsx:onError', 'Socket error event', { error: String(error) }, 'D');
      // #endregion
      console.error("[Socket] Error:", error);
    });

    // #region agent log
    newSocket.io.on("reconnect_attempt", (attempt) => {
      debugLog('SocketContext.tsx:reconnectAttempt', 'Reconnection attempt', { attempt }, 'D,E');
    });
    // #endregion

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      newSocket.disconnect();
      setSocket(null);
      setIsConnected(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, token]);

  // Join a match room
  const joinMatch = useCallback(
    (matchId: string) => {
      if (socket && isConnected) {
        socket.emit("join-match", matchId);
        joinedMatches.current.add(matchId);
      }
    },
    [socket, isConnected]
  );

  // Leave a match room
  const leaveMatch = useCallback(
    (matchId: string) => {
      if (socket && isConnected) {
        socket.emit("leave-match", matchId);
        joinedMatches.current.delete(matchId);
      }
    },
    [socket, isConnected]
  );

  const value: SocketContextValue = {
    socket,
    isConnected,
    joinMatch,
    leaveMatch,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};

// =============================================================================
// Hook
// =============================================================================

export const useSocket = (): SocketContextValue => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};
