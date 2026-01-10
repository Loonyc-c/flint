import { NormalizedEvent } from '@/shared/api/types'
import { chatService } from '@/features/chat/services/chat.service'
import { objectIdSchema } from '@shared/validations'
import { ServiceException } from '@/features/error'
import { HttpStatus } from '@/data/constants'
import { ApiErrorCode, ApiException } from '@/shared/api/error'
import { TranslationKey } from '@/features/localization/types'

const handler = async (event: NormalizedEvent) => {
  const { pathParameters: { matchId }, authorizerContext } = event

  const validMatchId = objectIdSchema.parse(matchId)
  const userId = authorizerContext?.principalId

  if (!userId) {
    throw new ApiException(HttpStatus.UNAUTHORIZED, ApiErrorCode.UNAUTHORIZED, {
      message: 'err.auth.unauthorized',
      isReadableMessage: true,
    })
  }

  try {
    const messages = await chatService.getMessages(validMatchId, userId)
    return messages
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
