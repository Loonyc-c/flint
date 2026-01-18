"use client";

import { useEffect, useCallback, useState } from "react";
import { useSocket } from "../index";

// =============================================================================
// Types
// =============================================================================

export type CallStatus = "idle" | "calling" | "ringing" | "connected" | "ended";

export interface IncomingCall {
  matchId: string;
  callerId: string;
  callerName: string;
  channelName: string;
}

interface UseVideoCallOptions {
  onIncomingCall?: (call: IncomingCall) => void;
  onCallAccepted?: (data: { matchId: string; channelName: string }) => void;
  onCallDeclined?: (matchId: string) => void;
  onCallEnded?: (data: { matchId: string; duration?: number }) => void;
  onCallTimeout?: (matchId: string) => void;
  onCallCancelled?: (matchId: string) => void;
}

interface UseVideoCallReturn {
  callStatus: CallStatus;
  currentCall: {
    matchId: string;
    channelName: string;
    isOutgoing: boolean;
  } | null;
  incomingCall: IncomingCall | null;
  initiateCall: (matchId: string, calleeId: string) => void;
  acceptCall: (matchId: string) => void;
  declineCall: (matchId: string) => void;
  endCall: (matchId: string) => void;
  cancelCall: (matchId: string) => void;
  toggleMedia: (
    matchId: string,
    mediaType: "audio" | "video",
    enabled: boolean,
  ) => void;
}

// =============================================================================
// Hook
// =============================================================================

export const useVideoCall = (
  options: UseVideoCallOptions = {},
): UseVideoCallReturn => {
  const { socket, isConnected } = useSocket();
  const [callStatus, setCallStatus] = useState<CallStatus>("idle");
  const [currentCall, setCurrentCall] = useState<{
    matchId: string;
    channelName: string;
    isOutgoing: boolean;
  } | null>(null);
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);

  // Set up event listeners
  useEffect(() => {
    if (!socket) return;

    // Incoming call
    const handleIncomingCall = (data: IncomingCall) => {
      setIncomingCall(data);
      setCallStatus("ringing");
      options.onIncomingCall?.(data);
    };

    // Call is ringing (for caller)
    const handleCallRinging = (data: {
      matchId: string;
      calleeId: string;
      channelName: string;
    }) => {
      setCallStatus("calling");
      setCurrentCall({
        matchId: data.matchId,
        channelName: data.channelName,
        isOutgoing: true,
      });
    };

    // Call accepted (for caller)
    const handleCallAccepted = (data: {
      matchId: string;
      channelName: string;
      calleeId: string;
    }) => {
      setCallStatus("connected");
      setCurrentCall((prev) =>
        prev ? { ...prev, channelName: data.channelName } : null,
      );
      options.onCallAccepted?.(data);
    };

    // Call connected (for callee)
    const handleCallConnected = (data: {
      matchId: string;
      channelName: string;
      callerId: string;
    }) => {
      setCallStatus("connected");
      setCurrentCall({
        matchId: data.matchId,
        channelName: data.channelName,
        isOutgoing: false,
      });
      setIncomingCall(null);
      options.onCallAccepted?.(data);
    };

    // Call declined
    const handleCallDeclined = (data: {
      matchId: string;
      calleeId: string;
    }) => {
      setCallStatus("ended");
      setCurrentCall(null);
      options.onCallDeclined?.(data.matchId);
      setTimeout(() => setCallStatus("idle"), 2000);
    };

    // Call ended
    const handleCallEnded = (data: {
      matchId: string;
      endedBy: string;
      duration?: number;
    }) => {
      setCallStatus("ended");
      setCurrentCall(null);
      setIncomingCall(null);
      options.onCallEnded?.(data);
      setTimeout(() => setCallStatus("idle"), 2000);
    };

    // Call timeout
    const handleCallTimeout = (data: { matchId: string }) => {
      setCallStatus("ended");
      setCurrentCall(null);
      options.onCallTimeout?.(data.matchId);
      setTimeout(() => setCallStatus("idle"), 2000);
    };

    // Call cancelled
    const handleCallCancelled = (data: {
      matchId: string;
      callerId: string;
    }) => {
      setCallStatus("idle");
      setIncomingCall(null);
      options.onCallCancelled?.(data.matchId);
    };

    // Call missed (callee side after timeout)
    const handleCallMissed = (_data: { matchId: string; callerId: string }) => {
      setIncomingCall(null);
      setCallStatus("idle");
    };

    // Call error
    const handleCallError = (data: { matchId: string; error: string }) => {
      console.error("[VideoCall] Error:", data);
      setCallStatus("idle");
      setCurrentCall(null);
      setIncomingCall(null);
    };

    // Register listeners
    socket.on("call-incoming", handleIncomingCall);
    socket.on("call-ringing", handleCallRinging);
    socket.on("call-accepted", handleCallAccepted);
    socket.on("call-connected", handleCallConnected);
    socket.on("call-declined", handleCallDeclined);
    socket.on("call-ended", handleCallEnded);
    socket.on("call-timeout", handleCallTimeout);
    socket.on("call-cancelled", handleCallCancelled);
    socket.on("call-missed", handleCallMissed);
    socket.on("call-error", handleCallError);

    // Cleanup
    return () => {
      socket.off("call-incoming", handleIncomingCall);
      socket.off("call-ringing", handleCallRinging);
      socket.off("call-accepted", handleCallAccepted);
      socket.off("call-connected", handleCallConnected);
      socket.off("call-declined", handleCallDeclined);
      socket.off("call-ended", handleCallEnded);
      socket.off("call-timeout", handleCallTimeout);
      socket.off("call-cancelled", handleCallCancelled);
      socket.off("call-missed", handleCallMissed);
      socket.off("call-error", handleCallError);
    };
  }, [socket, options]);

  // Initiate a call
  const initiateCall = useCallback(
    (matchId: string, calleeId: string) => {
      if (socket && isConnected && callStatus === "idle") {
        socket.emit("call-initiate", { matchId, calleeId });
        setCallStatus("calling");
      }
    },
    [socket, isConnected, callStatus],
  );

  // Accept incoming call
  const acceptCall = useCallback(
    (matchId: string) => {
      if (socket && isConnected && incomingCall) {
        socket.emit("call-accept", { matchId });
      }
    },
    [socket, isConnected, incomingCall],
  );

  // Decline incoming call
  const declineCall = useCallback(
    (matchId: string) => {
      if (socket && isConnected) {
        socket.emit("call-decline", { matchId });
        setIncomingCall(null);
        setCallStatus("idle");
      }
    },
    [socket, isConnected],
  );

  // End active call
  const endCall = useCallback(
    (matchId: string) => {
      if (socket && isConnected) {
        socket.emit("call-end", { matchId });
        setCallStatus("ended");
        setCurrentCall(null);
        setTimeout(() => setCallStatus("idle"), 2000);
      }
    },
    [socket, isConnected],
  );

  // Cancel outgoing call
  const cancelCall = useCallback(
    (matchId: string) => {
      if (socket && isConnected) {
        socket.emit("call-cancel", { matchId });
        setCallStatus("idle");
        setCurrentCall(null);
      }
    },
    [socket, isConnected],
  );

  // Toggle media (notify other user)
  const toggleMedia = useCallback(
    (matchId: string, mediaType: "audio" | "video", enabled: boolean) => {
      if (socket && isConnected && currentCall) {
        socket.emit("call-media-toggle", { matchId, mediaType, enabled });
      }
    },
    [socket, isConnected, currentCall],
  );

  return {
    callStatus,
    currentCall,
    incomingCall,
    initiateCall,
    acceptCall,
    declineCall,
    endCall,
    cancelCall,
    toggleMedia,
  };
};
