import AgoraRTC, { type IMicrophoneAudioTrack, type ICameraVideoTrack } from 'agora-rtc-sdk-ng'

/**
 * Create audio track with retry logic
 */
export const createAudioTrackWithRetry = async (maxRetries = 3): Promise<IMicrophoneAudioTrack> => {
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
export const createVideoTrackWithRetry = async (maxRetries = 2): Promise<ICameraVideoTrack> => {
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
