import type { IAgoraRTCClient, IAgoraRTCRemoteUser } from 'agora-rtc-sdk-ng'
import type { AgoraEventHandlers } from './types'

/**
 * Subscribe to an existing user's tracks
 */
export const subscribeToExistingUser = async (
    client: IAgoraRTCClient,
    user: IAgoraRTCRemoteUser,
    handlers: AgoraEventHandlers
): Promise<void> => {
    try {
        if (user.hasAudio) {
            await client.subscribe(user, 'audio')
            user.audioTrack?.play()
        }
        if (user.hasVideo) {
            await client.subscribe(user, 'video')
            if (user.videoTrack) {
                handlers.onRemoteVideoAdded?.(user.uid as number, user.videoTrack)
            }
        }
    } catch (error) {
        console.error('[Agora] Error subscribing to existing user:', user.uid, error)
    }
}

/**
 * Set up event listeners for remote users
 */
export const setupEventListeners = (
    client: IAgoraRTCClient,
    remoteUsers: Map<number, IAgoraRTCRemoteUser>,
    handlers: AgoraEventHandlers
): void => {
    // User joined channel
    client.on('user-joined', (user) => {
        remoteUsers.set(user.uid as number, user)
        handlers.onUserJoined?.(user.uid as number)
    })

    // User published media
    client.on('user-published', async (user, mediaType) => {
        try {
            await client.subscribe(user, mediaType)

            remoteUsers.set(user.uid as number, user)

            if (mediaType === 'audio') {
                const remoteAudioTrack = user.audioTrack
                remoteAudioTrack?.play()
            }

            if (mediaType === 'video') {
                const remoteVideoTrack = user.videoTrack
                if (remoteVideoTrack) {
                    handlers.onRemoteVideoAdded?.(user.uid as number, remoteVideoTrack)
                }
            }
        } catch (error) {
            console.error('[Agora] Error subscribing to user:', user.uid, error)
        }
    })

    // User unpublished media
    client.on('user-unpublished', (user, mediaType) => {
        if (mediaType === 'video') {
            handlers.onRemoteVideoRemoved?.(user.uid as number)
        }
    })

    // User left channel
    client.on('user-left', (user) => {
        remoteUsers.delete(user.uid as number)
        handlers.onUserLeft?.(user.uid as number)
    })
}
