import { Router } from 'express'
import createApiHandler from '@/shared/api/handler'
import { NormalizedEvent } from '@/shared/api/types'
import { agoraService } from './services/agora.service'
import { ApiErrorCode, ApiException } from '@/shared/api/error'
import { HttpStatus } from '@/data/constants'
import { z } from 'zod'

const router = Router()

// Validation schema
const tokenRequestSchema = z.object({
  channelName: z.string().min(1, 'Channel name is required'),
  role: z.enum(['publisher', 'subscriber']).optional(),
})

/**
 * POST /agora/token
 * Generate an Agora RTC token for video/voice calls
 */
const generateToken = async (event: NormalizedEvent) => {
  const { body, authorizerContext } = event

  if (!authorizerContext?.principalId) {
    throw new ApiException(HttpStatus.UNAUTHORIZED, ApiErrorCode.UNAUTHORIZED, {
      message: 'err.auth.unauthorized',
      isReadableMessage: true,
    })
  }

  const { channelName, role } = tokenRequestSchema.parse(body)
  const userId = authorizerContext.principalId

  // Generate numeric UID from user ID
  const uid = agoraService.generateNumericUid(userId)

  try {
    const tokenData = agoraService.generateToken({
      channelName,
      uid,
      role,
      expirationTimeInSeconds: 3600, // 1 hour
    })

    return tokenData
  } catch (error) {
    console.error('[Agora] Token generation failed:', error)
    throw new ApiException(HttpStatus.INTERNAL_ERROR, ApiErrorCode.INTERNAL_ERROR, {
      message: 'err.system.internal_error',
      isReadableMessage: true,
    })
  }
}

/**
 * GET /agora/config
 * Get Agora configuration (App ID) for frontend
 */
const getConfig = async (_event: NormalizedEvent) => {
  const appId = agoraService.getAppId()

  if (!appId) {
    throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, ApiErrorCode.INTERNAL_ERROR, {
      message: 'err.system.service_unavailable',
      isReadableMessage: true,
    })
  }

  return { appId }
}

router.post('/agora/token', createApiHandler(generateToken))
router.get('/agora/config', createApiHandler(getConfig))

export default router
