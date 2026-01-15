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
  muteAll: () => Promise<void>
  unmuteAll: (audio?: boolean, video?: boolean) => Promise<void>
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

  const isMounted = useRef(true)

  // Initialize client on mount
  useEffect(() => {
    isMounted.current = true
    clientRef.current = new AgoraClient()

    return () => {
      isMounted.current = false
      const client = clientRef.current
      if (client) {
        // Stop hardware immediately and leave
        client.leave().catch(err => console.error('[useAgora] Cleanup error:', err))
        client.destroy()
        // Final safety net: Force stop all hardware tracks
        AgoraClient.forceStopHardware()
      }
      clientRef.current = null
    }
  }, [])

  // Mobile Audio Routing Fix
  useEffect(() => {
    const handleDeviceChange = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices()
        const audioOutputs = devices.filter(d => d.kind === 'audiooutput')
        
        // Prefer Bluetooth or Wired Headset
        const headset = audioOutputs.find(d => 
          d.label.toLowerCase().includes('bluetooth') || 
          d.label.toLowerCase().includes('headset') ||
          d.label.toLowerCase().includes('wired')
        )

        // Note: Agora SDK handles output routing internally via its playback devices,
        // but explicit selection can help on some mobile browsers if supported.
        // We log it here for debugging/verification.
        if (headset) {
          console.warn('[MobileAudio] Headset detected:', headset.label)
        }
      } catch (e) {
        console.warn('[MobileAudio] Failed to enumerate devices', e)
      }
    }

    navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange)
    handleDeviceChange() // Check on mount

    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange)
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

      if (!isMounted.current) return false

      // Initialize and join
      await clientRef.current.init()
      
      if (!isMounted.current) {
        await clientRef.current.leave()
        return false
      }

      const result = await clientRef.current.join({
        appId: tokenData.appId,
        channel: tokenData.channelName,
        token: tokenData.token,
        uid: tokenData.uid,
        enableVideo,
      })

      if (!isMounted.current) {
        await clientRef.current.leave()
        return false
      }

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

  // Mute all (Pause)
  const muteAll = useCallback(async (): Promise<void> => {
    if (!clientRef.current) return
    await clientRef.current.muteLocalTracks()
    setIsMicEnabled(false)
    setIsCameraEnabled(false)
  }, [])

  // Unmute all (Resume)
  const unmuteAll = useCallback(async (audio = true, video = false): Promise<void> => {
    if (!clientRef.current) return
    await clientRef.current.unmuteLocalTracks(audio, video)
    setIsMicEnabled(audio)
    setIsCameraEnabled(video)
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
  }
}
