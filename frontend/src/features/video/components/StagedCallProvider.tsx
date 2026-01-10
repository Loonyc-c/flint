'use client'

import { useState, useCallback, createContext, useContext, type ReactNode } from 'react'
import { useStagedCall } from '@/features/realtime'
import { StagedAudioCallModal, StagePromptModal, ContactExchangeModal, IncomingStagedCallModal, OutgoingStagedCallModal } from './staged'
import { VideoCallModal } from './VideoCallModal'
import { toast } from 'react-toastify'

// =============================================================================
// Context
// =============================================================================

interface StagedCallContextValue {
  initiateCall: (matchId: string, calleeId: string, stage: 1 | 2) => void
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
  matchId: string
  otherUserId: string
  otherUserName: string
  otherUserAvatar?: string
  onStageComplete?: (newStage: string) => void
  onStartAudioCall?: () => void
}

// =============================================================================
// Component
// =============================================================================

export const StagedCallProvider = ({
  children,
  matchId,
  otherUserId,
  otherUserName,
  otherUserAvatar,
  onStageComplete,
}: StagedCallProviderProps) => {
  const [showAudioModal, setShowAudioModal] = useState(false)
  const [showVideoModal, setShowVideoModal] = useState(false)

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
  } = useStagedCall({
    onCallAccepted: (data) => {
      // #region agent log
      console.log('[DEBUG-PROVIDER] onCallAccepted:', { stage: data.stage, channelName: data.channelName })
      // #endregion
      if (data.stage === 1) {
        setShowAudioModal(true)
      } else {
        // #region agent log
        console.log('[DEBUG-PROVIDER] Setting showVideoModal to true for stage 2')
        // #endregion
        setShowVideoModal(true)
      }
    },
    onCallEnded: () => {
      // #region agent log
      console.log('[DEBUG-PROVIDER] onCallEnded - closing modals')
      // #endregion
      setShowAudioModal(false)
      setShowVideoModal(false)
    },
    onPromptResult: (data) => {
      // #region agent log
      console.log('[DEBUG-PROVIDER] onPromptResult received:', { bothAccepted: data.bothAccepted, nextStage: data.nextStage })
      // #endregion
      if (data.bothAccepted) {
        toast.success(`Moving to Stage ${data.nextStage}!`)
        if (data.nextStage === 2) {
          // #region agent log
          console.log('[DEBUG-PROVIDER] Scheduling initiateCall for stage 2 in 1 second')
          // #endregion
          // Auto-start stage 2 video call
          setTimeout(() => {
            // #region agent log
            console.log('[DEBUG-PROVIDER] Now calling initiateCall for stage 2')
            // #endregion
            initiateCall(matchId, otherUserId, 2)
          }, 1000)
        }
        onStageComplete?.(data.nextStage === 2 ? 'stage1_complete' : data.nextStage === 3 ? 'stage2_complete' : 'unlocked')
      } else {
        toast.info('Returning to chat')
      }
    },
    onContactExchange: () => {
      toast.success('Contact info exchanged! 🎉')
      onStageComplete?.('unlocked')
    },
  })

  // Accept incoming call
  const handleAcceptCall = useCallback(() => {
    if (incomingCall) {
      acceptCall(incomingCall.matchId)
    }
  }, [acceptCall, incomingCall])

  // Decline incoming call
  const handleDeclineCall = useCallback(() => {
    if (incomingCall) {
      declineCall(incomingCall.matchId)
    }
  }, [declineCall, incomingCall])

  // Cancel outgoing call
  const handleCancelOutgoingCall = useCallback(() => {
    // #region agent log
    console.log('[DEBUG-PROVIDER] Cancelling outgoing call')
    // #endregion
    endCall(matchId)
  }, [endCall, matchId])

  // End active call (notifies other party via socket)
  const handleEndStagedCall = useCallback(() => {
    // #region agent log
    console.log('[DEBUG-END] handleEndStagedCall called, matchId:', matchId)
    // #endregion
    endCall(matchId)
    setShowAudioModal(false)
    setShowVideoModal(false)
  }, [endCall, matchId])

  // Respond to stage prompt
  const handlePromptAccept = useCallback(() => {
    respondToPrompt(matchId, true)
  }, [respondToPrompt, matchId])

  const handlePromptDecline = useCallback(() => {
    respondToPrompt(matchId, false)
  }, [respondToPrompt, matchId])

  // Close contact exchange modal
  const [showContactModal, setShowContactModal] = useState(false)
  
  // Show contact modal when partner contact is received
  if (partnerContact && !showContactModal) {
    setShowContactModal(true)
  }

  // Create context value with initiateCall exposed
  const contextValue: StagedCallContextValue = {
    initiateCall,
  }

  return (
    <StagedCallContext.Provider value={contextValue}>
      {children}

      {/* Outgoing Call Modal (Caller Side) */}
      <OutgoingStagedCallModal
        isOpen={callStatus === 'calling' && !!currentCall}
        calleeName={otherUserName}
        calleeAvatar={otherUserAvatar}
        stage={currentCall?.stage || 1}
        callType={currentCall?.stage === 1 ? 'audio' : 'video'}
        onCancel={handleCancelOutgoingCall}
      />

      {/* Incoming Call Modal (Receiver Side) */}
      <IncomingStagedCallModal
        isOpen={!!incomingCall && callStatus === 'ringing'}
        callerName={incomingCall?.callerName || ''}
        callerAvatar={otherUserAvatar}
        stage={incomingCall?.stage || 1}
        callType={incomingCall?.callType || 'audio'}
        onAccept={handleAcceptCall}
        onDecline={handleDeclineCall}
      />

      {/* Stage 1 Audio Call Modal */}
      <StagedAudioCallModal
        isOpen={showAudioModal && currentCall?.stage === 1}
        channelName={currentCall?.channelName || ''}
        partnerName={otherUserName}
        partnerAvatar={otherUserAvatar}
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
          remoteUserName={otherUserName}
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
          partnerName={otherUserName}
          contactInfo={partnerContact}
          expiresAt={new Date(Date.now() + 30000).toISOString()}
          onClose={() => setShowContactModal(false)}
        />
      )}
    </StagedCallContext.Provider>
  )
}

// Export start audio call function for use in parent components
export { StagedCallProvider as default }
