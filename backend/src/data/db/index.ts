import { Mongo } from '@/data/mongo'
import { Db } from 'mongodb'

const { MONGO_URL = '', MONGO_DB = '' } = process.env

const mongo = Mongo(MONGO_URL, MONGO_DB)

let dbConnection: Db | null = null

export const getDbConnection = async () => {
  if (!dbConnection) {
    await mongo.connect()
    dbConnection = await mongo.getDb()
  }
  return dbConnection
}

export const withMongoTransaction = mongo.withTransaction
