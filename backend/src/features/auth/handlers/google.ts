import { googleSchema } from '@shared/validations'
import { NormalizedEvent } from '@/shared/api/types'
import { authService } from '@/features/auth'
import { ServiceException } from '@/features/error'
import { ApiErrorCode, ApiException } from '@/shared/api/error'
import { HttpStatus } from '@/data/constants'
import { TranslationKey } from '@/features/localization/types'

const handler = async (event: NormalizedEvent) => {
  const { body } = event

  try {
    const { token: googleToken } = googleSchema.parse(body)
    const { user, isNewUser } = await authService.handleGoogleAuth(googleToken)

    const name = user.profile?.nickName || 'User'

    const accessToken = authService.generateToken(user._id.toHexString(), {
      userId: user._id.toHexString(),
      email: user.auth.email,
      subscription: user.subscription,
    })

    return {
      accessToken,
      name,
      isNewUser,
      message: isNewUser ? 'User created successfully' : 'Login successful',
    }
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
