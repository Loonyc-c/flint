import { Server } from 'socket.io'
import { STAGED_CALL_CONSTANTS, MatchStage } from '@shared/types'
import { getUserCollection, getMatchCollection } from '@/data/db/collection'
import { ObjectId } from 'mongodb'
import { stagedCallService } from '@/features/staged-call'
import { busyStateService } from './busy-state.service'
import { icebreakerService } from './icebreaker.service'

export interface ActiveStagedCall {
  matchId: string
  stage: 1 | 2
  callerId: string
  calleeId: string
  channelName: string
  startTime: Date
  duration: number
  timerId?: NodeJS.Timeout
  ringTimeoutId?: NodeJS.Timeout
  icebreakerTimerId?: NodeJS.Timeout
}

export const activeStagedCalls = new Map<string, ActiveStagedCall>()
export const activePrompts = new Map<string, { timeoutId: NodeJS.Timeout, userIds: string[] }>()

/**
 * Logic helpers for staged calls to keep handlers lean
 */
export const stagedCallLogic = {
  /**
   * Universal cleanup for a staged call session
   */
  clearCall: (matchId: string) => {
    const call = activeStagedCalls.get(matchId)
    if (!call) return null

    if (call.ringTimeoutId) clearTimeout(call.ringTimeoutId)
    if (call.timerId) clearTimeout(call.timerId)
    if (call.icebreakerTimerId) clearTimeout(call.icebreakerTimerId)

    busyStateService.clearUserStatus(call.callerId)
    busyStateService.clearUserStatus(call.calleeId)
    activeStagedCalls.delete(matchId)
    stagedCallService.endStagedCall(matchId)

    return call
  },

  /**
   * Handle call completion when timer runs out
   */
  handleCallComplete: async (io: Server, matchId: string) => {
    const call = activeStagedCalls.get(matchId)
    if (!call) return

    if (call.icebreakerTimerId) clearTimeout(call.icebreakerTimerId)
    activeStagedCalls.delete(matchId)
    await stagedCallService.endStagedCall(matchId, call.duration)

    busyStateService.clearUserStatus(call.callerId)
    busyStateService.clearUserStatus(call.calleeId)

    console.log(`🔔 [StagedCall] Stage ${call.stage} call complete in match ${matchId}`)

    const nextStageNum = call.stage + 1
    io.to(`user:${call.callerId}`).emit('staged-call-ended', { matchId, stage: call.stage, promptNextStage: true })
    io.to(`user:${call.calleeId}`).emit('staged-call-ended', { matchId, stage: call.stage, promptNextStage: true })

    const match = await getMatchCollection().then(c => c.findOne({ _id: new ObjectId(matchId) }))
    if (match) {
      await stagedCallService.createStagePrompt(matchId, call.stage, match.users)
      const expiresAt = new Date(Date.now() + STAGED_CALL_CONSTANTS.PROMPT_TIMEOUT).toISOString()
      io.to(`user:${call.callerId}`).emit('stage-prompt', { matchId, fromStage: call.stage, nextStage: nextStageNum, expiresAt })
      io.to(`user:${call.calleeId}`).emit('stage-prompt', { matchId, fromStage: call.stage, nextStage: nextStageNum, expiresAt })

      const timeoutId = setTimeout(async () => {
        activePrompts.delete(matchId)
        await stagedCallLogic.handlePromptResult(io, matchId, false, match.stage)
      }, STAGED_CALL_CONSTANTS.PROMPT_TIMEOUT)
      activePrompts.set(matchId, { timeoutId, userIds: match.users })
    }
  },

  /**
   * Trigger AI Wingman Icebreakers
   */
  triggerIcebreakers: async (io: Server, matchId: string) => {
    const call = activeStagedCalls.get(matchId)
    if (!call) return

    try {
      const questions = await icebreakerService.generateIcebreakers(call.callerId, call.calleeId)
      if (questions.length > 0) {
        const payload = { matchId, questions, timestamp: new Date().toISOString() }
        io.to(`user:${call.callerId}`).emit('staged-call-icebreaker', payload)
        io.to(`user:${call.calleeId}`).emit('staged-call-icebreaker', payload)
      }
      call.icebreakerTimerId = setTimeout(() => stagedCallLogic.triggerIcebreakers(io, matchId), 45000)
    } catch (error) {
      console.error('Error triggering icebreakers:', error)
    }
  },

  /**
   * Handle stage prompt result
   */
  handlePromptResult: async (io: Server, matchId: string, bothAccepted: boolean, currentStage: MatchStage) => {
    const match = await getMatchCollection().then(c => c.findOne({ _id: new ObjectId(matchId) }))
    if (!match) return

    if (bothAccepted) {
      const newStage = stagedCallService.getNextStage(currentStage)
      await stagedCallService.updateMatchStage(matchId, newStage)
      if (newStage === 'unlocked') await stagedCallLogic.triggerContactExchange(io, matchId, match.users)
    }

    const nextStage = bothAccepted ? (currentStage === 'fresh' ? 2 : 3) : null
    match.users.forEach(uid => io.to(`user:${uid}`).emit('stage-prompt-result', { matchId, bothAccepted, nextStage }))
  },

  /**
   * Trigger contact exchange reveal
   */
  triggerContactExchange: async (io: Server, matchId: string, userIds: string[]) => {
    const userCollection = await getUserCollection()
    const users = await userCollection.find({ _id: { $in: userIds.map(id => new ObjectId(id)) } }).toArray()
    const expiresAt = new Date(Date.now() + STAGED_CALL_CONSTANTS.CONTACT_DISPLAY_DURATION).toISOString()

    for (const user of users) {
      const partnerId = userIds.find(id => id !== user._id.toHexString())
      const partner = users.find(u => u._id.toHexString() === partnerId)
      io.to(`user:${user._id.toHexString()}`).emit('contact-exchange', {
        matchId,
        partnerContact: partner?.contactInfo || {},
        expiresAt,
      })
    }
  }
}
