"use client";

import { useState, useCallback, useRef } from "react";
import type { ICameraVideoTrack, IRemoteVideoTrack } from "agora-rtc-sdk-ng";
import type { AgoraClient } from "../lib/agora-client";
import { forceStopHardware } from "../lib/agora/hardware";

// =============================================================================
// Types
// =============================================================================

import { useMobileAudio } from "./useMobileAudio";
import { fetchAgoraToken } from "../api/agora";
import { useAgoraLifecycle } from "./useAgoraLifecycle";
import { useAgoraEvents } from "./useAgoraEvents";
import { useAgoraMediaActions } from "./useAgoraMediaActions";

// =============================================================================
// Types
// =============================================================================

interface UseAgoraOptions {
  channelName: string;
  enableVideo?: boolean;
  onUserJoined?: (uid: number) => void;
  onUserLeft?: (uid: number) => void;
  onRemoteVideoAdded?: (uid: number, track: IRemoteVideoTrack) => void;
  onRemoteVideoRemoved?: (uid: number) => void;
}

interface UseAgoraReturn {
  isConnected: boolean;
  isConnecting: boolean;
  localVideoTrack: ICameraVideoTrack | null;
  remoteVideoTracks: Map<number, IRemoteVideoTrack>;
  isMicEnabled: boolean;
  isCameraEnabled: boolean;
  join: () => Promise<boolean>;
  leave: () => Promise<void>;
  toggleMic: () => Promise<void>;
  toggleCamera: () => Promise<void>;
  muteAll: () => Promise<void>;
  unmuteAll: (audio?: boolean, video?: boolean) => Promise<void>;
  error: string | null;
}

// =============================================================================
// Hook
// =============================================================================

export const useAgora = ({
  channelName,
  enableVideo = true,
  onUserJoined,
  onUserLeft,
  onRemoteVideoAdded,
  onRemoteVideoRemoved,
}: UseAgoraOptions): UseAgoraReturn => {
  const clientRef = useRef<AgoraClient | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [localVideoTrack, setLocalVideoTrack] =
    useState<ICameraVideoTrack | null>(null);
  const [remoteVideoTracks, setRemoteVideoTracks] = useState<
    Map<number, IRemoteVideoTrack>
  >(new Map());
  const [isMicEnabled, setIsMicEnabled] = useState(true);
  const [isCameraEnabled, setIsCameraEnabled] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isMounted = useRef(true);

  useAgoraLifecycle(clientRef, isMounted);

  // Mobile Audio Routing Fix
  useMobileAudio();

  useAgoraEvents({
    clientRef,
    setRemoteVideoTracks,
    onUserJoined,
    onUserLeft,
    onRemoteVideoAdded,
    onRemoteVideoRemoved,
  });

  // Join channel
  const join = useCallback(async (): Promise<boolean> => {
    if (!clientRef.current || !channelName) {
      setError("Client not initialized or channel name missing");
      return false;
    }

    setIsConnecting(true);
    setError(null);

    try {
      // Get Agora token from backend
      const tokenData = await fetchAgoraToken(channelName);

      if (!isMounted.current) return false;

      // Initialize and join
      await clientRef.current.init();

      if (!isMounted.current) {
        await clientRef.current.leave();
        return false;
      }

      const result = await clientRef.current.join({
        appId: tokenData.appId,
        channel: tokenData.channelName,
        token: tokenData.token,
        uid: tokenData.uid,
        enableVideo,
      });

      if (!isMounted.current) {
        await clientRef.current.leave();
        return false;
      }

      if (result.success) {
        setIsConnected(true);
        setLocalVideoTrack(result.localVideoTrack ?? null);
        setIsMicEnabled(true);
        setIsCameraEnabled(enableVideo && !!result.localVideoTrack);
        return true;
      } else {
        setError(result.message || "Failed to join channel");
        return false;
      }
    } catch (err) {
      console.error("[useAgora] Error joining channel:", err);
      setError(
        err instanceof Error ? err.message : "Failed to join video call",
      );
      return false;
    } finally {
      setIsConnecting(false);
    }
  }, [channelName, enableVideo]);

  // Leave channel with enhanced cleanup
  const leave = useCallback(async (): Promise<void> => {
    if (!clientRef.current) return;

    try {
      await clientRef.current.leave();
    } catch (err) {
      console.error("[useAgora] Error leaving channel:", err);
      // Fallback: force stop hardware even if leave fails
      await forceStopHardware().catch((e) =>
        console.error("[useAgora] Force stop fallback error:", e),
      );
    } finally {
      setIsConnected(false);
      setLocalVideoTrack(null);
      setRemoteVideoTracks(new Map());
      setIsMicEnabled(true);
      setIsCameraEnabled(true);
    }
  }, []);

  const { muteAll, unmuteAll, toggleMic, toggleCamera } = useAgoraMediaActions({
    clientRef,
    isCameraEnabled,
    setIsMicEnabled,
    setIsCameraEnabled,
    setLocalVideoTrack,
  });

  return {
    isConnected,
    isConnecting,
    localVideoTrack,
    remoteVideoTracks,
    isMicEnabled,
    isCameraEnabled,
    join,
    leave,
    toggleMic,
    toggleCamera,
    muteAll,
    unmuteAll,
    error,
  };
};
