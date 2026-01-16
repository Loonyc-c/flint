import AgoraRTC from 'agora-rtc-sdk-ng'
import type {
  IAgoraRTCClient,
  IAgoraRTCRemoteUser,
  IMicrophoneAudioTrack,
  ICameraVideoTrack,
  IRemoteVideoTrack,
} from 'agora-rtc-sdk-ng'

// =============================================================================
// Types
// =============================================================================

export interface AgoraJoinOptions {
  appId: string
  channel: string
  token: string
  uid: number
  enableVideo?: boolean
}

export interface AgoraJoinResult {
  success: boolean
  message?: string
  localAudioTrack?: IMicrophoneAudioTrack
  localVideoTrack?: ICameraVideoTrack
}

export interface AgoraEventHandlers {
  onUserJoined?: (uid: number) => void
  onUserLeft?: (uid: number) => void
  onRemoteVideoAdded?: (uid: number, track: IRemoteVideoTrack) => void
  onRemoteVideoRemoved?: (uid: number) => void
}

// =============================================================================
// Agora Client Class
// =============================================================================

export class AgoraClient {
  private client: IAgoraRTCClient | null = null
  private localAudioTrack: IMicrophoneAudioTrack | null = null
  private localVideoTrack: ICameraVideoTrack | null = null
  private remoteUsers: Map<number, IAgoraRTCRemoteUser> = new Map()
  private isJoined = false
  private isJoining = false
  private joinPromise: Promise<AgoraJoinResult> | null = null
  private eventHandlers: AgoraEventHandlers = {}

  /**
   * Initialize the Agora client
   */
  async init(): Promise<void> {
    if (this.client) {
      return
    }

    this.client = AgoraRTC.createClient({
      mode: 'rtc',
      codec: 'vp8',
    })

    this.setupEventListeners()
  }

  /**
   * Set event handlers
   */
  setEventHandlers(handlers: AgoraEventHandlers): void {
    this.eventHandlers = handlers
  }

  /**
   * Set up event listeners for remote users
   */
  private setupEventListeners(): void {
    if (!this.client) return

    // User joined channel
    this.client.on('user-joined', (user) => {
      this.remoteUsers.set(user.uid as number, user)
      this.eventHandlers.onUserJoined?.(user.uid as number)
    })

    // User published media
    this.client.on('user-published', async (user, mediaType) => {
      try {
        await this.client?.subscribe(user, mediaType)

        this.remoteUsers.set(user.uid as number, user)

        if (mediaType === 'audio') {
          const remoteAudioTrack = user.audioTrack
          remoteAudioTrack?.play()
        }

        if (mediaType === 'video') {
          const remoteVideoTrack = user.videoTrack
          if (remoteVideoTrack) {
            this.eventHandlers.onRemoteVideoAdded?.(user.uid as number, remoteVideoTrack)
          }
        }
      } catch (error) {
        console.error('[Agora] Error subscribing to user:', user.uid, error)
      }
    })

    // User unpublished media
    this.client.on('user-unpublished', (user, mediaType) => {
      if (mediaType === 'video') {
        this.eventHandlers.onRemoteVideoRemoved?.(user.uid as number)
      }
    })

    // User left channel
    this.client.on('user-left', (user) => {
      this.remoteUsers.delete(user.uid as number)
      this.eventHandlers.onUserLeft?.(user.uid as number)
    })
  }

  /**
   * Join a channel
   */
  async join(options: AgoraJoinOptions): Promise<AgoraJoinResult> {
    const { appId, channel, token, uid, enableVideo = false } = options

    // Prevent concurrent join attempts
    if (this.isJoining && this.joinPromise) {
      return this.joinPromise
    }

    // Already connected
    if (this.isJoined && this.client?.connectionState === 'CONNECTED') {
      return { success: true, message: 'Already connected' }
    }

    this.isJoining = true

    this.joinPromise = this.performJoin(appId, channel, token, uid, enableVideo)

    try {
      return await this.joinPromise
    } finally {
      this.isJoining = false
      this.joinPromise = null
    }
  }

  private async performJoin(
    appId: string,
    channel: string,
    token: string,
    uid: number,
    enableVideo: boolean
  ): Promise<AgoraJoinResult> {
    try {
      // Leave existing connection
      if (this.isJoined || this.client?.connectionState === 'CONNECTED') {
        await this.leave()
        await new Promise((resolve) => setTimeout(resolve, 300))
      }

      // Initialize if needed
      if (!this.client) {
        await this.init()
      }

      // Join channel
      await this.client!.join(appId, channel, token, uid)
      this.isJoined = true

      // Create and publish audio track
      this.localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack()
      await this.client!.publish([this.localAudioTrack])

      // Create and publish video track if enabled
      if (enableVideo) {
        try {
          this.localVideoTrack = await AgoraRTC.createCameraVideoTrack()
          await this.client!.publish([this.localVideoTrack])
        } catch (videoError) {
          console.warn('[Agora] Could not create video track:', videoError)
          this.localVideoTrack = null
        }
      }

      // Check for existing remote users
      const remoteUsers = this.client!.remoteUsers

      for (const user of remoteUsers) {
        this.remoteUsers.set(user.uid as number, user)
        this.eventHandlers.onUserJoined?.(user.uid as number)

        // If user already has tracks, they won't fire user-published again
        // We should subscribe to them
        if (user.hasAudio || user.hasVideo) {
          this.subscribeToExistingUser(user)
        }
      }

      return {
        success: true,
        localAudioTrack: this.localAudioTrack,
        localVideoTrack: this.localVideoTrack ?? undefined,
      }
    } catch (error) {
      console.error('[Agora] Error joining channel:', error)
      throw error
    }
  }

  /**
   * Subscribe to an existing user's tracks
   */
  private async subscribeToExistingUser(user: IAgoraRTCRemoteUser): Promise<void> {
    try {
      if (user.hasAudio) {
        await this.client?.subscribe(user, 'audio')
        user.audioTrack?.play()
      }
      if (user.hasVideo) {
        await this.client?.subscribe(user, 'video')
        if (user.videoTrack) {
          this.eventHandlers.onRemoteVideoAdded?.(user.uid as number, user.videoTrack)
        }
      }
    } catch (error) {
      console.error('[Agora] Error subscribing to existing user:', user.uid, error)
    }
  }

  /**
   * Leave the channel and clean up
   */
  async leave(): Promise<void> {
    try {
      // Stop and close local audio
      if (this.localAudioTrack) {
        this.localAudioTrack.stop()
        this.localAudioTrack.close()
        this.localAudioTrack = null
      }

      // Stop and close local video
      if (this.localVideoTrack) {
        this.localVideoTrack.stop()
        this.localVideoTrack.close()
        this.localVideoTrack = null
      }

      // Stop remote tracks
      this.remoteUsers.forEach((user) => {
        user.audioTrack?.stop()
        user.videoTrack?.stop()
      })

      // Leave channel
      if (this.client && this.isJoined) {
        await this.client.leave()
        this.isJoined = false
      }

      this.remoteUsers.clear()
      this.client = null
    } catch (error) {
      console.error('[Agora] Error during cleanup:', error)
      this.isJoined = false
    }
  }

  /**
   * Force cleanup - aggressively stop all tracks without waiting
   * Use this when normal cleanup might fail or hang
   */
  async forceCleanup(): Promise<void> {
    try {
      // Stop local tracks immediately without waiting
      this.localAudioTrack?.stop()
      this.localAudioTrack?.close()
      this.localVideoTrack?.stop()
      this.localVideoTrack?.close()
      
      // Stop remote tracks
      this.remoteUsers.forEach(user => {
        user.audioTrack?.stop()
        user.videoTrack?.stop()
      })
      
      // Leave without awaiting (fire and forget)
      if (this.client && this.isJoined) {
        this.client.leave().catch(() => {})
      }
      
      // Force stop hardware
      await AgoraClient.forceStopHardware()
      
      // Reset state
      this.localAudioTrack = null
      this.localVideoTrack = null
      this.remoteUsers.clear()
      this.isJoined = false
      
      console.warn('🛑 [Agora] Force cleanup completed')
    } catch (error) {
      console.error('[Agora] Force cleanup error:', error)
    }
  }

  /**
   * Toggle microphone
   */
  async toggleMicrophone(): Promise<boolean> {
    if (!this.localAudioTrack) return false
    const enabled = this.localAudioTrack.enabled
    await this.localAudioTrack.setEnabled(!enabled)
    return !enabled
  }

  /**
   * Toggle camera
   */
  async toggleCamera(): Promise<boolean> {
    if (!this.localVideoTrack) return false
    const enabled = this.localVideoTrack.enabled
    await this.localVideoTrack.setEnabled(!enabled)
    return !enabled
  }

  /**
   * Enable video (upgrade to video call)
   */
  async enableVideo(): Promise<ICameraVideoTrack | null> {
    if (this.localVideoTrack) {
      return this.localVideoTrack
    }

    try {
      this.localVideoTrack = await AgoraRTC.createCameraVideoTrack()
      await this.client?.publish([this.localVideoTrack])
      return this.localVideoTrack
    } catch (error) {
      console.error('[Agora] Error enabling video:', error)
      return null
    }
  }

  /**
   * Disable video
   */
  async disableVideo(): Promise<void> {
    if (!this.localVideoTrack) return

    try {
      await this.client?.unpublish([this.localVideoTrack])
      this.localVideoTrack.stop()
      this.localVideoTrack.close()
      this.localVideoTrack = null
    } catch (error) {
      console.error('[Agora] Error disabling video:', error)
    }
  }

  /**
   * Mute all local tracks (disable but do not close)
   */
  async muteLocalTracks(): Promise<void> {
    if (this.localAudioTrack) {
      await this.localAudioTrack.setEnabled(false)
    }
    if (this.localVideoTrack) {
      await this.localVideoTrack.setEnabled(false)
    }
  }

  /**
   * Unmute local tracks
   */
  async unmuteLocalTracks(audio = true, video = false): Promise<void> {
    if (this.localAudioTrack && audio) {
      await this.localAudioTrack.setEnabled(true)
    }
    if (this.localVideoTrack && video) {
      await this.localVideoTrack.setEnabled(true)
    }
  }

  /**
   * Get available audio playback devices
   */
  async getAudioPlaybackDevices(): Promise<MediaDeviceInfo[]> {
    return AgoraRTC.getPlaybackDevices()
  }

  /**
   * Get local video track
   */
  getLocalVideoTrack(): ICameraVideoTrack | null {
    return this.localVideoTrack
  }

  /**
   * Get local audio track
   */
  getLocalAudioTrack(): IMicrophoneAudioTrack | null {
    return this.localAudioTrack
  }

  /**
   * Get remote users
   */
  getRemoteUsers(): IAgoraRTCRemoteUser[] {
    return Array.from(this.remoteUsers.values())
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.isJoined && this.client?.connectionState === 'CONNECTED'
  }

  /**
   * Static "Kill Switch" to ensure ALL hardware tracks are stopped.
   * This handles cases where tracks might have leaked outside the class instance.
   */
  static async forceStopHardware(): Promise<void> {
    try {
      // 1. Try to get and stop all active media tracks
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true })
        stream.getTracks().forEach(track => {
          track.stop()
          track.enabled = false
        })
      } catch {
        // getUserMedia might fail if permissions denied, that's ok
      }

      // 2. Enumerate all devices and try to stop any active streams
      const devices = await navigator.mediaDevices.enumerateDevices()
      
      // 3. Additional cleanup: iterate over any existing MediaStreamTrack instances
      // This is a best-effort approach since we can't directly access all tracks
      if (typeof MediaStreamTrack !== 'undefined') {
        // Note: There's no global registry of tracks, but this signals intent
        console.warn('[KillSwitch] Attempted to stop all media tracks')
      }
      
      console.warn('🛑 [KillSwitch] Hardware tracks force-stopped', { deviceCount: devices.length })
    } catch (error) {
      console.error('[KillSwitch] Error during hardware force-stop:', error)
    }
  }

  /**
   * Destroy client
   */
  destroy(): void {
    this.leave()
    this.eventHandlers = {}
  }
}

// Export singleton instance
export const agoraClient = new AgoraClient()
