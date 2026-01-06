import { NormalizedEvent } from '@/shared/api/types'
import { profileService } from '@/features/profile/services/profile.service'
import { ServiceException } from '@/features/error'
import { HttpStatus } from '@/data/constants'
import { ApiErrorCode, ApiException } from '@/shared/api/error'
import { TranslationKey } from '@/features/localization/types'
import { objectIdSchema } from '@/shared-types/validations'

const handler = async (event: NormalizedEvent) => {
  const {
    pathParameters: { id }
  } = event


  const _id = objectIdSchema.parse(id)

  try {
    const result = await profileService.getProfile(_id)
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
