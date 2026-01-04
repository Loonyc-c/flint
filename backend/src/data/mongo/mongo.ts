import { isNonEmptyValue } from '@/utils'
import {
  Document,
  Collection,
  Db,
  DbOptions,
  MongoClient,
  MongoClientOptions,
  ClientSession,
  ClientSessionOptions,
  TransactionOptions,
} from 'mongodb'

export const MongoCollection: <T extends Document>(name: string) => (conn: Db) => Collection<T> = (
  name,
) => {
  return (conn) => {
    return conn.collection(name)
  }
}

type Mongo = (
  url: string,
  db: string,
  options?: MongoClientOptions,
) => {
  connect: () => Promise<MongoClient>
  disconnect: (force?: boolean) => Promise<void>
  getDb: (dbname?: string, options?: DbOptions) => Promise<Db>
  getSession: (options?: ClientSessionOptions) => Promise<ClientSession>
  withTransaction: <T>(
    callback: (session: ClientSession) => Promise<T>,
    options?: TransactionOptions,
  ) => Promise<T>
}

const MongoImpl: Mongo = (url, db, options = {}) => {
  if (!isNonEmptyValue(options.authMechanism)) {
    options.authMechanism = 'SCRAM-SHA-1'
  }
  const client = new MongoClient(url, options)
  return {
    connect: async () => {
      await client.connect()
      return client
    },
    disconnect: async (force) => {
      await client.close(force ?? false)
    },
    getDb: async (dbname, options) => {
      return client.db(dbname ?? db, options)
    },
    getSession: async (options) => {
      return client.startSession(options)
    },
    withTransaction: async (callback, options) => {
      const session = client.startSession()
      try {
        session.startTransaction(options)
        try {
          const ret = await callback(session)
          await session.commitTransaction()
          return ret
        } catch (e) {
          await session.abortTransaction()
          throw e
        }
      } finally {
        await session.endSession()
      }
    },
  }
}

export default MongoImpl
