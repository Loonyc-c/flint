import { getMatchCollection, getStagedCallCollection, getStagePromptCollection } from '@/data/db/collection'
import { DbStagedCall, DbStagePrompt } from '@/data/db/types/staged-call'
import { MatchStage, STAGED_CALL_CONSTANTS } from '@shared/types'
import { ObjectId } from 'mongodb'
import { withMongoTransaction } from '@/data/db'

export const stagedCallService = {
  /**
   * Get the current stage of a match
   */
  getMatchStage: async (matchId: string): Promise<MatchStage> => {
    const matchCollection = await getMatchCollection()
    const match = await matchCollection.findOne({ _id: new ObjectId(matchId) })
    return match?.stage || 'fresh'
  },

  /**
   * Update match stage after successful stage completion
   */
  updateMatchStage: async (matchId: string, newStage: MatchStage): Promise<void> => {
    const matchCollection = await getMatchCollection()
    const updates: Record<string, unknown> = {
      stage: newStage,
      updatedAt: new Date(),
    }
    
    if (newStage === 'unlocked') {
      updates.contactExchangedAt = new Date()
    }
    
    await matchCollection.updateOne(
      { _id: new ObjectId(matchId) },
      { $set: updates }
    )
  },

  /**
   * Create a new staged call session
   */
  createStagedCall: async (data: Omit<DbStagedCall, 'createdAt' | 'updatedAt' | 'isDeleted' | 'createdBy' | 'updatedBy'>): Promise<string> => {
    const collection = await getStagedCallCollection()
    const stagedCall: DbStagedCall = {
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
      isDeleted: false,
      createdBy: data.callerId,
      updatedBy: data.callerId,
    }
    const result = await collection.insertOne(stagedCall)
    return result.insertedId.toHexString()
  },

  /**
   * Update staged call status
   */
  updateStagedCallStatus: async (
    matchId: string,
    status: DbStagedCall['status'],
    updates?: Partial<DbStagedCall>
  ): Promise<void> => {
    const collection = await getStagedCallCollection()
    await collection.updateOne(
      { matchId, status: { $ne: 'ended' } },
      { $set: { status, updatedAt: new Date(), ...updates } }
    )
  },

  /**
   * Get active staged call for a match
   */
  getActiveStagedCall: async (matchId: string): Promise<DbStagedCall | null> => {
    const collection = await getStagedCallCollection()
    return collection.findOne({ matchId, status: { $in: ['ringing', 'active'] } })
  },

  /**
   * End a staged call
   */
  endStagedCall: async (matchId: string, actualDuration?: number): Promise<void> => {
    const collection = await getStagedCallCollection()
    await collection.updateOne(
      { matchId, status: { $ne: 'ended' } },
      { $set: { status: 'ended', endTime: new Date(), actualDuration, updatedAt: new Date() } }
    )
  },

  /**
   * Create a stage prompt for transitioning to next stage
   */
  createStagePrompt: async (matchId: string, fromStage: 1 | 2, userIds: string[]): Promise<string> => {
    const collection = await getStagePromptCollection()
    const responses: Record<string, null> = {}
    userIds.forEach(id => { responses[id] = null })
    
    const prompt: DbStagePrompt = {
      matchId,
      fromStage,
      responses,
      expiresAt: new Date(Date.now() + STAGED_CALL_CONSTANTS.PROMPT_TIMEOUT),
      createdAt: new Date(),
      updatedAt: new Date(),
      isDeleted: false,
      createdBy: userIds[0],
      updatedBy: userIds[0],
    }
    const result = await collection.insertOne(prompt)
    return result.insertedId.toHexString()
  },

  /**
   * Record a user's response to a stage prompt
   */
  respondToPrompt: async (
    matchId: string,
    userId: string,
    accepted: boolean
  ): Promise<{ bothResponded: boolean; bothAccepted: boolean }> => {
    return await withMongoTransaction(async (session) => {
      const collection = await getStagePromptCollection()
      const prompt = await collection.findOne(
        { matchId, resolvedAt: { $exists: false } },
        { session }
      )
      
      if (!prompt) {
        return { bothResponded: false, bothAccepted: false }
      }

      // Update the specific user's response atomically in memory first within transaction context
      const currentResponses = { ...prompt.responses, [userId]: accepted }
      
      const responsesList = Object.values(currentResponses)
      const bothResponded = responsesList.every(r => r !== null)
      const bothAccepted = responsesList.every(r => r === true)

      const updateData: Partial<DbStagePrompt> = {
        responses: currentResponses,
        updatedAt: new Date(),
      }

      if (bothResponded) {
        updateData.resolvedAt = new Date()
        updateData.result = bothAccepted ? 'both_accepted' : 'declined'
      }

      await collection.updateOne(
        { _id: prompt._id },
        { $set: updateData },
        { session }
      )
      
      return { bothResponded, bothAccepted }
    })
  },

  /**
   * Get the duration for a given stage
   */
  getStageDuration: (stage: 1 | 2): number => {
    return stage === 1 
      ? STAGED_CALL_CONSTANTS.STAGE1_DURATION 
      : STAGED_CALL_CONSTANTS.STAGE2_DURATION
  },

  /**
   * Check if user can initiate a staged call based on match stage
   */
  canInitiateStage: (matchStage: MatchStage, requestedStage: 1 | 2): boolean => {
    if (requestedStage === 1) {
      return matchStage === 'fresh'
    }
    if (requestedStage === 2) {
      return matchStage === 'stage1_complete'
    }
    return false
  },

  /**
   * Get the next stage after completing a stage prompt
   */
  getNextStage: (currentStage: MatchStage): MatchStage => {
    const stageMap: Record<MatchStage, MatchStage> = {
      'fresh': 'stage1_complete',
      'stage1_complete': 'unlocked', // Video call (Stage 2) completion leads to Unlocked
      'stage2_complete': 'unlocked',
      'unlocked': 'unlocked',
    }
    return stageMap[currentStage]
  },
}
