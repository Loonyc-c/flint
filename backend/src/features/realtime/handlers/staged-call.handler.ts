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
}

const activeStagedCalls = new Map<string, ActiveStagedCall>()
const activePrompts = new Map<string, NodeJS.Timeout>()

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

    const call: ActiveStagedCall = {
      matchId,
      stage,
      callerId: userId,
      calleeId,
      channelName,
      startTime: new Date(),
      duration,
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

    // Ring timeout - 15 seconds
    setTimeout(() => {
      const activeCall = activeStagedCalls.get(matchId)
      if (activeCall && !activeCall.timerId) {
        activeStagedCalls.delete(matchId)
        stagedCallService.endStagedCall(matchId)
        io.to(`user:${userId}`).emit('staged-call-timeout', { matchId })
        io.to(`user:${calleeId}`).emit('staged-call-missed', { matchId, callerId: userId })
        console.log(`⏰ [StagedCall] Call timeout in match ${matchId}`)
      }
    }, STAGED_CALL_CONSTANTS.RING_TIMEOUT)
  })

  /**
   * Accept staged call
   */
  socket.on('staged-call-accept', async (data: { matchId: string }) => {
    const { matchId } = data
    const call = activeStagedCalls.get(matchId)

    if (!call || call.calleeId !== userId) {
      socket.emit('staged-call-error', { matchId, error: 'No incoming call found' })
      return
    }

    call.startTime = new Date()
    await stagedCallService.updateStagedCallStatus(matchId, 'active', { startTime: call.startTime })

    console.log(`✅ [StagedCall] Stage ${call.stage} call accepted in match ${matchId}`)

    // Start call timer
    call.timerId = setTimeout(() => {
      handleCallComplete(io, matchId)
    }, call.duration)

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
  })

  /**
   * Decline staged call
   */
  socket.on('staged-call-decline', (data: { matchId: string }) => {
    const { matchId } = data
    const call = activeStagedCalls.get(matchId)

    if (!call || call.calleeId !== userId) return

    if (call.timerId) clearTimeout(call.timerId)
    activeStagedCalls.delete(matchId)
    stagedCallService.endStagedCall(matchId)

    io.to(`user:${call.callerId}`).emit('staged-call-declined', { matchId })
    console.log(`❌ [StagedCall] Call declined in match ${matchId}`)
  })

  /**
   * Respond to stage prompt (yes/no to continue)
   */
  socket.on('stage-prompt-response', async (data: { matchId: string; accepted: boolean }) => {
    const { matchId, accepted } = data
    const { bothResponded, bothAccepted } = await stagedCallService.respondToPrompt(matchId, userId, accepted)

    if (bothResponded) {
      const promptTimeout = activePrompts.get(matchId)
      if (promptTimeout) {
        clearTimeout(promptTimeout)
        activePrompts.delete(matchId)
      }

      const matchStage = await stagedCallService.getMatchStage(matchId)
      await handlePromptResult(io, matchId, bothAccepted, matchStage)
    }
  })

  /**
   * Cleanup on disconnect
   */
  socket.on('disconnect', () => {
    for (const [matchId, call] of activeStagedCalls.entries()) {
      if (call.callerId === userId || call.calleeId === userId) {
        if (call.timerId) clearTimeout(call.timerId)
        activeStagedCalls.delete(matchId)
        stagedCallService.endStagedCall(matchId)
        const otherId = call.callerId === userId ? call.calleeId : call.callerId
        io.to(`user:${otherId}`).emit('staged-call-ended', { matchId, stage: call.stage, reason: 'disconnect' })
      }
    }
  })
}

/**
 * Handle call completion when timer runs out
 */
const handleCallComplete = async (io: Server, matchId: string) => {
  const call = activeStagedCalls.get(matchId)
  if (!call) return

  activeStagedCalls.delete(matchId)
  await stagedCallService.endStagedCall(matchId, call.duration)

  console.log(`🔔 [StagedCall] Stage ${call.stage} call complete in match ${matchId}`)

  // Emit call ended and prompt for next stage
  const promptNextStage = call.stage < 2 || call.stage === 2
  io.to(`user:${call.callerId}`).emit('staged-call-ended', { matchId, stage: call.stage, promptNextStage })
  io.to(`user:${call.calleeId}`).emit('staged-call-ended', { matchId, stage: call.stage, promptNextStage })

  if (promptNextStage) {
    const match = await getMatchCollection().then(c => c.findOne({ _id: new ObjectId(matchId) }))
    if (match) {
      await stagedCallService.createStagePrompt(matchId, call.stage, match.users)
      const expiresAt = new Date(Date.now() + STAGED_CALL_CONSTANTS.PROMPT_TIMEOUT).toISOString()
      io.to(`user:${call.callerId}`).emit('stage-prompt', { matchId, fromStage: call.stage, expiresAt })
      io.to(`user:${call.calleeId}`).emit('stage-prompt', { matchId, fromStage: call.stage, expiresAt })

      // Prompt timeout
      const timeoutId = setTimeout(async () => {
        activePrompts.delete(matchId)
        await handlePromptResult(io, matchId, false, match.stage)
      }, STAGED_CALL_CONSTANTS.PROMPT_TIMEOUT)
      activePrompts.set(matchId, timeoutId)
    }
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
const triggerContactExchange = async (io: Server, matchId: string, userIds: string[]) => {
  const userCollection = await getUserCollection()
  const users = await userCollection.find({ _id: { $in: userIds.map(id => new ObjectId(id)) } }).toArray()
  const expiresAt = new Date(Date.now() + STAGED_CALL_CONSTANTS.CONTACT_DISPLAY_DURATION).toISOString()

  for (const user of users) {
    const partnerId = userIds.find(id => id !== user._id.toHexString())
    const partner = users.find(u => u._id.toHexString() === partnerId)
    if (partner?.contactInfo) {
      const { isContactVerified: _verified, ...contactDisplay } = partner.contactInfo
      io.to(`user:${user._id.toHexString()}`).emit('contact-exchange', {
        matchId,
        partnerContact: contactDisplay,
        expiresAt,
      })
    }
  }
}

export const getActiveStagedCall = (matchId: string) => activeStagedCalls.get(matchId)
