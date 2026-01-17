// Types only import to avoid top-level access to window/navigator
import type {
  IAgoraRTCClient,
  IAgoraRTCRemoteUser,
  IMicrophoneAudioTrack,
  ICameraVideoTrack,
} from 'agora-rtc-sdk-ng'

import type { AgoraJoinOptions, AgoraJoinResult, AgoraEventHandlers } from './agora/types'
import { setupEventListeners } from './agora/events'
import { performJoin, performLeave } from './agora/connection'
import {
  toggleMicrophone,
  toggleCamera,
  enableVideo,
  disableVideo,
  muteLocalTracks,
  unmuteLocalTracks
} from './agora/media-controls'

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

  async init(): Promise<void> {
    if (this.client || typeof window === 'undefined') return

    const AgoraRTC = (await import('agora-rtc-sdk-ng')).default

    this.client = AgoraRTC.createClient({
      mode: 'rtc',
      codec: 'vp8',
    })

    setupEventListeners(this.client, this.remoteUsers, this.eventHandlers)
  }

  setEventHandlers(handlers: AgoraEventHandlers): void {
    this.eventHandlers = handlers
  }

  async join(options: AgoraJoinOptions): Promise<AgoraJoinResult> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { appId, channel, token, uid, enableVideo = false } = options

    if (this.isJoining && this.joinPromise) return this.joinPromise
    if (this.isJoined && this.client?.connectionState === 'CONNECTED') {
      return { success: true, message: 'Already connected' }
    }

    this.isJoining = true
    this.joinPromise = this.executeJoin(options)

    try {
      return await this.joinPromise
    } finally {
      this.isJoining = false
      this.joinPromise = null
    }
  }

  private async executeJoin(options: AgoraJoinOptions): Promise<AgoraJoinResult> {
    try {
      if (this.isDisposingTracks) {
        await new Promise(resolve => setTimeout(resolve, 500))
      }

      const timeSinceDisposal = Date.now() - this.lastTrackDisposalTime
      if (this.lastTrackDisposalTime > 0 && timeSinceDisposal < this.MIN_TRACK_RECREATION_DELAY) {
        await new Promise(resolve => setTimeout(resolve, this.MIN_TRACK_RECREATION_DELAY - timeSinceDisposal))
      }

      if (this.isJoined || this.client?.connectionState === 'CONNECTED') {
        await this.leave()
        await new Promise((resolve) => setTimeout(resolve, 300))
      }

      if (!this.client) await this.init()

      const result = await performJoin(this.client!, options, this.eventHandlers, this.remoteUsers)

      this.isJoined = true
      this.localAudioTrack = result.localAudioTrack || null
      this.localVideoTrack = result.localVideoTrack || null

      return result
    } catch (error) {
      await this.leave()
      throw error
    }
  }

  async leave(): Promise<void> {
    if (this.isDisposingTracks) return
    this.isDisposingTracks = true

    try {
      await performLeave(this.client, this.localAudioTrack, this.localVideoTrack, this.remoteUsers)
      this.localAudioTrack = null
      this.localVideoTrack = null
      this.isJoined = false
      this.lastTrackDisposalTime = Date.now()
    } catch (_error) {
      this.isJoined = false
    } finally {
      this.isDisposingTracks = false
    }
  }



  async toggleMicrophone(): Promise<boolean> {
    return toggleMicrophone(this.localAudioTrack)
  }

  async toggleCamera(): Promise<boolean> {
    return toggleCamera(this.localVideoTrack)
  }

  async enableVideo(): Promise<ICameraVideoTrack | null> {
    this.localVideoTrack = await enableVideo(this.client, this.localVideoTrack)
    return this.localVideoTrack
  }

  async disableVideo(): Promise<void> {
    this.localVideoTrack = await disableVideo(this.client, this.localVideoTrack)
  }

  async muteLocalTracks(): Promise<void> {
    await muteLocalTracks(this.localAudioTrack, this.localVideoTrack)
  }

  async unmuteLocalTracks(audio = true, video = false): Promise<void> {
    await unmuteLocalTracks(this.localAudioTrack, this.localVideoTrack, audio, video)
  }

  getLocalVideoTrack(): ICameraVideoTrack | null { return this.localVideoTrack }
  getLocalAudioTrack(): IMicrophoneAudioTrack | null { return this.localAudioTrack }
  getRemoteUsers(): IAgoraRTCRemoteUser[] { return Array.from(this.remoteUsers.values()) }
  isConnected(): boolean { return this.isJoined && this.client?.connectionState === 'CONNECTED' }

  destroy(): void {
    this.leave()
    this.eventHandlers = {}
    this.client = null
    this.lastTrackDisposalTime = 0
  }
}

// Export a singleton instance, but ensure it's safe for SSR
let instance: AgoraClient | null = null;
export const getAgoraClient = () => {
  if (typeof window === 'undefined') return null;
  if (!instance) instance = new AgoraClient();
  return instance;
};

// For backward compatibility but guarded
export const agoraClient = typeof window !== 'undefined' ? new AgoraClient() : ({} as AgoraClient);
