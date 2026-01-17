import type { IMicrophoneAudioTrack, ICameraVideoTrack, IRemoteVideoTrack } from 'agora-rtc-sdk-ng'

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
