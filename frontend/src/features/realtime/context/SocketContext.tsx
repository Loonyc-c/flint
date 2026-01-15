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

export type UserBusyStatus = 'available' | 'queueing' | 'connecting' | 'in-call'

interface SocketContextValue {
  socket: Socket | null;
  isConnected: boolean;
  joinMatch: (matchId: string) => void;
  leaveMatch: (matchId: string) => void;
  busyStates: Record<string, UserBusyStatus>;
  isUserBusy: (userId: string) => boolean;
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

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, token } = useUser();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [busyStates, setBusyStates] = useState<Record<string, UserBusyStatus>>({});
  const joinedMatches = useRef<Set<string>>(new Set());

  // Initialize socket connection
  useEffect(() => {
    if (!user?.id || !token) {
      // Disconnect if user logs out
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

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
      setIsConnected(true);

      // Rejoin any match rooms after reconnection
      joinedMatches.current.forEach((matchId) => {
        newSocket.emit("join-match", matchId);
      });
    });

    newSocket.on("disconnect", (_reason) => {
      setIsConnected(false);
    });

    newSocket.on("connect_error", (_error) => {
      setIsConnected(false);
    });

    newSocket.on("error", (error) => {
      console.error("[Socket] Error:", error);
    });

    // Busy state events
    newSocket.on("busy-states-sync", (states: Record<string, UserBusyStatus>) => {
      setBusyStates(states);
    });

    newSocket.on("user-busy-state-changed", ({ userId, status }: { userId: string, status: UserBusyStatus }) => {
      setBusyStates(prev => ({
        ...prev,
        [userId]: status
      }));
    });

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

  const isUserBusy = useCallback((userId: string) => {
    return !!busyStates[userId] && busyStates[userId] !== 'available';
  }, [busyStates]);

  const value: SocketContextValue = {
    socket,
    isConnected,
    joinMatch,
    leaveMatch,
    busyStates,
    isUserBusy,
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
