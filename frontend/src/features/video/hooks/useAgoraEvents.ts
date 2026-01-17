import { useEffect, type MutableRefObject, type Dispatch, type SetStateAction } from 'react'
import type { IRemoteVideoTrack } from 'agora-rtc-sdk-ng'
import type { AgoraClient } from '../lib/agora-client'

interface UseAgoraEventsOptions {
    clientRef: MutableRefObject<AgoraClient | null>
    setRemoteVideoTracks: Dispatch<SetStateAction<Map<number, IRemoteVideoTrack>>>
    onUserJoined?: (uid: number) => void
    onUserLeft?: (uid: number) => void
    onRemoteVideoAdded?: (uid: number, track: IRemoteVideoTrack) => void
    onRemoteVideoRemoved?: (uid: number) => void
}

export const useAgoraEvents = ({
    clientRef,
    setRemoteVideoTracks,
    onUserJoined,
    onUserLeft,
    onRemoteVideoAdded,
    onRemoteVideoRemoved,
}: UseAgoraEventsOptions) => {
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
    }, [
        clientRef,
        setRemoteVideoTracks, // Ensure this setter is stable (useState setter always is)
        onUserJoined,
        onUserLeft,
        onRemoteVideoAdded,
        onRemoteVideoRemoved
    ])
}
