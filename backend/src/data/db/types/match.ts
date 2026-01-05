import { ObjectId } from 'mongodb'

export interface DbMatch {
  _id?: ObjectId
  users: ObjectId[]
  createdAt: Date
  updatedAt: Date
}
