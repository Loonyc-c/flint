import { getDbConnection } from '@/data/db'
import { DbUser } from './types/user'

export const getUserCollection = async () => {
  const db = await getDbConnection()
  return db.collection<DbUser>('users')
}
