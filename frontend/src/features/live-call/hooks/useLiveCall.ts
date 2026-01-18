"use client";

import { useEffect, useCallback, useState } from "react";
import { useSocket } from "@/features/realtime";
import { LIVE_CALL_EVENTS } from "@shared/types";
import type { LiveCallMatchPayload, LiveCallPreferences } from "@shared/types";
import {
  useLiveCallContext,
  type LiveCallStatus,
} from "../context/LiveCallContext";

// Note: RemainingTime and matchData are now primarily managed by UnifiedCallInterface
// but we keep some local state for queueing status.

interface UseLiveCallReturn {
  status: LiveCallStatus;
  matchData: LiveCallMatchPayload | null;
  remainingTime: number;
  error: string | null;
  hasLiked: boolean;
  hasPassed: boolean;
  joinQueue: (preferences?: LiveCallPreferences) => void;
  leaveQueue: () => void;
  performAction: (action: "like" | "pass") => void;
  endCall: () => void;
  reset: () => void;
}

export const useLiveCall = (): UseLiveCallReturn => {
  const { socket, isConnected } = useSocket();
  const { status, matchData, error, joinQueue, leaveQueue, reset } =
    useLiveCallContext();

  // Local state for actions within a session
  const [remainingTime, setRemainingTime] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  const [hasPassed, setHasPassed] = useState(false);

  // Sync remaining time when matchData changes
  useEffect(() => {
    if (matchData?.expiresAt) {
      const expires = new Date(matchData.expiresAt).getTime();
      const updateTimer = () => {
        const diff = Math.max(0, Math.floor((expires - Date.now()) / 1000));
        setRemainingTime(diff);
      };
      updateTimer();
      const timer = setInterval(updateTimer, 1000);
      return () => clearInterval(timer);
    } else {
      setRemainingTime(0);
    }
  }, [matchData]);

  const performAction = useCallback(
    (action: "like" | "pass") => {
      if (!socket || !isConnected || !matchData) return;

      socket.emit(LIVE_CALL_EVENTS.CALL_ACTION, {
        matchId: matchData.matchId,
        action,
      });
      if (action === "like") setHasLiked(true);
      else setHasPassed(true);
    },
    [socket, isConnected, matchData],
  );

  const endCall = useCallback(async () => {
    reset();
  }, [reset]);

  return {
    status,
    matchData,
    remainingTime,
    error,
    hasLiked,
    hasPassed,
    joinQueue,
    leaveQueue,
    performAction,
    endCall,
    reset,
  };
};
