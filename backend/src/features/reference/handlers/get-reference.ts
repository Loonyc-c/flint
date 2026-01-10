import { NormalizedEvent } from '@/shared/api/types'
import { referenceService } from '@/features/reference/services/reference.service'
import { ServiceException } from '@/features/error'
import { HttpStatus } from '@/data/constants'
import { ApiErrorCode, ApiException } from '@/shared/api/error'
import { TranslationKey } from '@/features/localization/types'
import { objectIdSchema } from '@shared/validations'

const handler = async (event: NormalizedEvent) => {
  const {
    pathParameters: { id },
    authorizerContext
  } = event

  if (id !== authorizerContext?.principalId) {
    throw new ApiException(HttpStatus.FORBIDDEN, ApiErrorCode.FORBIDDEN, {
      message: 'err.auth.permission_denied',
      isReadableMessage: true,
    })
  }

  const _id = objectIdSchema.parse(id)

  try {
    const result = await referenceService.getReference(_id)
    return result
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
