import { NormalizedEvent } from '@/shared/api/types'
import { matchService } from '@/features/matches/services/match.service'
import { objectIdSchema } from '@shared/validations'
import { ServiceException } from '@/features/error'
import { HttpStatus } from '@/data/constants'
import { ApiErrorCode, ApiException } from '@/shared/api/error'
import { TranslationKey } from '@/features/localization/types'

const handler = async (event: NormalizedEvent) => {
  const { pathParameters: { id }, authorizerContext } = event

  if (id !== authorizerContext?.principalId) {
    throw new ApiException(HttpStatus.FORBIDDEN, ApiErrorCode.FORBIDDEN, {
      message: 'err.auth.permission_denied',
      isReadableMessage: true,
    })
  }

  const _id = objectIdSchema.parse(id)

  try {
    const likes = await matchService.getLikes(_id)
    return likes
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
