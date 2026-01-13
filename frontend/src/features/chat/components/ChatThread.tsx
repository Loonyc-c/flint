'use client'

import { useCallback } from 'react'
import { type ChatConversation, type MatchStage } from '@shared/types'
import { useStagedCallContext } from '@/features/video'
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
  const { initiateCall: initiateStagedCall } = useStagedCallContext()

  const handleStagedAudioCall = useCallback(() => {
    initiateStagedCall(conversation.matchId, conversation.otherUser.id, 1)
  }, [conversation.matchId, conversation.otherUser.id, initiateStagedCall])

  const handleStagedVideoCall = useCallback(() => {
    initiateStagedCall(conversation.matchId, conversation.otherUser.id, 2)
  }, [conversation.matchId, conversation.otherUser.id, initiateStagedCall])

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
