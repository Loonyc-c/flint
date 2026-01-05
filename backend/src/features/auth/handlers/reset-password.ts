import { resetPasswordSchema } from '@shared/validations'
import { NormalizedEvent } from '@/shared/api/types'
import { authService } from '@/features/auth'
import { ServiceException } from '@/features/error'
import { HttpStatus } from '@/data/constants'
import { ApiErrorCode, ApiException } from '@/shared/api/error'
import { TranslationKey } from '@/features/localization/types'

const handler = async (event: NormalizedEvent) => {
  const {
    body,
    pathParameters: { token },
  } = event

  const { password } = resetPasswordSchema.parse(body)

  try {
    await authService.resetPassword(token, password)
  } catch (e: unknown) {
    if (e instanceof ServiceException) {
      throw new ApiException(HttpStatus.BAD_REQUEST, ApiErrorCode.BAD_REQUEST, {
        message: e.message as TranslationKey,
        isReadableMessage: true,
      })
    }
    throw e
  }

  return {
    message: 'Password has been reset successfully.',
  }
}

export default handler
