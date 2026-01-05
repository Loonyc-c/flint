import { NormalizedEvent } from '@/shared/api/types'
import { ServiceException } from '@/features/error'
import { ApiErrorCode, ApiException } from '@/shared/api/error'
import { HttpStatus } from '@/data/constants'
import { loginSchema } from '@shared/validations'
import { authService } from '@/features/auth'
import { TranslationKey } from '@/features/localization/types'

const handler = async (event: NormalizedEvent) => {
  const { body } = event

  try {
    const { email, password } = loginSchema.parse(body)
    const user = await authService.authenticateUser(email, password)
    const name = `${user.auth.lastName} ${user.auth.firstName}`

    const accessToken = authService.generateToken(user._id.toHexString(), {
      userId: user._id.toHexString(),
      firstName: user.auth.firstName,
      lastName: user.auth.lastName,
      email: user.auth.email    })
    return {
      accessToken,
      name,
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
