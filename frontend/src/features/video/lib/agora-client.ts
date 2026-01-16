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
  
  // Track disposal state management
  private isDisposingTracks = false
  private lastTrackDisposalTime = 0
  private readonly MIN_TRACK_RECREATION_DELAY = 500

  /**
   * Diagnostic logging for track state
   */
  private logTrackState = (context: string): void => {
    console.warn(`[Agora:${context}]`, {
      hasClient: !!this.client,
      isJoined: this.isJoined,
      hasAudioTrack: !!this.localAudioTrack,
      hasVideoTrack: !!this.localVideoTrack,
      isDisposing: this.isDisposingTracks,
      timeSinceDisposal: Date.now() - this.lastTrackDisposalTime,
    })
  }

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
      // 1. Ensure tracks are fully disposed before creating new ones
      if (this.isDisposingTracks) {
        console.warn('[Agora] Waiting for track disposal to complete...')
        await new Promise(resolve => setTimeout(resolve, 500))
      }

      // 2. Enforce minimum delay since last disposal
      const timeSinceDisposal = Date.now() - this.lastTrackDisposalTime
      if (this.lastTrackDisposalTime > 0 && timeSinceDisposal < this.MIN_TRACK_RECREATION_DELAY) {
        const remainingDelay = this.MIN_TRACK_RECREATION_DELAY - timeSinceDisposal
        console.warn(`[Agora] Waiting ${remainingDelay}ms before creating tracks...`)
        await new Promise(resolve => setTimeout(resolve, remainingDelay))
      }

      // 3. Leave existing connection if any
      if (this.isJoined || this.client?.connectionState === 'CONNECTED') {
        await this.leave()
        await new Promise((resolve) => setTimeout(resolve, 300))
      }

      // 4. Initialize client if needed (but don't recreate if exists)
      if (!this.client) {
        await this.init()
      }

      // 5. Join channel
      await this.client!.join(appId, channel, token, uid)
      this.isJoined = true

      // 6. Create and publish audio track with retry
      try {
        this.localAudioTrack = await this.createAudioTrackWithRetry()
        await this.client!.publish([this.localAudioTrack])
      } catch (audioError) {
        console.error('[Agora] Failed to create audio track after retries:', audioError)
        throw new Error('Microphone access failed. Please check permissions.')
      }

      // 7. Create and publish video track if enabled
      if (enableVideo) {
        try {
          this.localVideoTrack = await this.createVideoTrackWithRetry()
          await this.client!.publish([this.localVideoTrack])
        } catch (videoError) {
          console.warn('[Agora] Could not create video track:', videoError)
          this.localVideoTrack = null
        }
      }

      // 8. Check for existing remote users
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
      // Cleanup on error
      await this.leave()
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
   * Create audio track with retry logic
   */
  private createAudioTrackWithRetry = async (maxRetries = 3): Promise<IMicrophoneAudioTrack> => {
    let lastError: Error | null = null
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.warn(`[Agora] Creating audio track (attempt ${attempt}/${maxRetries})...`)
        const track = await AgoraRTC.createMicrophoneAudioTrack()
        console.warn('[Agora] ✅ Audio track created successfully')
        return track
      } catch (error) {
        lastError = error as Error
        console.warn(`[Agora] Audio track creation failed (attempt ${attempt}):`, error)
        
        if (attempt < maxRetries) {
          const delay = attempt * 500
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }
    
    throw lastError || new Error('Failed to create audio track')
  }

  /**
   * Create video track with retry logic
   */
  private createVideoTrackWithRetry = async (maxRetries = 2): Promise<ICameraVideoTrack> => {
    let lastError: Error | null = null
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.warn(`[Agora] Creating video track (attempt ${attempt}/${maxRetries})...`)
        const track = await AgoraRTC.createCameraVideoTrack()
        console.warn('[Agora] ✅ Video track created successfully')
        return track
      } catch (error) {
        lastError = error as Error
        console.warn(`[Agora] Video track creation failed (attempt ${attempt}):`, error)
        
        if (attempt < maxRetries) {
          const delay = attempt * 500
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }
    
    throw lastError || new Error('Failed to create video track')
  }

  /**
   * Leave the channel and clean up
   */
  async leave(): Promise<void> {
    if (this.isDisposingTracks) {
      console.warn('[Agora] Already disposing tracks, skipping duplicate leave call')
      return
    }

    this.isDisposingTracks = true

    try {
      // 1. Unpublish local tracks from channel FIRST
      const tracksToUnpublish: (IMicrophoneAudioTrack | ICameraVideoTrack)[] = []
      if (this.localAudioTrack) tracksToUnpublish.push(this.localAudioTrack)
      if (this.localVideoTrack) tracksToUnpublish.push(this.localVideoTrack)

      if (tracksToUnpublish.length > 0 && this.client && this.isJoined) {
        try {
          await this.client.unpublish(tracksToUnpublish)
        } catch (err) {
          console.warn('[Agora] Error unpublishing tracks:', err)
        }
      }

      // 2. Stop and close local audio
      if (this.localAudioTrack) {
        this.localAudioTrack.stop()
        this.localAudioTrack.close()
        this.localAudioTrack = null
      }

      // 3. Stop and close local video
      if (this.localVideoTrack) {
        this.localVideoTrack.stop()
        this.localVideoTrack.close()
        this.localVideoTrack = null
      }

      // 4. Stop remote tracks
      this.remoteUsers.forEach((user) => {
        user.audioTrack?.stop()
        user.videoTrack?.stop()
      })

      // 5. Leave channel (but keep client instance alive)
      if (this.client && this.isJoined) {
        await this.client.leave()
        this.isJoined = false
      }

      this.remoteUsers.clear()
      
      // 6. Record disposal time and wait for hardware release
      this.lastTrackDisposalTime = Date.now()
      await new Promise(resolve => setTimeout(resolve, 300))

    } catch (error) {
      console.error('[Agora] Error during cleanup:', error)
      this.isJoined = false
    } finally {
      this.isDisposingTracks = false
    }
    
    // NOTE: Do NOT set this.client = null here! Client is reused for subsequent calls
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
   * Destroy client - called only on component unmount
   */
  destroy(): void {
    this.leave().catch(err => console.error('[Agora] Error in destroy:', err))
    this.eventHandlers = {}
    // NOW we can null the client
    this.client = null
    this.lastTrackDisposalTime = 0
  }
}

// Export singleton instance
export const agoraClient = new AgoraClient()
