import { NormalizedEvent } from '@/shared/api/types'
import { chatService } from '@/features/chat/services/chat.service'
import { objectIdSchema } from '@shared/validations'
import { ServiceException } from '@/features/error'
import { HttpStatus } from '@/data/constants'
import { ApiErrorCode, ApiException } from '@/shared/api/error'
import { TranslationKey } from '@/features/localization/types'

const handler = async (event: NormalizedEvent) => {
  const { pathParameters: { matchId }, queryStringParameters, authorizerContext } = event

  const validMatchId = objectIdSchema.parse(matchId)
  const userId = authorizerContext?.principalId
  
  const limitParam = queryStringParameters?.limit
  const limitStr = Array.isArray(limitParam) ? limitParam[0] : limitParam
  const limit = limitStr ? parseInt(limitStr, 10) : 50

  const beforeParam = queryStringParameters?.before
  const before = Array.isArray(beforeParam) ? beforeParam[0] : beforeParam

  if (!userId) {
    throw new ApiException(HttpStatus.UNAUTHORIZED, ApiErrorCode.UNAUTHORIZED, {
      message: 'err.auth.unauthorized',
      isReadableMessage: true,
    })
  }

  try {
    const messages = await chatService.getMessages(validMatchId, userId, limit, before)
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
