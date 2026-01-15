import { Server } from 'socket.io'
import { AuthenticatedSocket } from '../middleware/auth.middleware'
import { stagedCallService } from '@/features/staged-call'
import { STAGED_CALL_CONSTANTS, MatchStage } from '@shared/types'
import { getUserCollection, getMatchCollection } from '@/data/db/collection'
import { ObjectId } from 'mongodb'

// In-memory tracking for active staged calls
interface ActiveStagedCall {
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

import { circuitBreaker } from '@/utils/circuit-breaker'
import { busyStateService } from '../services/busy-state.service'
import { icebreakerService } from '../services/icebreaker.service'

const activeStagedCalls = new Map<string, ActiveStagedCall>()
// Map matchId -> { timeoutId: NodeJS.Timeout, userIds: string[] } to verify prompt participants on cleanup if needed
const activePrompts = new Map<string, { timeoutId: NodeJS.Timeout, userIds: string[] }>()
const initiationLocks = new Set<string>()

/**
 * Register staged call socket event handlers
 */
export const registerStagedCallHandlers = (io: Server, socket: AuthenticatedSocket) => {
  const userId = socket.userId

  /**
   * Initiate a staged call (Stage 1 audio or Stage 2 video)
   */
  socket.on('staged-call-initiate', async (data: { matchId: string; calleeId: string; stage: 1 | 2 }) => {
    const { matchId, calleeId, stage } = data

    if (circuitBreaker.isOpen()) {
      socket.emit('staged-call-error', { matchId, error: 'System is under high load. Please try again later.' })
      return
    }

    if (busyStateService.isUserBusy(userId)) {
      socket.emit('staged-call-error', { matchId, error: 'You are currently in another call process' })
      return
    }

    if (busyStateService.isUserBusy(calleeId)) {
      socket.emit('staged-call-error', { matchId, error: 'The user is currently busy' })
      return
    }

    const userCollection = await getUserCollection()
    const user = await userCollection.findOne({ _id: new ObjectId(userId) })
    
    // Profile Readiness Gate (80%)
    const completeness = user?.profileCompletion || 0
    if (completeness < 80) {
      socket.emit('staged-call-error', { 
        matchId, 
        error: 'Profile incomplete',
        code: 'PROFILE_INCOMPLETE',
        completeness
      })
      return
    }

    if (initiationLocks.has(matchId)) return

    try {
      initiationLocks.add(matchId)

      // Verify match stage allows this call
      const matchStage = await stagedCallService.getMatchStage(matchId)
      if (!stagedCallService.canInitiateStage(matchStage, stage)) {
        socket.emit('staged-call-error', { matchId, error: 'Cannot initiate call at this stage' })
        return
      }

      // Check for existing active call
      if (activeStagedCalls.has(matchId)) {
        socket.emit('staged-call-error', { matchId, error: 'A call is already in progress' })
        return
      }

      const channelName = `staged_${matchId}_${stage}_${Date.now()}`
      const duration = stagedCallService.getStageDuration(stage)
      const callType = stage === 1 ? 'audio' : 'video'

      // Set busy status for both users
      busyStateService.setUserStatus(userId, 'connecting')
      busyStateService.setUserStatus(calleeId, 'connecting')

      // Ring timeout - 15 seconds
      const ringTimeoutId = setTimeout(() => {
        const activeCall = activeStagedCalls.get(matchId)
        if (activeCall && !activeCall.timerId) {
          activeStagedCalls.delete(matchId)
          stagedCallService.endStagedCall(matchId)
          busyStateService.clearUserStatus(userId)
          busyStateService.clearUserStatus(calleeId)
          io.to(`user:${userId}`).emit('staged-call-timeout', { matchId })
          io.to(`user:${calleeId}`).emit('staged-call-missed', { matchId, callerId: userId })
          console.log(`⏰ [StagedCall] Call timeout in match ${matchId}`)
        }
      }, STAGED_CALL_CONSTANTS.RING_TIMEOUT)

      const call: ActiveStagedCall = {
        matchId,
        stage,
        callerId: userId,
        calleeId,
        channelName,
        startTime: new Date(),
        duration,
        ringTimeoutId,
      }
      activeStagedCalls.set(matchId, call)

      // Save to database
      await stagedCallService.createStagedCall({
        matchId,
        stage,
        callType,
        callerId: userId,
        calleeId,
        channelName,
        status: 'ringing',
        duration,
      })

      console.log(`📞 [StagedCall] Stage ${stage} call initiated: ${userId} -> ${calleeId}`)

      // Notify callee
      io.to(`user:${calleeId}`).emit('staged-call-ringing', {
        matchId,
        callerId: userId,
        callerName: socket.user.firstName,
        channelName,
        stage,
        callType,
      })

      // Confirm to caller
      socket.emit('staged-call-waiting', { matchId, channelName, stage })
    } catch (error) {
      console.error('Error initiating staged call:', error)
      busyStateService.clearUserStatus(userId)
      busyStateService.clearUserStatus(calleeId)
      socket.emit('staged-call-error', { matchId, error: 'Internal server error' })
    } finally {
      initiationLocks.delete(matchId)
    }
  })

  /**
   * Accept staged call
   */
  socket.on('staged-call-accept', async (data: { matchId: string }) => {
    const { matchId } = data
    try {
      const call = activeStagedCalls.get(matchId)

      if (!call || call.calleeId !== userId) {
        socket.emit('staged-call-error', { matchId, error: 'No incoming call found' })
        return
      }

      // Clear ring timeout as call is accepted
      if (call.ringTimeoutId) {
        clearTimeout(call.ringTimeoutId)
        call.ringTimeoutId = undefined
      }

      // Set status to in-call
      busyStateService.setUserStatus(call.callerId, 'in-call')
      busyStateService.setUserStatus(call.calleeId, 'in-call')

      call.startTime = new Date()
      await stagedCallService.updateStagedCallStatus(matchId, 'active', { startTime: call.startTime })

      console.log(`✅ [StagedCall] Stage ${call.stage} call accepted in match ${matchId}`)

      // Start call timer
      call.timerId = setTimeout(() => {
        handleCallComplete(io, matchId)
      }, call.duration)

      // AI Wingman: Trigger initial icebreakers after a short delay
      setTimeout(() => triggerIcebreakers(io, matchId), 3000)

      // Notify both users
      io.to(`user:${call.callerId}`).emit('staged-call-accepted', {
        matchId,
        channelName: call.channelName,
        stage: call.stage,
        duration: call.duration,
      })

      socket.emit('staged-call-connected', {
        matchId,
        channelName: call.channelName,
        stage: call.stage,
        duration: call.duration,
      })
    } catch (error) {
      console.error('Error accepting staged call:', error)
      socket.emit('staged-call-error', { matchId, error: 'Internal server error' })
    }
  })

  /**
   * Decline staged call (callee rejects incoming call)
   */
  socket.on('staged-call-decline', (data: { matchId: string }) => {
    const { matchId } = data
    try {
      const call = activeStagedCalls.get(matchId)

      if (!call || call.calleeId !== userId) return

      if (call.ringTimeoutId) clearTimeout(call.ringTimeoutId)
      if (call.timerId) clearTimeout(call.timerId)
      if (call.icebreakerTimerId) clearTimeout(call.icebreakerTimerId)
      
      busyStateService.clearUserStatus(call.callerId)
      busyStateService.clearUserStatus(call.calleeId)

      activeStagedCalls.delete(matchId)
      stagedCallService.endStagedCall(matchId)

      io.to(`user:${call.callerId}`).emit('staged-call-declined', { matchId })
      console.log(`❌ [StagedCall] Call declined in match ${matchId}`)
    } catch (error) {
      console.error('Error declining staged call:', error)
    }
  })

  /**
   * End active staged call (either party can end)
   */
  socket.on('staged-call-end', (data: { matchId: string }) => {
    const { matchId } = data
    try {
      const call = activeStagedCalls.get(matchId)

      // #region agent log
      console.log('[DEBUG-END] staged-call-end received:', { matchId, userId, call: call ? { callerId: call.callerId, calleeId: call.calleeId } : null })
      // #endregion

      if (!call) return
      
      // Allow either caller or callee to end the call
      if (call.callerId !== userId && call.calleeId !== userId) return

      if (call.ringTimeoutId) clearTimeout(call.ringTimeoutId)
      if (call.timerId) clearTimeout(call.timerId)
      if (call.icebreakerTimerId) clearTimeout(call.icebreakerTimerId)
      
      busyStateService.clearUserStatus(call.callerId)
      busyStateService.clearUserStatus(call.calleeId)

      activeStagedCalls.delete(matchId)
      stagedCallService.endStagedCall(matchId)

      // Notify the other party
      const otherId = call.callerId === userId ? call.calleeId : call.callerId
      io.to(`user:${otherId}`).emit('staged-call-ended', { matchId, stage: call.stage, reason: 'ended_by_user' })
      // Also confirm to the user who ended
      socket.emit('staged-call-ended', { matchId, stage: call.stage, reason: 'ended_by_self' })
      
      console.log(`📴 [StagedCall] Call ended by user in match ${matchId}`)
    } catch (error) {
      console.error('Error ending staged call:', error)
    }
  })

  /**
   * Respond to stage prompt (yes/no to continue)
   */
  socket.on('stage-prompt-response', async (data: { matchId: string; accepted: boolean }) => {
    const { matchId, accepted } = data
    try {
      const { bothResponded, bothAccepted } = await stagedCallService.respondToPrompt(matchId, userId, accepted)

      if (bothResponded) {
        const promptData = activePrompts.get(matchId)
        if (promptData) {
          clearTimeout(promptData.timeoutId)
          activePrompts.delete(matchId)
        }

        const matchStage = await stagedCallService.getMatchStage(matchId)
        await handlePromptResult(io, matchId, bothAccepted, matchStage)
      }
    } catch (error) {
      console.error('Error responding to stage prompt:', error)
    }
  })

  /**
   * Cleanup on disconnect
   */
  socket.on('disconnect', () => {
    // Cleanup active calls
    for (const [matchId, call] of activeStagedCalls.entries()) {
      if (call.callerId === userId || call.calleeId === userId) {
        if (call.ringTimeoutId) clearTimeout(call.ringTimeoutId)
        if (call.timerId) clearTimeout(call.timerId)
        if (call.icebreakerTimerId) clearTimeout(call.icebreakerTimerId)
        
        busyStateService.clearUserStatus(call.callerId)
        busyStateService.clearUserStatus(call.calleeId)

        activeStagedCalls.delete(matchId)
        stagedCallService.endStagedCall(matchId)
        const otherId = call.callerId === userId ? call.calleeId : call.callerId
        io.to(`user:${otherId}`).emit('staged-call-ended', { matchId, stage: call.stage, reason: 'disconnect' })
      }
    }
    
    // Note: We don't delete activePrompts on single user disconnect because the other user might still be deciding.
    // The timeout will eventually clear it, or the other user will respond.
  })
}

/**
 * Handle call completion when timer runs out
 */
const handleCallComplete = async (io: Server, matchId: string) => {
  const call = activeStagedCalls.get(matchId)
  if (!call) return

  if (call.icebreakerTimerId) clearTimeout(call.icebreakerTimerId)
  activeStagedCalls.delete(matchId)
  await stagedCallService.endStagedCall(matchId, call.duration)
  
  busyStateService.clearUserStatus(call.callerId)
  busyStateService.clearUserStatus(call.calleeId)

  console.log(`🔔 [StagedCall] Stage ${call.stage} call complete in match ${matchId}`)

  // Emit call ended and prompt for next stage
  const promptNextStage = true // Always prompt after successful completion of Stage 1 or 2
  const nextStageNum = call.stage + 1
  
  io.to(`user:${call.callerId}`).emit('staged-call-ended', { matchId, stage: call.stage, promptNextStage })
  io.to(`user:${call.calleeId}`).emit('staged-call-ended', { matchId, stage: call.stage, promptNextStage })

  if (promptNextStage) {
    const match = await getMatchCollection().then(c => c.findOne({ _id: new ObjectId(matchId) }))
    if (match) {
      await stagedCallService.createStagePrompt(matchId, call.stage, match.users)
      const expiresAt = new Date(Date.now() + STAGED_CALL_CONSTANTS.PROMPT_TIMEOUT).toISOString()
      io.to(`user:${call.callerId}`).emit('stage-prompt', { matchId, fromStage: call.stage, nextStage: nextStageNum, expiresAt })
      io.to(`user:${call.calleeId}`).emit('stage-prompt', { matchId, fromStage: call.stage, nextStage: nextStageNum, expiresAt })

      // Prompt timeout
      const timeoutId = setTimeout(async () => {
        activePrompts.delete(matchId)
        await handlePromptResult(io, matchId, false, match.stage)
      }, STAGED_CALL_CONSTANTS.PROMPT_TIMEOUT)
      
      activePrompts.set(matchId, { timeoutId, userIds: match.users })
    }
  }
}

/**
 * Trigger AI Wingman Icebreakers
 */
const triggerIcebreakers = async (io: Server, matchId: string) => {
  const call = activeStagedCalls.get(matchId)
  if (!call) return

  try {
    const questions = await icebreakerService.generateIcebreakers(call.callerId, call.calleeId)
    
    // Broadcast the first question
    if (questions.length > 0) {
      const payload = {
        matchId,
        questions,
        timestamp: new Date().toISOString()
      }
      
      io.to(`user:${call.callerId}`).emit('staged-call-icebreaker', payload)
      io.to(`user:${call.calleeId}`).emit('staged-call-icebreaker', payload)
      
      console.log(`🤖 [AI Wingman] Sent icebreakers for match ${matchId}`)
    }

    // Schedule next one in 45 seconds if still active
    call.icebreakerTimerId = setTimeout(() => triggerIcebreakers(io, matchId), 45000)
  } catch (error) {
    console.error('Error triggering icebreakers:', error)
  }
}

/**
 * Handle stage prompt result
 */
const handlePromptResult = async (io: Server, matchId: string, bothAccepted: boolean, currentStage: MatchStage) => {
  const match = await getMatchCollection().then(c => c.findOne({ _id: new ObjectId(matchId) }))
  if (!match) return

  if (bothAccepted) {
    const newStage = stagedCallService.getNextStage(currentStage)
    await stagedCallService.updateMatchStage(matchId, newStage)

    if (newStage === 'unlocked') {
      // Stage 3 complete - trigger contact exchange
      await triggerContactExchange(io, matchId, match.users)
    }
  }

  const nextStage = bothAccepted ? (currentStage === 'fresh' ? 2 : 3) : null
  match.users.forEach(uid => {
    io.to(`user:${uid}`).emit('stage-prompt-result', { matchId, bothAccepted, nextStage })
  })
}

/**
 * Trigger contact exchange for stage 3
 */
export const triggerContactExchange = async (io: Server, matchId: string, userIds: string[]) => {
  const userCollection = await getUserCollection()
  const users = await userCollection.find({ _id: { $in: userIds.map(id => new ObjectId(id)) } }).toArray()
  const expiresAt = new Date(Date.now() + STAGED_CALL_CONSTANTS.CONTACT_DISPLAY_DURATION).toISOString()

  for (const user of users) {
    const partnerId = userIds.find(id => id !== user._id.toHexString())
    const partner = users.find(u => u._id.toHexString() === partnerId)
    if (partner?.contactInfo) {
      const contactDisplay = partner.contactInfo
      io.to(`user:${user._id.toHexString()}`).emit('contact-exchange', {
        matchId,
        partnerContact: contactDisplay,
        expiresAt,
      })
    } else {
      // Fallback: Still emit the event but with empty contact info if none set
      io.to(`user:${user._id.toHexString()}`).emit('contact-exchange', {
        matchId,
        partnerContact: {},
        expiresAt,
      })
    }
  }
}

export const getActiveStagedCall = (matchId: string) => activeStagedCalls.get(matchId)
