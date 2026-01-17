// Backend Handler - FULL CODE WITH FIXES
import { Server } from 'socket.io'
import { AuthenticatedSocket } from '../middleware/auth.middleware'
import { stagedCallService } from '@/features/staged-call'
import { STAGED_CALL_CONSTANTS } from '@shared/types'
import { getUserCollection } from '@/data/db/collection'
import { ObjectId } from 'mongodb'
import { circuitBreaker } from '@/utils/circuit-breaker'
import { busyStateService } from '../services/busy-state.service'
import {
  stagedCallLogic,
  activeStagedCalls,
  activePrompts,
  ActiveStagedCall,
} from '../services/staged-call-logic.service'
import { agoraService } from '@/features/agora'

const initiationLocks = new Set<string>()
const acceptLocks = new Map<string, boolean>() // NEW: Prevent duplicate accepts

export const registerStagedCallHandlers = (io: Server, socket: AuthenticatedSocket) => {
  const userId = socket.userId

  /**
   * Helper to handle call acceptance (reused for deduplication)
   */
  const handleAcceptCall = async (matchId: string) => {
    const call = activeStagedCalls.get(matchId)
    // Verify user is the callee (or allow if it's a cross-call auto-accept scenario)
    if (!call || call.calleeId !== userId) return

    // FIXED: Atomic accept lock
    if (acceptLocks.get(matchId)) {
      console.log(`Accept duplicate ignored for ${matchId}`)
      return
    }
    acceptLocks.set(matchId, true)

    try {
      if (call.ringTimeoutId) clearTimeout(call.ringTimeoutId)

      busyStateService.trySetUserStatus(call.callerId, 'in-call')
      busyStateService.trySetUserStatus(call.calleeId, 'in-call')

      call.startTime = new Date()
      call.status = 'active'
      await stagedCallService.updateStagedCallStatus(matchId, 'active', {
        startTime: call.startTime,
      })

      call.timerId = setTimeout(
        () => stagedCallLogic.handleCallComplete(io, matchId),
        call.duration,
      )
      setTimeout(() => stagedCallLogic.triggerIcebreakers(io, matchId), 3000)

      // FIXED: Single emit pattern - use 'call-started' for BOTH
      io.to(`user:${call.callerId}`).emit('call-started', {
        matchId,
        channelName: call.channelName,
        stage: call.stage,
        duration: call.duration,
      })

      // Use io.to(userId) instead of socket.emit to support multi-device/deduplication context
      io.to(`user:${userId}`).emit('call-started', {
        matchId,
        channelName: call.channelName,
        stage: call.stage,
        duration: call.duration,
      })
    } finally {
      setTimeout(() => acceptLocks.delete(matchId), 2000)
    }
  }

  /**
   * Handle incoming call request
   */
  socket.on('request-call', async (data: { matchId: string; calleeId: string; stage: 1 | 2 }) => {
    try {
      const { matchId, calleeId, stage } = data

      // ENTRY GATE 1: Circuit breaker check
      if (circuitBreaker.isOpen()) {
        socket.emit('staged-call-error', { matchId, error: 'System busy, try again later' })
        return
      }

      // ENTRY GATE 2: Atomic caller busy state check and set
      const callerResult = busyStateService.trySetUserStatus(userId, 'connecting')
      if (!callerResult.success) {
        socket.emit('staged-call-error', {
          matchId,
          error: `You cannot start a call: ${callerResult.reason}`
        })
        console.log(
          `[StagedCall] Request blocked - Caller ${userId} busy (${callerResult.reason})`
        )
        return
      }

      // ENTRY GATE 3: Atomic callee busy state check and set
      const calleeResult = busyStateService.trySetUserStatus(calleeId, 'connecting')
      if (!calleeResult.success) {
        // ROLLBACK: Caller status
        busyStateService.trySetUserStatus(userId, 'available')

        socket.emit('staged-call-error', {
          matchId,
          error: `User is currently busy: ${calleeResult.reason}`
        })
        console.log(
          `[StagedCall] Request blocked - Callee ${calleeId} busy (${calleeResult.reason})`
        )
        return
      }

      console.log(
        `[StagedCall] Call request accepted - ${userId} -> ${calleeId} (v${callerResult.currentVersion}, v${calleeResult.currentVersion})`
      )

      const user = await (await getUserCollection()).findOne({ _id: new ObjectId(userId) })
      if (!user || initiationLocks.has(matchId)) return

      try {
        initiationLocks.add(matchId)
        const matchStage = await stagedCallService.getMatchStage(matchId)

        if (
          !stagedCallService.canInitiateStage(matchStage, stage)
        ) {
          socket.emit('staged-call-error', { matchId, error: 'Cannot initiate call' })
          return
        }

        // UX-02: Simultaneous Call Request Deduplication
        if (activeStagedCalls.has(matchId)) {
          const existingCall = activeStagedCalls.get(matchId)
          // If I am the callee of the existing call, this is a cross-call -> Auto-Accept!
          if (
            existingCall?.status === 'ringing' &&
            existingCall.calleeId === userId &&
            existingCall.callerId === calleeId
          ) {
            console.log(
              `[StagedCall] Cross-call detected for ${matchId} (User ${userId} calling back Caller ${calleeId}). Auto-accepting.`
            )
            // Release initiation lock since we are accepting instead
            initiationLocks.delete(matchId)
            // Rollback my "connecting" status so accept logic can set "in-call"
            // Actually handleAcceptCall will trySet "in-call", which transitions from "connecting" fine? 
            // Valid transitions: connecting -> in-call. Yes. 
            // But verify: callerResult set me to "connecting". 
            // handleAcceptCall sets me to "in-call". Valid.

            await handleAcceptCall(matchId)
            return
          }

          socket.emit('staged-call-error', { matchId, error: 'Call already in progress' })
          return
        }

        // Create SHORT channel name (must be under 64 bytes)
        const timestamp = Date.now().toString(36)
        const shortMatchId = matchId.slice(-8)
        const channelName = `st${stage}${timestamp}${shortMatchId}`

        const duration = stagedCallService.getStageDuration(stage)

        busyStateService.setUserStatus(userId, 'connecting')
        busyStateService.setUserStatus(calleeId, 'connecting')

        // Generate Agora tokens for both users
        const callerUid = agoraService.generateNumericUid(userId)
        const calleeUid = agoraService.generateNumericUid(calleeId)

        const callerToken = agoraService.generateToken({
          channelName,
          uid: callerUid,
          role: 'publisher',
        })

        const calleeToken = agoraService.generateToken({
          channelName,
          uid: calleeUid,
          role: 'publisher',
        })

        const ringTimeoutId = setTimeout(() => {
          const call = activeStagedCalls.get(matchId)
          if (call && !call.timerId) {
            activeStagedCalls.delete(matchId)
            stagedCallService.endStagedCall(matchId)
            busyStateService.clearUserStatus(userId)
            busyStateService.clearUserStatus(calleeId)
            io.to(`user:${userId}`).emit('staged-call-timeout', { matchId })
            io.to(`user:${calleeId}`).emit('staged-call-missed', { matchId })
          }
        }, STAGED_CALL_CONSTANTS.RING_TIMEOUT)

        const call: ActiveStagedCall = {
          matchId,
          stage,
          status: 'ringing',
          callerId: userId,
          calleeId,
          channelName,
          startTime: new Date(),
          duration,
          ringTimeoutId,
        }
        activeStagedCalls.set(matchId, call)

        await stagedCallService.createStagedCall({
          matchId,
          stage,
          callType: stage === 1 ? 'audio' : 'video',
          callerId: userId,
          calleeId,
          channelName,
          status: 'ringing',
          duration,
        })

        // FIXED: Send credentials to BOTH immediately, but frontend waits for accept
        io.to(`user:${calleeId}`).emit('request-call', {
          matchId,
          callerId: userId,
          callerName: socket.user.firstName,
          channelName,
          stage,
          callType: stage === 1 ? 'audio' : 'video',
          agoraToken: calleeToken.token,
          agoraUid: calleeUid,
        })

        socket.emit('staged-call-waiting', {
          matchId,
          channelName,
          stage,
          agoraToken: callerToken.token,
          agoraUid: callerUid,
        })
      } catch (error) {
        console.error('[StagedCall] Request error:', error)
        socket.emit('staged-call-error', { matchId, error: 'err.internal_server_error' })
        // Rollback on error
        busyStateService.trySetUserStatus(userId, 'available')
        busyStateService.trySetUserStatus(calleeId, 'available')
        stagedCallLogic.clearCall(matchId)
      } finally {
        initiationLocks.delete(matchId)
      }
    } catch (error) {
      console.error('[StagedCall] Outer request error:', error)
      // Ensure cleanup on any error
      if (data.matchId) {
        busyStateService.trySetUserStatus(userId, 'available')
        busyStateService.trySetUserStatus(data.calleeId, 'available')
      }
    }
  })

  socket.on('accept-call', async (data: { matchId: string }) => {
    await handleAcceptCall(data.matchId)
  })

  // Rest of handlers unchanged...
  socket.on('staged-call-decline', (data: { matchId: string }) => {
    const { matchId } = data
    const call = stagedCallLogic.clearCall(matchId)
    if (!call || call.calleeId !== userId) return

    io.to(`user:${call.callerId}`).emit('staged-call-declined', { matchId })
  })

  socket.on('staged-call-end', (data: { matchId: string }) => {
    const { matchId } = data
    const call = stagedCallLogic.clearCall(matchId)
    if (!call || (call.callerId !== userId && call.calleeId !== userId)) return

    const otherId = call.callerId === userId ? call.calleeId : call.callerId
    io.to(`user:${otherId}`).emit('staged-call-ended', {
      matchId,
      stage: call.stage,
      reason: 'ended_by_user',
    })
    socket.emit('staged-call-ended', {
      matchId,
      stage: call.stage,
      reason: 'ended_by_self',
    })
  })

  socket.on('stage-prompt-response', async (data: { matchId: string; accepted: boolean }) => {
    const { matchId, accepted } = data
    const { bothResponded, bothAccepted } = await stagedCallService.respondToPrompt(
      matchId,
      userId,
      accepted,
    )

    if (bothResponded) {
      const promptData = activePrompts.get(matchId)
      if (promptData) {
        clearTimeout(promptData.timeoutId)
        activePrompts.delete(matchId)
      }
      const matchStage = await stagedCallService.getMatchStage(matchId)
      await stagedCallLogic.handlePromptResult(io, matchId, bothAccepted, matchStage)
    }
  })

  socket.on('disconnect', () => {
    console.log(`[StagedCall] User ${userId} disconnected, checking for active calls...`)

    // EXIT CLEANUP: Handle all active calls involving this user
    for (const [matchId, call] of activeStagedCalls.entries()) {
      if (call.callerId === userId || call.calleeId === userId) {
        console.log(`[StagedCall] Cleaning up call ${matchId} due to disconnect`)

        // Clear the call (this also clears busy states)
        stagedCallLogic.clearCall(matchId)

        // Notify the partner
        const otherId = call.callerId === userId ? call.calleeId : call.callerId
        io.to(`user:${otherId}`).emit('staged-call-ended', {
          matchId,
          stage: call.stage,
          reason: 'disconnect',
        })

        console.log(`[StagedCall] Notified partner ${otherId} of disconnect`)
      }
    }

    // Safety net: Always clear busy state on disconnect
    const userStatus = busyStateService.getUserStatus(userId)
    if (userStatus !== 'available') {
      console.log(`[StagedCall] Force clearing busy state for ${userId} (was ${userStatus})`)
      busyStateService.clearUserStatus(userId)
    }
  })
}

export const triggerContactExchange = stagedCallLogic.triggerContactExchange
