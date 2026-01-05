import { NormalizedEvent } from '@/shared/api/types'
import { matchService } from '@/features/matches/services/match.service'
import { User } from '@/data/db/types/user'

const handler = async (event: NormalizedEvent) => {
  const user = event.user as User
  const limit = event.query.limit ? parseInt(event.query.limit as string) : 20

  const candidates = await matchService.getCandidates(user._id.toHexString(), limit)

  return candidates
}

export default handler
