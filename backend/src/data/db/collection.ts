import { getDbConnection } from '@/data/db'
import { DbUser } from './types/user'
import { DbMatch } from './types/match'
import { DbInteraction } from './types/interaction'
import { DbMessage } from './types/message'
import { DbStagedCall, DbStagePrompt } from './types/staged-call'

export const getUserCollection = async () => {
  const db = await getDbConnection()
  return db.collection<DbUser>('users')
}

export const getInteractionCollection = async () => {
  const db = await getDbConnection()
  return db.collection<DbInteraction>('interactions')
}

export const getMatchCollection = async () => {
  const db = await getDbConnection()
  return db.collection<DbMatch>('matches')
}

export const getMessageCollection = async () => {
  const db = await getDbConnection()
  return db.collection<DbMessage>('messages')
}

export const getStagedCallCollection = async () => {
  const db = await getDbConnection()
  return db.collection<DbStagedCall>('staged_calls')
}

export const getStagePromptCollection = async () => {
  const db = await getDbConnection()
  return db.collection<DbStagePrompt>('stage_prompts')
}
