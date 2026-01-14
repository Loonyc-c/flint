import { NormalizedEvent } from '@/shared/api/types'
import { chatService } from '@/features/chat/services/chat.service'
import { objectIdSchema, sendMessageSchema } from '@shared/validations'
import { ServiceException } from '@/features/error'
import { HttpStatus } from '@/data/constants'
import { ApiErrorCode, ApiException } from '@/shared/api/error'
import { TranslationKey } from '@/features/localization/types'

const handler = async (event: NormalizedEvent) => {
  const { pathParameters: { matchId }, body, authorizerContext } = event

  const validMatchId = objectIdSchema.parse(matchId)
  const { text } = sendMessageSchema.parse(body)
  const userId = authorizerContext?.principalId

  if (!userId) {
    throw new ApiException(HttpStatus.UNAUTHORIZED, ApiErrorCode.UNAUTHORIZED, {
      message: 'err.auth.unauthorized',
      isReadableMessage: true,
    })
  }

  try {
    const message = await chatService.sendMessage(validMatchId, userId, text)
    return message
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
