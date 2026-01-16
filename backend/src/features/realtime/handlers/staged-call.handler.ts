import { Server } from 'socket.io'
import { AuthenticatedSocket } from '../middleware/auth.middleware'
import { stagedCallService } from '@/features/staged-call'
import { STAGED_CALL_CONSTANTS } from '@shared/types'
import { getUserCollection } from '@/data/db/collection'
import { ObjectId } from 'mongodb'
import { circuitBreaker } from '@/utils/circuit-breaker'
import { busyStateService } from '../services/busy-state.service'
import { stagedCallLogic, activeStagedCalls, activePrompts, ActiveStagedCall } from '../services/staged-call-logic.service'

const initiationLocks = new Set<string>()

export const registerStagedCallHandlers = (io: Server, socket: AuthenticatedSocket) => {
  const userId = socket.userId

  socket.on('staged-call-initiate', async (data: { matchId: string; calleeId: string; stage: 1 | 2 }) => {
    const { matchId, calleeId, stage } = data
    if (circuitBreaker.isOpen() || busyStateService.isUserBusy(userId) || busyStateService.isUserBusy(calleeId)) {
      socket.emit('staged-call-error', { matchId, error: 'System busy or user unavailable' })
      return
    }
    const user = await (await getUserCollection()).findOne({ _id: new ObjectId(userId) })
    if (!user || initiationLocks.has(matchId)) return
    try {
      initiationLocks.add(matchId)
      const matchStage = await stagedCallService.getMatchStage(matchId)
      if (!stagedCallService.canInitiateStage(matchStage, stage) || activeStagedCalls.has(matchId)) {
        socket.emit('staged-call-error', { matchId, error: 'Cannot initiate call' }); return
      }
      const channelName = `staged_${matchId}_${stage}_${Date.now()}`
      const duration = stagedCallService.getStageDuration(stage)
      busyStateService.setUserStatus(userId, 'connecting'); busyStateService.setUserStatus(calleeId, 'connecting')
      const ringTimeoutId = setTimeout(() => {
        const call = activeStagedCalls.get(matchId)
        if (call && !call.timerId) {
          activeStagedCalls.delete(matchId); stagedCallService.endStagedCall(matchId)
          busyStateService.clearUserStatus(userId); busyStateService.clearUserStatus(calleeId)
          io.to(`user:${userId}`).emit('staged-call-timeout', { matchId })
          io.to(`user:${calleeId}`).emit('staged-call-missed', { matchId, callerId: userId })
        }
      }, STAGED_CALL_CONSTANTS.RING_TIMEOUT)
      const call: ActiveStagedCall = { matchId, stage, callerId: userId, calleeId, channelName, startTime: new Date(), duration, ringTimeoutId }
      activeStagedCalls.set(matchId, call)
      await stagedCallService.createStagedCall({ matchId, stage, callType: stage === 1 ? 'audio' : 'video', callerId: userId, calleeId, channelName, status: 'ringing', duration })
      io.to(`user:${calleeId}`).emit('staged-call-ringing', { matchId, callerId: userId, callerName: socket.user.firstName, channelName, stage, callType: stage === 1 ? 'audio' : 'video' })
      socket.emit('staged-call-waiting', { matchId, channelName, stage })
    } finally { initiationLocks.delete(matchId) }
  })

  socket.on('staged-call-accept', async (data: { matchId: string }) => {
    const { matchId } = data
    const call = activeStagedCalls.get(matchId)
    if (!call || call.calleeId !== userId) return
    if (call.ringTimeoutId) clearTimeout(call.ringTimeoutId)
    busyStateService.setUserStatus(call.callerId, 'in-call'); busyStateService.setUserStatus(call.calleeId, 'in-call')
    call.startTime = new Date()
    await stagedCallService.updateStagedCallStatus(matchId, 'active', { startTime: call.startTime })
    call.timerId = setTimeout(() => stagedCallLogic.handleCallComplete(io, matchId), call.duration)
    setTimeout(() => stagedCallLogic.triggerIcebreakers(io, matchId), 3000)
    io.to(`user:${call.callerId}`).emit('staged-call-accepted', { matchId, channelName: call.channelName, stage: call.stage, duration: call.duration })
    socket.emit('staged-call-connected', { matchId, channelName: call.channelName, stage: call.stage, duration: call.duration })
  })

  socket.on('staged-call-decline', (data: { matchId: string }) => {
    const { matchId } = data
    const call = activeStagedCalls.get(matchId)
    if (!call || call.calleeId !== userId) return
    if (call.ringTimeoutId) clearTimeout(call.ringTimeoutId)
    busyStateService.clearUserStatus(call.callerId); busyStateService.clearUserStatus(call.calleeId)
    activeStagedCalls.delete(matchId); stagedCallService.endStagedCall(matchId)
    io.to(`user:${call.callerId}`).emit('staged-call-declined', { matchId })
  })

  socket.on('staged-call-end', (data: { matchId: string }) => {
    const { matchId } = data
    const call = activeStagedCalls.get(matchId)
    if (!call || (call.callerId !== userId && call.calleeId !== userId)) return
    if (call.ringTimeoutId) clearTimeout(call.ringTimeoutId); if (call.timerId) clearTimeout(call.timerId); if (call.icebreakerTimerId) clearTimeout(call.icebreakerTimerId)
    busyStateService.clearUserStatus(call.callerId); busyStateService.clearUserStatus(call.calleeId)
    activeStagedCalls.delete(matchId); stagedCallService.endStagedCall(matchId)
    const otherId = call.callerId === userId ? call.calleeId : call.callerId
    io.to(`user:${otherId}`).emit('staged-call-ended', { matchId, stage: call.stage, reason: 'ended_by_user' })
    socket.emit('staged-call-ended', { matchId, stage: call.stage, reason: 'ended_by_self' })
  })

  socket.on('stage-prompt-response', async (data: { matchId: string; accepted: boolean }) => {
    const { matchId, accepted } = data
    const { bothResponded, bothAccepted } = await stagedCallService.respondToPrompt(matchId, userId, accepted)
    if (bothResponded) {
      const promptData = activePrompts.get(matchId)
      if (promptData) { clearTimeout(promptData.timeoutId); activePrompts.delete(matchId) }
      const matchStage = await stagedCallService.getMatchStage(matchId)
      await stagedCallLogic.handlePromptResult(io, matchId, bothAccepted, matchStage)
    }
  })

  socket.on('disconnect', () => {
    for (const [matchId, call] of activeStagedCalls.entries()) {
      if (call.callerId === userId || call.calleeId === userId) {
        if (call.ringTimeoutId) clearTimeout(call.ringTimeoutId); if (call.timerId) clearTimeout(call.timerId); if (call.icebreakerTimerId) clearTimeout(call.icebreakerTimerId)
        busyStateService.clearUserStatus(call.callerId); busyStateService.clearUserStatus(call.calleeId)
        activeStagedCalls.delete(matchId); stagedCallService.endStagedCall(matchId)
        const otherId = call.callerId === userId ? call.calleeId : call.callerId
        io.to(`user:${otherId}`).emit('staged-call-ended', { matchId, stage: call.stage, reason: 'disconnect' })
      }
    }
  })
}

export const triggerContactExchange = stagedCallLogic.triggerContactExchange