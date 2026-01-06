import { NormalizedEvent } from '@/shared/api/types'
import { matchService } from '@/features/matches/services/match.service'
import { objectIdSchema } from '@/shared-types/validations'
import { ServiceException } from '@/features/error'
import { ApiErrorCode, ApiException } from '@/shared/api/error'
import { HttpStatus } from '@/data/constants'
import { TranslationKey } from '@/features/localization/types'
import { listSchema } from '@/shared-types/validations/match.validation'

const handler = async (event: NormalizedEvent) => {
  const {
    pathParameters: { id },
    body,
  } = event

  const _id = objectIdSchema.parse(id)

  const req = listSchema.parse(body)
  try {
    const candidates = await matchService.getCandidates(_id, req)

    return candidates
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
