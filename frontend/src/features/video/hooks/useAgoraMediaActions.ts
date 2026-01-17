import { useCallback, type MutableRefObject, type Dispatch, type SetStateAction } from 'react'
import type { ICameraVideoTrack } from 'agora-rtc-sdk-ng'
import type { AgoraClient } from '../lib/agora-client'

interface UseAgoraMediaActionsProps {
    clientRef: MutableRefObject<AgoraClient | null>
    isCameraEnabled: boolean
    setIsMicEnabled: Dispatch<SetStateAction<boolean>>
    setIsCameraEnabled: Dispatch<SetStateAction<boolean>>
    setLocalVideoTrack: Dispatch<SetStateAction<ICameraVideoTrack | null>>
}

export const useAgoraMediaActions = ({
    clientRef,
    isCameraEnabled,
    setIsMicEnabled,
    setIsCameraEnabled,
    setLocalVideoTrack,
}: UseAgoraMediaActionsProps) => {

    // Mute all (Pause)
    const muteAll = useCallback(async (): Promise<void> => {
        if (!clientRef.current) return
        await clientRef.current.muteLocalTracks()
        setIsMicEnabled(false)
        setIsCameraEnabled(false)
    }, [clientRef, setIsMicEnabled, setIsCameraEnabled])

    // Unmute all (Resume)
    const unmuteAll = useCallback(async (audio = true, video = false): Promise<void> => {
        if (!clientRef.current) return
        await clientRef.current.unmuteLocalTracks(audio, video)
        setIsMicEnabled(audio)
        setIsCameraEnabled(video)
    }, [clientRef, setIsMicEnabled, setIsCameraEnabled])

    // Toggle microphone
    const toggleMic = useCallback(async (): Promise<void> => {
        if (!clientRef.current) return

        try {
            const enabled = await clientRef.current.toggleMicrophone()
            setIsMicEnabled(enabled)
        } catch (err) {
            console.error('[useAgora] Error toggling mic:', err)
        }
    }, [clientRef, setIsMicEnabled])

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
    }, [clientRef, isCameraEnabled, setLocalVideoTrack, setIsCameraEnabled])

    return {
        muteAll,
        unmuteAll,
        toggleMic,
        toggleCamera
    }
}
