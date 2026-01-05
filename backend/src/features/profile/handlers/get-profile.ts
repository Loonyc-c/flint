import { NormalizedEvent } from '@/shared/api/types'
import { profileService } from '@/features/profile/services/profile.service'
import { User } from '@/data/db/types/user'
import { ServiceException } from '@/features/error'
import { HttpStatus } from '@/data/constants'
import { ApiErrorCode, ApiException } from '@/shared/api/error'
import { TranslationKey } from '@/features/localization/types'

const handler = async (event: NormalizedEvent) => {
  const user = event.user as User

  try {
    const result = await profileService.getProfile(user._id.toHexString())
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
