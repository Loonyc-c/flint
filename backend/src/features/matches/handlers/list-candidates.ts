import { NormalizedEvent } from '@/shared/api/types'
import { matchService } from '@/features/matches/services/match.service'
// Requirement 7: Standardized import to use @shared/validations for consistency
import { objectIdSchema, listSchema } from '@shared/validations'
import { ServiceException } from '@/features/error'
import { ApiErrorCode, ApiException } from '@/shared/api/error'
import { HttpStatus } from '@/data/constants'
import { TranslationKey } from '@/features/localization/types'

const handler = async (event: NormalizedEvent) => {
  const {
    pathParameters: { id },
    body,
    authorizerContext,
  } = event

  if (id !== authorizerContext?.principalId) {
    throw new ApiException(HttpStatus.FORBIDDEN, ApiErrorCode.FORBIDDEN, {
      message: 'err.auth.permission_denied',
      isReadableMessage: true,
    })
  }

  const _id = objectIdSchema.parse(id)

  const req = listSchema.parse(body)
  try {
    const candidates = await matchService.getCandidates(_id, req)

    return candidates
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
