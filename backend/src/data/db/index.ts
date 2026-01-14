import { Mongo } from '@/data/mongo'
import { Db } from 'mongodb'

const { MONGO_URL = '', MONGO_DB = '' } = process.env

const mongo = Mongo(MONGO_URL, MONGO_DB)

let dbConnection: Db | null = null
let dbConnectionPromise: Promise<Db> | null = null

export const getDbConnection = async () => {
  if (dbConnection) return dbConnection

  if (!dbConnectionPromise) {
    dbConnectionPromise = (async () => {
      await mongo.connect()
      dbConnection = await mongo.getDb()
      return dbConnection
    })()
  }

  return dbConnectionPromise
}

export const withMongoTransaction = mongo.withTransaction
