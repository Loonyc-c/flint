import { forgetPasswordSchema } from '@shared/validations'
import { NormalizedEvent } from '@/shared/api/types'
import { authService } from '@/features/auth'

const handler = async (event: NormalizedEvent) => {
  const { body } = event

  const { email } = forgetPasswordSchema.parse(body)

  await authService.forgetPassword(email)

  return {
    message: 'If an account with that email exists, a password reset link has been sent.',
  }
}

export default handler
