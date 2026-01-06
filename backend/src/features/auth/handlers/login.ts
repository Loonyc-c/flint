import { NormalizedEvent } from '@/shared/api/types'
import { ServiceException } from '@/features/error'
import { ApiErrorCode, ApiException } from '@/shared/api/error'
import { HttpStatus } from '@/data/constants'
import { loginSchema } from '@shared/validations'
import { authService } from '@/features/auth'
import { TranslationKey } from '@/features/localization/types'
import { LoginResponse } from '@shared/types'

const handler = async (event: NormalizedEvent): Promise<LoginResponse> => {
  const { body } = event

  try {
    const { email, password } = loginSchema.parse(body)
    const user = await authService.authenticateUser(email, password)

    const accessToken = authService.generateToken(user._id.toHexString(), {
      userId: user._id.toHexString(),
      firstName: user.auth.firstName,
      lastName: user.auth.lastName,
      email: user.auth.email,
      subScription: user.subScription,
    })

    // Requirement 2: Return response matching LoginResponse type from shared/types
    return {
      accessToken,
      user: {
        id: user._id.toHexString(),
        email: user.auth.email,
        firstName: user.auth.firstName,
        lastName: user.auth.lastName,
        name: `${user.auth.firstName} ${user.auth.lastName}`,
      },
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
