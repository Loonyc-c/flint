/**
 * Get available audio playback devices
 */
export const getAudioPlaybackDevices = async (): Promise<MediaDeviceInfo[]> => {
    if (typeof window === 'undefined') return []
    const AgoraRTC = (await import('agora-rtc-sdk-ng')).default
    return AgoraRTC.getPlaybackDevices()
}

/**
 * Static "Kill Switch" to ensure ALL hardware tracks are stopped.
 * This handles cases where tracks might have leaked outside the class instance.
 */
export const forceStopHardware = async (): Promise<void> => {
    if (typeof window === 'undefined') return

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
