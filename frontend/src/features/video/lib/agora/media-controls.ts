import AgoraRTC, {
    type IMicrophoneAudioTrack,
    type ICameraVideoTrack,
    type IAgoraRTCClient
} from 'agora-rtc-sdk-ng'

export async function toggleMicrophone(track: IMicrophoneAudioTrack | null): Promise<boolean> {
    if (!track) return false
    const enabled = track.enabled
    await track.setEnabled(!enabled)
    return !enabled
}

export async function toggleCamera(track: ICameraVideoTrack | null): Promise<boolean> {
    if (!track) return false
    const enabled = track.enabled
    await track.setEnabled(!enabled)
    return !enabled
}

export async function enableVideo(
    client: IAgoraRTCClient | null,
    currentTrack: ICameraVideoTrack | null
): Promise<ICameraVideoTrack | null> {
    if (currentTrack) return currentTrack
    try {
        const newTrack = await AgoraRTC.createCameraVideoTrack()
        await client?.publish([newTrack])
        return newTrack
    } catch {
        return null
    }
}

export async function disableVideo(
    client: IAgoraRTCClient | null,
    track: ICameraVideoTrack | null
): Promise<ICameraVideoTrack | null> {
    if (!track) return null
    try {
        await client?.unpublish([track])
        track.stop()
        track.close()
        return null
    } catch {
        return track
    }
}

export async function muteLocalTracks(
    audioTrack: IMicrophoneAudioTrack | null,
    videoTrack: ICameraVideoTrack | null
): Promise<void> {
    await audioTrack?.setEnabled(false)
    await videoTrack?.setEnabled(false)
}

export async function unmuteLocalTracks(
    audioTrack: IMicrophoneAudioTrack | null,
    videoTrack: ICameraVideoTrack | null,
    audio = true,
    video = false
): Promise<void> {
    if (audio) await audioTrack?.setEnabled(true)
    if (video) await videoTrack?.setEnabled(true)
}
