import { NormalizedEvent } from '@/shared/api/types'
import { matchService } from '@/features/matches/services/match.service'
import { User } from '@/data/db/types/user'

const handler = async (event: NormalizedEvent) => {
  const user = event.user as User
  
  const matches = await matchService.getMatches(user._id.toHexString())
  
  return matches
}

export default handler
