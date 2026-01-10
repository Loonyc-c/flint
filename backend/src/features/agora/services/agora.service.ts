import { RtcTokenBuilder, RtcRole } from 'agora-token'

const AGORA_APP_ID = process.env.AGORA_APP_ID
const AGORA_APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE

if (!AGORA_APP_ID) {
  console.warn('⚠️ AGORA_APP_ID not set - video calls will not work')
}

if (!AGORA_APP_CERTIFICATE) {
  console.warn('⚠️ AGORA_APP_CERTIFICATE not set - video calls will not work')
}

interface TokenRequest {
  channelName: string
  uid: number
  role?: 'publisher' | 'subscriber'
  expirationTimeInSeconds?: number
}

interface TokenResponse {
  token: string
  channelName: string
  uid: number
  appId: string
  expiresAt: number
}

export const agoraService = {
  /**
   * Generate an RTC token for Agora video/voice calls
   */
  generateToken: (request: TokenRequest): TokenResponse => {
    const {
      channelName,
      uid,
      role = 'publisher',
      expirationTimeInSeconds = 3600, // 1 hour default
    } = request

    if (!AGORA_APP_ID || !AGORA_APP_CERTIFICATE) {
      throw new Error('Agora credentials not configured')
    }

    // Calculate expiration timestamp
    const currentTimestamp = Math.floor(Date.now() / 1000)
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds

    // Determine role
    const agoraRole = role === 'publisher' ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER

    // Generate the token
    const token = RtcTokenBuilder.buildTokenWithUid(
      AGORA_APP_ID,
      AGORA_APP_CERTIFICATE,
      channelName,
      uid,
      agoraRole,
      privilegeExpiredTs,
      privilegeExpiredTs
    )

    console.log(`🎫 [Agora] Token generated for channel: ${channelName}, uid: ${uid}`)

    return {
      token,
      channelName,
      uid,
      appId: AGORA_APP_ID,
      expiresAt: privilegeExpiredTs,
    }
  },

  /**
   * Generate a unique numeric UID from a string user ID
   * Agora requires numeric UIDs
   */
  generateNumericUid: (userId: string): number => {
    // Convert hex string to a numeric value (take last 8 chars to fit in 32-bit)
    const hex = userId.slice(-8)
    return parseInt(hex, 16) % 2147483647 // Keep within 32-bit signed integer range
  },

  /**
   * Get App ID (for frontend config)
   */
  getAppId: (): string | undefined => {
    return AGORA_APP_ID
  },
}
