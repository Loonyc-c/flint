import { NormalizedEvent } from '@/shared/api/types'
import { profileService } from '@/features/profile/services/profile.service'
import { User } from '@/data/db/types/user'
import { profileCreationSchema } from '@shared/validations'
import { ServiceException } from '@/features/error'
import { ApiErrorCode, ApiException } from '@/shared/api/error'
import { HttpStatus } from '@/data/constants'
import { TranslationKey } from '@/features/localization/types'

const handler = async (event: NormalizedEvent) => {
  const user = event.user as User
  const body = profileCreationSchema.parse(event.body)

  try {
    const result = await profileService.createProfile(user._id.toHexString(), body)

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
