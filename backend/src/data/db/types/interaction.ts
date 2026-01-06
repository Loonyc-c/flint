import { ObjectId, WithId } from 'mongodb'
import { BaseCollection, InteractionType } from '@shared/types'

export type Interaction = WithId<DbInteraction>
export type DbInteraction = BaseCollection & {
  actorId: ObjectId
  targetId: ObjectId
  type: InteractionType
  createdAt: Date
}
