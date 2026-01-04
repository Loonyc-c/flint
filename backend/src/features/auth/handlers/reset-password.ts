import { resetPasswordSchema } from '@shared/validations'
import { NormalizedEvent } from '@/shared/api/types'
import { authService } from '@/features/auth'

const handler = async (event: NormalizedEvent) => {
  const {
    body,
    pathParameters: { token },
  } = event

  const { password } = resetPasswordSchema.parse(body)

  await authService.resetPassword(token, password)

  return {
    message: 'Password has been reset successfully.',
  }
}

export default handler
