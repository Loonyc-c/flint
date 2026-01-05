import { NormalizedEvent } from '@/shared/api/types'
import { matchService } from '@/features/matches/services/match.service'
import { User } from '@/data/db/types/user'
import { swipeSchema } from '@shared/validations'

const handler = async (event: NormalizedEvent) => {
  const user = event.user as User
  const { targetId, type } = swipeSchema.parse(event.body)
  
  const result = await matchService.swipe(user._id.toHexString(), targetId, type)
  
  return result
}

export default handler
