import { NormalizedEvent } from '@/shared/api/types'
import { matchService } from '@/features/matches/services/match.service'
// Requirement 7: Standardized import to use @shared/validations for consistency
import { objectIdSchema } from '@shared/validations'
import { ServiceException } from '@/features/error'
import { HttpStatus } from '@/data/constants'
import { ApiErrorCode, ApiException } from '@/shared/api/error'
import { TranslationKey } from '@/features/localization/types'

const handler = async (event: NormalizedEvent) => {
  const { pathParameters: {id}, queryStringParameters, authorizerContext } = event

  if (id !== authorizerContext?.principalId) {
    throw new ApiException(HttpStatus.FORBIDDEN, ApiErrorCode.FORBIDDEN, {
      message: 'err.auth.permission_denied',
      isReadableMessage: true,
    })
  }

  const _id = objectIdSchema.parse(id)
  
  const limitParam = queryStringParameters?.limit
  const limitStr = Array.isArray(limitParam) ? limitParam[0] : limitParam
  const limit = limitStr ? parseInt(limitStr, 10) : 20

  const offsetParam = queryStringParameters?.offset
  const offsetStr = Array.isArray(offsetParam) ? offsetParam[0] : offsetParam
  const offset = offsetStr ? parseInt(offsetStr, 10) : 0

  try {
    const matches = await matchService.getMatches(_id, limit, offset)

    return matches
  } catch (e: unknown) {
    if (e instanceof ServiceException) {
      throw new ApiException(HttpStatus.BAD_REQUEST, ApiErrorCode.BAD_REQUEST, {
        message: e.message as TranslationKey,
        isReadableMessage: true,
      })
    }
    throw e
  }
}

export default handler
