"use client";

import { useEffect, useCallback, useState, useRef } from "react";
import { useSocket } from "../index";

// =============================================================================
// Types
// =============================================================================

export interface RealtimeMessage {
  id: string;
  matchId: string;
  senderId: string;
  text: string;
  createdAt: string;
  readAt?: string;
}

interface UseChatOptions {
  matchId: string;
  onNewMessage?: (message: RealtimeMessage) => void;
  onTyping?: (userId: string) => void;
  onStopTyping?: (userId: string) => void;
  onUserOnline?: (userId: string) => void;
  onUserOffline?: (userId: string) => void;
  onMessagesRead?: (readBy: string) => void;
}

interface UseChatReturn {
  sendMessage: (text: string) => void;
  startTyping: () => void;
  stopTyping: () => void;
  markAsRead: () => void;
  isPartnerOnline: boolean;
  isPartnerTyping: boolean;
}

// =============================================================================
// Hook
// =============================================================================

export const useChat = ({
  matchId,
  onNewMessage,
  onTyping,
  onStopTyping,
  onUserOnline,
  onUserOffline,
  onMessagesRead,
}: UseChatOptions): UseChatReturn => {
  const { socket, isConnected, joinMatch, leaveMatch } = useSocket();
  const [isPartnerOnline, setIsPartnerOnline] = useState(false);
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Join match room on mount
  useEffect(() => {
    if (isConnected && matchId) {
      joinMatch(matchId);
    }

    return () => {
      if (matchId) {
        leaveMatch(matchId);
      }
    };
  }, [matchId, isConnected, joinMatch, leaveMatch]);

  // Set up event listeners
  useEffect(() => {
    if (!socket || !matchId) return;

    // New message received
    const handleNewMessage = (message: RealtimeMessage) => {
      if (message.matchId === matchId) {
        onNewMessage?.(message);
      }
    };

    // User started typing
    const handleUserTyping = (data: { matchId: string; userId: string }) => {
      if (data.matchId === matchId) {
        setIsPartnerTyping(true);
        onTyping?.(data.userId);
      }
    };

    // User stopped typing
    const handleUserStopTyping = (data: {
      matchId: string;
      userId: string;
    }) => {
      if (data.matchId === matchId) {
        setIsPartnerTyping(false);
        onStopTyping?.(data.userId);
      }
    };

    // User came online
    const handleUserOnline = (data: { matchId: string; userId: string }) => {
      if (data.matchId === matchId) {
        setIsPartnerOnline(true);
        onUserOnline?.(data.userId);
      }
    };

    // User went offline
    const handleUserOffline = (data: { matchId: string; userId: string }) => {
      if (data.matchId === matchId) {
        setIsPartnerOnline(false);
        setIsPartnerTyping(false);
        onUserOffline?.(data.userId);
      }
    };

    // Messages marked as read
    const handleMessagesRead = (data: { matchId: string; readBy: string }) => {
      if (data.matchId === matchId) {
        onMessagesRead?.(data.readBy);
      }
    };

    // Register listeners
    socket.on("new-message", handleNewMessage);
    socket.on("user-typing", handleUserTyping);
    socket.on("user-stop-typing", handleUserStopTyping);
    socket.on("user-online", handleUserOnline);
    socket.on("user-offline", handleUserOffline);
    socket.on("messages-read", handleMessagesRead);

    // Cleanup
    return () => {
      socket.off("new-message", handleNewMessage);
      socket.off("user-typing", handleUserTyping);
      socket.off("user-stop-typing", handleUserStopTyping);
      socket.off("user-online", handleUserOnline);
      socket.off("user-offline", handleUserOffline);
      socket.off("messages-read", handleMessagesRead);
    };
  }, [
    socket,
    matchId,
    onNewMessage,
    onTyping,
    onStopTyping,
    onUserOnline,
    onUserOffline,
    onMessagesRead,
  ]);

  // Send a message
  const sendMessage = useCallback(
    (text: string) => {
      if (socket && matchId && text.trim()) {
        socket.emit("send-message", { matchId, text: text.trim() });
      }
    },
    [socket, matchId],
  );

  // Start typing indicator
  const startTyping = useCallback(() => {
    if (socket && matchId) {
      socket.emit("typing", matchId);

      // Auto-stop typing after 3 seconds
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit("stop-typing", matchId);
      }, 3000);
    }
  }, [socket, matchId]);

  // Stop typing indicator
  const stopTyping = useCallback(() => {
    if (socket && matchId) {
      socket.emit("stop-typing", matchId);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    }
  }, [socket, matchId]);

  // Mark messages as read
  const markAsRead = useCallback(() => {
    if (socket && matchId) {
      socket.emit("mark-read", matchId);
    }
  }, [socket, matchId]);

  return {
    sendMessage,
    startTyping,
    stopTyping,
    markAsRead,
    isPartnerOnline,
    isPartnerTyping,
  };
};
