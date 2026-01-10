'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, ArrowLeft, MoreVertical, Phone, Video } from 'lucide-react'
import { type ChatConversation, type Message, type MatchStage } from '@shared/types'
import { getMessages } from '@/features/chat/api/chat'
import { useUser } from '@/features/auth/context/UserContext'
import { useChat, type RealtimeMessage } from '@/features/realtime'
import { useSocket } from '@/features/realtime'
import { cn } from '@/lib/utils'
import { toast } from 'react-toastify'
import Image from 'next/image'

// =============================================================================
// Types
// =============================================================================

interface ChatThreadProps {
  conversation: ChatConversation
  onClose: () => void
  onVideoCall?: () => void
  onStagedAudioCall?: () => void
  matchStage?: MatchStage
}

// =============================================================================
// Component
// =============================================================================

export const ChatThread = ({ conversation, onClose, onVideoCall, onStagedAudioCall, matchStage }: ChatThreadProps) => {
  const stage = matchStage || conversation.stage || 'fresh'
  const canMakeVideoCalls = stage === 'unlocked'
  const canMakeAudioCalls = stage === 'fresh' || stage === 'unlocked'
  const { user } = useUser()
  const { isConnected } = useSocket()
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Handle new real-time message
  const handleNewMessage = useCallback((msg: RealtimeMessage) => {
    setMessages(prev => {
      // Check if message already exists (avoid duplicates)
      if (prev.some(m => m.id === msg.id)) return prev
      return [...prev, msg]
    })
  }, [])

  // Real-time chat hook
  const {
    sendMessage: sendRealtimeMessage,
    startTyping,
    stopTyping,
    markAsRead,
    isPartnerOnline,
    isPartnerTyping,
  } = useChat({
    matchId: conversation.matchId,
    onNewMessage: handleNewMessage,
  })

  // Fetch Messages (initial load)
  useEffect(() => {
    const fetch = async () => {
      setIsLoading(true)
      try {
        const data = await getMessages(conversation.matchId)
        setMessages(data)
        // Mark messages as read when opening chat
        markAsRead()
      } catch (error) {
        console.error(error)
        toast.error('Failed to load messages')
      } finally {
        setIsLoading(false)
      }
    }
    fetch()
  }, [conversation.matchId, markAsRead])

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isPartnerTyping])

  // Handle input change with typing indicator
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value)
    if (e.target.value.trim()) {
      startTyping()
    } else {
      stopTyping()
    }
  }

  // Send message
  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!inputText.trim() || !user?.id || isSending) return

    const messageText = inputText.trim()
    setInputText('')
    setIsSending(true)
    stopTyping()

    try {
      // Send via real-time socket
      sendRealtimeMessage(messageText)
    } catch (error) {
      console.error(error)
      toast.error('Failed to send message')
      setInputText(messageText) // Restore message on error
    } finally {
      setIsSending(false)
      inputRef.current?.focus()
    }
  }

  // Determine Turn Status
  const lastMessage = messages[messages.length - 1]
  const isMyTurn = lastMessage ? lastMessage.senderId !== user?.id : true

  return (
    <div className="flex flex-col h-[600px] md:h-full bg-white dark:bg-neutral-900 relative">
      {/* Header */}
      <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between shrink-0 bg-white dark:bg-neutral-900 z-10">
        <div className="flex items-center gap-4">
          <button 
            onClick={onClose}
            className="p-2 -ml-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors md:hidden"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden">
               {conversation.otherUser.avatar ? (
                 <Image src={conversation.otherUser.avatar} alt={conversation.otherUser.name} fill className="object-cover" />
               ) : (
                 <div className="w-full h-full flex items-center justify-center font-bold text-neutral-400">
                    {conversation.otherUser.name.charAt(0)}
                 </div>
               )}
            </div>
            {/* Online Status Dot */}
            <div className={cn(
              "absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-neutral-900 transition-colors",
              isPartnerOnline ? "bg-green-500" : "bg-neutral-400"
            )} />
          </div>

          <div>
            <h3 className="font-bold text-neutral-900 dark:text-white leading-tight">
              {conversation.otherUser.name}
            </h3>
            <p className="text-xs font-medium text-neutral-500 flex items-center gap-2">
              {isPartnerTyping ? (
                <span className="text-brand animate-pulse">typing...</span>
              ) : isPartnerOnline ? (
                <span className="text-green-500">Online</span>
              ) : isMyTurn ? (
                <span className="text-brand">YOUR TURN</span>
              ) : (
                <span>THEIR TURN</span>
              )}
              {!isConnected && (
                <span className="text-amber-500 ml-2">• Reconnecting...</span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
           {/* Audio call button - always visible for fresh or unlocked */}
           {canMakeAudioCalls && (
             <button 
               onClick={stage === 'unlocked' ? onVideoCall : onStagedAudioCall}
               className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors text-neutral-500 hover:text-brand"
               title={stage === 'fresh' ? 'Start Stage 1 Audio Call' : 'Audio Call'}
             >
               <Phone className="w-5 h-5" />
             </button>
           )}
           {/* Video call button - only visible for unlocked matches */}
           {canMakeVideoCalls && (
             <button 
               onClick={onVideoCall}
               className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors text-neutral-500 hover:text-brand"
               title="Video Call"
             >
               <Video className="w-5 h-5" />
             </button>
           )}
           {/* Stage indicator for non-unlocked matches */}
           {!canMakeVideoCalls && stage !== 'fresh' && (
             <div className="px-2 py-1 rounded-full bg-brand/10 text-brand text-xs font-medium">
               {stage === 'stage1_complete' ? 'Stage 2 Available' : 'Stage 3 Available'}
             </div>
           )}
           <button className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors text-neutral-500">
             <MoreVertical className="w-5 h-5" />
           </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4 bg-neutral-50 dark:bg-black/20">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin w-8 h-8 border-2 border-brand border-t-transparent rounded-full" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center opacity-40 px-8">
             <div className="w-20 h-20 rounded-full bg-neutral-200 dark:bg-neutral-800 mb-4 flex items-center justify-center text-4xl grayscale">
               👋
             </div>
             <p className="font-bold text-lg">Say Hello!</p>
             <p className="text-sm">Break the ice with {conversation.otherUser.name}</p>
          </div>
        ) : (
          <>
            {messages.map((msg) => {
              const isMe = msg.senderId === user?.id
              return (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={msg.id}
                  className={cn(
                    "flex w-full",
                    isMe ? "justify-end" : "justify-start"
                  )}
                >
                  <div className={cn(
                    "max-w-[75%] px-4 py-2.5 rounded-2xl text-sm font-medium leading-relaxed shadow-sm",
                    isMe 
                      ? "bg-brand text-white rounded-tr-none" 
                      : "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-tl-none border border-neutral-100 dark:border-neutral-700"
                  )}>
                    {msg.text}
                  </div>
                </motion.div>
              )
            })}
            
            {/* Typing Indicator */}
            <AnimatePresence>
              {isPartnerTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex justify-start"
                >
                  <div className="bg-white dark:bg-neutral-800 rounded-2xl rounded-tl-none px-4 py-3 border border-neutral-100 dark:border-neutral-700 shadow-sm">
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 shrink-0">
        <form onSubmit={handleSend} className="flex items-center gap-2 relative">
          <input
            ref={inputRef}
            value={inputText}
            onChange={handleInputChange}
            onBlur={stopTyping}
            placeholder="Type a message..."
            className="w-full h-12 pl-4 pr-12 rounded-full bg-neutral-100 dark:bg-neutral-800 border-transparent focus:border-brand focus:ring-0 transition-all font-medium text-neutral-900 dark:text-white placeholder:text-neutral-400 outline-none"
            disabled={isSending || !isConnected}
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isSending || !isConnected}
            className="absolute right-2 w-8 h-8 flex items-center justify-center bg-brand hover:bg-brand-300 text-white rounded-full transition-all shadow-lg shadow-brand/20 disabled:opacity-50 disabled:shadow-none cursor-pointer"
          >
            <Send className="w-4 h-4 ml-0.5" />
          </button>
        </form>
      </div>
    </div>
  )
}
