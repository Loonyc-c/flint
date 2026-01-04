import { googleSchema } from '@shared/validations'
import { NormalizedEvent } from '@/shared/api/types'
import { authService } from '@/features/auth'
import { ServiceException } from '@/features/auth/services/error'
import { ApiErrorCode, ApiException } from '@/shared/api/error'
import { HttpStatus } from '@/data/constants'
import { TranslationKey } from '@/features/auth/services/localization/types'

const handler = async (event: NormalizedEvent) => {
  const { body } = event

  try {
    const { token: googleToken } = googleSchema.parse(body)
    const { user, isNewUser } = await authService.handleGoogleAuth(googleToken)

    const name = `${user.auth.lastName} ${user.auth.firstName}`

    const accessToken = authService.generateToken(user._id.toHexString(), {
      principalId: user._id.toHexString(),
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
