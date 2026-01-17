'use client'

import { useState, useEffect, useMemo, createContext, useContext, type ReactNode } from 'react'
import { useStagedCall, type StagedCallStatus } from '@/features/realtime'
import { ContactExchangeModal } from './staged'
import { toast } from 'react-toastify'
import { type ChatConversation, type StagedCallAcceptedPayload, type StagePromptResult } from '@shared/types'
import { IcebreakerOverlay } from '@/features/home/components/IcebreakerOverlay'
import { useCallSystem } from '@/features/call-system'

// =============================================================================
// Context
// =============================================================================

interface StagedCallContextValue {
  initiateCall: (matchId: string, calleeId: string, stage: 1 | 2) => void
  currentCall: { stage: 1 | 2; matchId: string } | null
  callStatus: StagedCallStatus
}

const StagedCallContext = createContext<StagedCallContextValue | null>(null)

export const useStagedCallContext = () => {
  const context = useContext(StagedCallContext)
  if (!context) {
    throw new Error('useStagedCallContext must be used within a StagedCallProvider')
  }
  return context
}

// =============================================================================
// Types
// =============================================================================

interface StagedCallProviderProps {
  children: ReactNode
  matches?: ChatConversation[]
  activeMatchId?: string | null
  onStageComplete?: (newStage: string) => void
}

// =============================================================================
// Component
// =============================================================================

export const StagedCallProvider = ({
  children,
  matches = [],
  activeMatchId,
  onStageComplete,
}: StagedCallProviderProps) => {
  const { startCall, setCalling, setIncoming, closeCall } = useCallSystem()

  // Find info for the active conversation
  const activeMatch = useMemo(() =>
    matches.find(m => m.matchId === activeMatchId),
    [matches, activeMatchId]
  )

  const stagedCallCallbacks = useMemo(() => ({
    onCallAccepted: (data: StagedCallAcceptedPayload) => {
      // Find partner info
      const match = matches.find(m => m.matchId === data.matchId)
      if (match) {
        startCall({
          callType: 'staged',
          matchId: data.matchId,
          channelName: data.channelName,
          partnerInfo: {
            id: match.otherUser.id,
            name: match.otherUser.name,
            avatar: match.otherUser.avatar
          },
          currentStage: data.stage as 1 | 2 | 3,
          onHangup: () => endCall(data.matchId)
        })
      }
    },
    onCallEnded: () => {
      closeCall()
    },
    onCallDeclined: () => {
      closeCall()
    },
    onPromptResult: (data: StagePromptResult) => {
      if (data.bothAccepted) {
        toast.success(`Moving to Stage ${data.nextStage}!`)
        onStageComplete?.(data.nextStage === 2 ? 'stage1_complete' : data.nextStage === 3 ? 'stage2_complete' : 'unlocked')
      } else {
        toast.info('Returning to chat')
      }
    },
    onContactExchange: () => {
      toast.success('Contact info exchanged! 🎉')
      onStageComplete?.('unlocked')
      closeCall()
    },
  }), [matches, startCall, closeCall, onStageComplete])

  const {
    callStatus,
    currentCall,
    incomingCall,
    remainingTime: _remainingTime,
    stagePrompt: _stagePrompt,
    partnerContact,
    icebreaker,
    initiateCall,
    acceptCall: _acceptCall,
    declineCall: _declineCall,
    endCall,
    respondToPrompt: _respondToPrompt,
  } = useStagedCall(stagedCallCallbacks)

  // Use currentCall and incomingCall in something to avoid unused warnings
  // but they are already used in the useMemo and handlers.
  // The lint warning was for acceptCall, declineCall, and respondToPrompt.
  const [showContactModal, setShowContactModal] = useState(false)

  // Show contact modal when partner contact is received
  if (partnerContact && !showContactModal) {
    setShowContactModal(true)
  }

  // Handle incoming or outbound call - trigger the unified UI
  useEffect(() => {
    // Receiver Side: Ringing
    if (incomingCall && callStatus === 'ringing') {
      const match = matches.find(m => m.matchId === incomingCall.matchId)
      setIncoming({
        callType: 'staged',
        matchId: incomingCall.matchId,
        channelName: incomingCall.channelName,
        partnerInfo: {
          id: incomingCall.callerId,
          name: incomingCall.callerName,
          avatar: match?.otherUser.avatar
        },
        currentStage: incomingCall.stage as 1 | 2 | 3,
        onHangup: () => endCall(incomingCall.matchId),
        onAcceptReady: () => _acceptCall(incomingCall.matchId),
        onDecline: () => _declineCall(incomingCall.matchId)
      })
    }

    // Caller Side: Calling
    if (callStatus === 'calling' && currentCall) {
      const match = matches.find(m => m.matchId === currentCall.matchId)
      if (match) {
        setCalling({
          callType: 'staged',
          matchId: currentCall.matchId,
          channelName: currentCall.channelName,
          partnerInfo: {
            id: match.otherUser.id,
            name: match.otherUser.name,
            avatar: match.otherUser.avatar
          },
          currentStage: currentCall.stage as 1 | 2 | 3,
          onHangup: () => endCall(currentCall.matchId)
        })
      }
    }
  }, [incomingCall, currentCall, callStatus, matches, startCall, setCalling, setIncoming, endCall, _acceptCall, _declineCall])

  const contextValue: StagedCallContextValue = useMemo(() => ({
    initiateCall,
    currentCall: currentCall ? { stage: currentCall.stage, matchId: currentCall.matchId } : null,
    callStatus
  }), [initiateCall, currentCall, callStatus])

  const partnerName = activeMatch?.otherUser.name || incomingCall?.callerName || 'Partner'

  return (
    <StagedCallContext.Provider value={contextValue}>
      {children}

      {/* Contact Exchange Modal */}
      {partnerContact && (
        <ContactExchangeModal
          isOpen={showContactModal}
          partnerName={partnerName}
          contactInfo={partnerContact}
          expiresAt={new Date(Date.now() + 30000).toISOString()}
          onClose={() => setShowContactModal(false)}
        />
      )}

      {/* AI Wingman Icebreakers */}
      {(callStatus === 'active' || callStatus === 'calling') && icebreaker && (
        <IcebreakerOverlay questions={icebreaker.questions} />
      )}
    </StagedCallContext.Provider>
  )
}

export default StagedCallProvider