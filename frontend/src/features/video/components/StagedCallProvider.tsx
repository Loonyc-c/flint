'use client'

import { useState, useCallback, useMemo, createContext, useContext, type ReactNode } from 'react'
import { useStagedCall, type StagedCallStatus } from '@/features/realtime'
import { StagedAudioCallModal, StagePromptModal, ContactExchangeModal, IncomingStagedCallModal, OutgoingStagedCallModal } from './staged'
import { VideoCallModal } from './VideoCallModal'
import { toast } from 'react-toastify'
import { type ChatConversation, type StagedCallAcceptedPayload, type StagePromptResult } from '@shared/types'

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
  const [showAudioModal, setShowAudioModal] = useState(false)
  const [showVideoModal, setShowVideoModal] = useState(false)

  // Find info for the active conversation
  const activeMatch = useMemo(() => 
    matches.find(m => m.matchId === activeMatchId),
    [matches, activeMatchId]
  )

  const stagedCallCallbacks = useMemo(() => ({
    onCallAccepted: (data: StagedCallAcceptedPayload) => {
      if (data.stage === 1) {
        setShowAudioModal(true)
      } else {
        setShowVideoModal(true)
      }
    },
    onCallEnded: () => {
      setShowAudioModal(false)
      setShowVideoModal(false)
    },
    onCallDeclined: () => {
      setShowAudioModal(false)
      setShowVideoModal(false)
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
    },
  }), [onStageComplete])

  const {
    callStatus,
    currentCall,
    incomingCall,
    remainingTime,
    stagePrompt,
    partnerContact,
    initiateCall,
    acceptCall,
    declineCall,
    endCall,
    respondToPrompt,
  } = useStagedCall(stagedCallCallbacks)

  // Find partner info for the current call (could be different from activeMatch)
  const callPartner = useMemo(() => {
    const targetMatchId = currentCall?.matchId || incomingCall?.matchId || stagePrompt?.matchId
    if (!targetMatchId) return null
    return matches.find(m => m.matchId === targetMatchId)
  }, [matches, currentCall, incomingCall, stagePrompt])

  const partnerName = callPartner?.otherUser.name || incomingCall?.callerName || activeMatch?.otherUser.name || 'Partner'
  const partnerAvatar = callPartner?.otherUser.avatar || activeMatch?.otherUser.avatar

  // Handlers
  const handleAcceptCall = useCallback(() => {
    if (incomingCall) acceptCall(incomingCall.matchId)
  }, [acceptCall, incomingCall])

  const handleDeclineCall = useCallback(() => {
    if (incomingCall) declineCall(incomingCall.matchId)
  }, [declineCall, incomingCall])

  const handleEndStagedCall = useCallback(() => {
    const targetMatchId = currentCall?.matchId || incomingCall?.matchId || activeMatchId
    if (targetMatchId) endCall(targetMatchId)
    setShowAudioModal(false)
    setShowVideoModal(false)
  }, [endCall, currentCall, incomingCall, activeMatchId])

  const handlePromptAccept = useCallback(() => {
    if (stagePrompt) respondToPrompt(stagePrompt.matchId, true)
  }, [respondToPrompt, stagePrompt])

  const handlePromptDecline = useCallback(() => {
    if (stagePrompt) respondToPrompt(stagePrompt.matchId, false)
  }, [respondToPrompt, stagePrompt])

  // Close contact exchange modal
  const [showContactModal, setShowContactModal] = useState(false)
  
  // Show contact modal when partner contact is received
  if (partnerContact && !showContactModal) {
    setShowContactModal(true)
  }

  const contextValue: StagedCallContextValue = {
    initiateCall,
    currentCall: currentCall ? { stage: currentCall.stage, matchId: currentCall.matchId } : null,
    callStatus
  }

  return (
    <StagedCallContext.Provider value={contextValue}>
      {children}

      {/* Outgoing Call Modal */}
      <OutgoingStagedCallModal
        isOpen={callStatus === 'calling' && !!currentCall}
        calleeName={partnerName}
        calleeAvatar={partnerAvatar}
        stage={currentCall?.stage || 1}
        callType={currentCall?.stage === 1 ? 'audio' : 'video'}
        onCancel={handleEndStagedCall}
      />

      {/* Incoming Call Modal */}
      <IncomingStagedCallModal
        isOpen={!!incomingCall && callStatus === 'ringing'}
        callerName={partnerName}
        callerAvatar={partnerAvatar}
        stage={incomingCall?.stage || 1}
        callType={incomingCall?.callType || 'audio'}
        onAccept={handleAcceptCall}
        onDecline={handleDeclineCall}
      />

      {/* Stage 1 Audio Call Modal */}
      <StagedAudioCallModal
        isOpen={showAudioModal && currentCall?.stage === 1}
        channelName={currentCall?.channelName || ''}
        partnerName={partnerName}
        partnerAvatar={partnerAvatar}
        remainingTime={remainingTime}
        stage={1}
        onClose={handleEndStagedCall}
        onCallEnded={handleEndStagedCall}
      />

      {/* Stage 2 Video Call Modal */}
      {showVideoModal && currentCall?.stage === 2 && (
        <VideoCallModal
          isOpen={true}
          channelName={currentCall.channelName}
          localUserName="You"
          remoteUserName={partnerName}
          remainingTime={remainingTime}
          stage={2}
          onClose={handleEndStagedCall}
        />
      )}

      {/* Stage Prompt Modal */}
      <StagePromptModal
        isOpen={callStatus === 'prompt' && !!stagePrompt}
        fromStage={stagePrompt?.fromStage || 1}
        expiresAt={stagePrompt?.expiresAt || new Date().toISOString()}
        onAccept={handlePromptAccept}
        onDecline={handlePromptDecline}
      />

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
    </StagedCallContext.Provider>
  )
}

export default StagedCallProvider