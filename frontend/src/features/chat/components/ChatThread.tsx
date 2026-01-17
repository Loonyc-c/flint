'use client'

import { useCallback } from 'react'
import { type ChatConversation, type MatchStage } from '@shared/types'
import { useCallSystem } from '@/features/call-system'
import { useStagedCallContext } from '@/features/video/components/StagedCallProvider'
import { ChatHeader } from './thread/ChatHeader'
import { MessageList } from './thread/MessageList'
import { ChatInput } from './thread/ChatInput'
import { useChatThread } from '../hooks/useChatThread'

interface ChatThreadProps {
  conversation: ChatConversation
  onClose: () => void
  onVideoCall?: () => void
  matchStage?: MatchStage
}

export const ChatThread = ({ conversation, onClose, onVideoCall, matchStage }: ChatThreadProps) => {
  const { startPreflight } = useCallSystem()
  const { initiateCall } = useStagedCallContext()

  const handleStagedAudioCall = useCallback(() => {
    startPreflight({
      requireVideo: false,
      onReady: () => {
        initiateCall(conversation.matchId, conversation.otherUser.id, 1)
      },
      onCancel: () => { }
    })
  }, [conversation, initiateCall, startPreflight])

  const handleStagedVideoCall = useCallback(() => {
    startPreflight({
      requireVideo: true,
      onReady: () => {
        initiateCall(conversation.matchId, conversation.otherUser.id, 2)
      },
      onCancel: () => { }
    })
  }, [conversation, initiateCall, startPreflight])

  const {
    user,
    messages,
    inputText,
    isLoading,
    isSending,
    messagesEndRef,
    inputRef,
    handleInputChange,
    handleSend,
    stopTyping,
    isConnected,
    isPartnerOnline,
    isPartnerTyping,
    isMyTurn,
  } = useChatThread({ conversation })

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background relative">
      <ChatHeader
        conversation={conversation}
        onClose={onClose}
        onVideoCall={onVideoCall}
        handleStagedAudioCall={handleStagedAudioCall}
        handleStagedVideoCall={handleStagedVideoCall}
        matchStage={matchStage}
        isPartnerOnline={isPartnerOnline}
        isPartnerTyping={isPartnerTyping}
        isMyTurn={isMyTurn}
        isConnected={isConnected}
      />

      <MessageList
        messages={messages}
        currentUserId={user?.id}
        isLoading={isLoading}
        conversation={conversation}
        isPartnerTyping={isPartnerTyping}
        messagesEndRef={messagesEndRef}
      />

      <ChatInput
        inputText={inputText}
        handleInputChange={handleInputChange}
        stopTyping={stopTyping}
        handleSend={handleSend}
        isSending={isSending}
        isConnected={isConnected}
        inputRef={inputRef}
      />
    </div>
  )
}
