import { NormalizedEvent } from '@/shared/api/types'
import { stagedCallService } from '../services/staged-call.service'
import { objectIdSchema } from '@shared/validations'
import { HttpStatus } from '@/data/constants'
import { ApiErrorCode, ApiException } from '@/shared/api/error'
import { getMatchCollection } from '@/data/db/collection'
import { ObjectId } from 'mongodb'

interface GetMatchStageResponse {
  matchId: string
  stage: string
  contactExchangedAt?: string
}

const handler = async (event: NormalizedEvent): Promise<GetMatchStageResponse> => {
  const { pathParameters: { matchId }, authorizerContext } = event
  const userId = authorizerContext?.principalId

  if (!userId) {
    throw new ApiException(HttpStatus.UNAUTHORIZED, ApiErrorCode.UNAUTHORIZED, {
      message: 'Unauthorized',
    })
  }

  // Validate matchId
  const validMatchId = objectIdSchema.parse(matchId)

  // Verify user is part of this match
  const matchCollection = await getMatchCollection()
  const match = await matchCollection.findOne({ _id: new ObjectId(validMatchId) })

  if (!match) {
    throw new ApiException(HttpStatus.NOT_FOUND, ApiErrorCode.NOT_FOUND, {
      message: 'Match not found',
    })
  }

  if (!match.users.includes(userId)) {
    throw new ApiException(HttpStatus.FORBIDDEN, ApiErrorCode.FORBIDDEN, {
      message: 'You are not part of this match',
    })
  }

  const stage = await stagedCallService.getMatchStage(validMatchId)

  return {
    matchId: validMatchId,
    stage,
    contactExchangedAt: match.contactExchangedAt?.toISOString(),
  }
}

export default handler
