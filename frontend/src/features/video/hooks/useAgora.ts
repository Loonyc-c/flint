'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { ICameraVideoTrack, IRemoteVideoTrack } from 'agora-rtc-sdk-ng'
import { AgoraClient } from '../lib/agora-client'
import { apiRequest } from '@/lib/api-client'

// =============================================================================
// Types
// =============================================================================

interface AgoraTokenResponse {
  token: string
  channelName: string
  uid: number
  appId: string
  expiresAt: number
}

interface UseAgoraOptions {
  channelName: string
  enableVideo?: boolean
  onUserJoined?: (uid: number) => void
  onUserLeft?: (uid: number) => void
  onRemoteVideoAdded?: (uid: number, track: IRemoteVideoTrack) => void
  onRemoteVideoRemoved?: (uid: number) => void
}

interface UseAgoraReturn {
  isConnected: boolean
  isConnecting: boolean
  localVideoTrack: ICameraVideoTrack | null
  remoteVideoTracks: Map<number, IRemoteVideoTrack>
  isMicEnabled: boolean
  isCameraEnabled: boolean
  join: () => Promise<boolean>
  leave: () => Promise<void>
  toggleMic: () => Promise<void>
  toggleCamera: () => Promise<void>
  error: string | null
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
  const clientRef = useRef<AgoraClient | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [localVideoTrack, setLocalVideoTrack] = useState<ICameraVideoTrack | null>(null)
  const [remoteVideoTracks, setRemoteVideoTracks] = useState<Map<number, IRemoteVideoTrack>>(new Map())
  const [isMicEnabled, setIsMicEnabled] = useState(true)
  const [isCameraEnabled, setIsCameraEnabled] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Initialize client on mount
  useEffect(() => {
    clientRef.current = new AgoraClient()

    return () => {
      clientRef.current?.destroy()
      clientRef.current = null
    }
  }, [])

  // Set up event handlers
  useEffect(() => {
    if (!clientRef.current) return

    clientRef.current.setEventHandlers({
      onUserJoined: (uid) => {
        onUserJoined?.(uid)
      },
      onUserLeft: (uid) => {
        setRemoteVideoTracks((prev) => {
          const next = new Map(prev)
          next.delete(uid)
          return next
        })
        onUserLeft?.(uid)
      },
      onRemoteVideoAdded: (uid, track) => {
        setRemoteVideoTracks((prev) => {
          const next = new Map(prev)
          next.set(uid, track)
          return next
        })
        onRemoteVideoAdded?.(uid, track)
      },
      onRemoteVideoRemoved: (uid) => {
        setRemoteVideoTracks((prev) => {
          const next = new Map(prev)
          next.delete(uid)
          return next
        })
        onRemoteVideoRemoved?.(uid)
      },
    })
  }, [onUserJoined, onUserLeft, onRemoteVideoAdded, onRemoteVideoRemoved])

  // Join channel
  const join = useCallback(async (): Promise<boolean> => {
    if (!clientRef.current || !channelName) {
      setError('Client not initialized or channel name missing')
      return false
    }

    setIsConnecting(true)
    setError(null)

    try {
      // Get Agora token from backend
      const tokenData = await apiRequest<AgoraTokenResponse>('/agora/token', {
        method: 'POST',
        body: JSON.stringify({ channelName }),
      })

      // Initialize and join
      await clientRef.current.init()
      const result = await clientRef.current.join({
        appId: tokenData.appId,
        channel: tokenData.channelName,
        token: tokenData.token,
        uid: tokenData.uid,
        enableVideo,
      })

      if (result.success) {
        setIsConnected(true)
        setLocalVideoTrack(result.localVideoTrack ?? null)
        setIsMicEnabled(true)
        setIsCameraEnabled(enableVideo && !!result.localVideoTrack)
        return true
      } else {
        setError(result.message || 'Failed to join channel')
        return false
      }
    } catch (err) {
      console.error('[useAgora] Error joining channel:', err)
      setError(err instanceof Error ? err.message : 'Failed to join video call')
      return false
    } finally {
      setIsConnecting(false)
    }
  }, [channelName, enableVideo])

  // Leave channel
  const leave = useCallback(async (): Promise<void> => {
    if (!clientRef.current) return

    try {
      await clientRef.current.leave()
      setIsConnected(false)
      setLocalVideoTrack(null)
      setRemoteVideoTracks(new Map())
      setIsMicEnabled(true)
      setIsCameraEnabled(true)
    } catch (err) {
      console.error('[useAgora] Error leaving channel:', err)
    }
  }, [])

  // Toggle microphone
  const toggleMic = useCallback(async (): Promise<void> => {
    if (!clientRef.current) return

    try {
      const enabled = await clientRef.current.toggleMicrophone()
      setIsMicEnabled(enabled)
    } catch (err) {
      console.error('[useAgora] Error toggling mic:', err)
    }
  }, [])

  // Toggle camera
  const toggleCamera = useCallback(async (): Promise<void> => {
    if (!clientRef.current) return

    try {
      if (isCameraEnabled) {
        await clientRef.current.disableVideo()
        setLocalVideoTrack(null)
        setIsCameraEnabled(false)
      } else {
        const track = await clientRef.current.enableVideo()
        setLocalVideoTrack(track)
        setIsCameraEnabled(!!track)
      }
    } catch (err) {
      console.error('[useAgora] Error toggling camera:', err)
    }
  }, [isCameraEnabled])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isConnected) {
        clientRef.current?.leave()
      }
    }
  }, [isConnected])

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
    error,
  }
}
