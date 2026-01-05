import { ObjectId } from 'mongodb'
import { InteractionType } from '@shared/types'

export interface DbInteraction {
  _id?: ObjectId
  actorId: ObjectId
  targetId: ObjectId
  type: InteractionType
  createdAt: Date
}
