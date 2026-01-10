'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Send, ArrowLeft, MoreVertical, Phone } from 'lucide-react'
import { type ChatConversation, type Message } from '@shared/types'
import { getMessages, sendMessage } from '@/features/chat/api/chat'
import { useUser } from '@/features/auth/context/UserContext'
import { cn } from '@/lib/utils'
import { toast } from 'react-toastify'
import Image from 'next/image'

// =============================================================================
// Types
// =============================================================================

interface ChatThreadProps {
  conversation: ChatConversation
  onClose: () => void
}

// =============================================================================
// Component
// =============================================================================

export const ChatThread = ({ conversation, onClose }: ChatThreadProps) => {
  const { user } = useUser()
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Fetch Messages
  useEffect(() => {
    const fetch = async () => {
      setIsLoading(true)
      try {
        const data = await getMessages(conversation.matchId)
        setMessages(data)
      } catch (error) {
        console.error(error)
        toast.error('Failed to load messages')
      } finally {
        setIsLoading(false)
      }
    }
    fetch()
  }, [conversation.matchId])

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!inputText.trim() || !user?.id || isSending) return

    setIsSending(true)
    try {
      const msg = await sendMessage(conversation.matchId, inputText.trim())
      setMessages(prev => [...prev, msg])
      setInputText('')
    } catch (error) {
      console.error(error)
      toast.error('Failed to send message')
    } finally {
      setIsSending(false)
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
            {/* Active Status Dot */}
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-neutral-900" />
          </div>

          <div>
            <h3 className="font-bold text-neutral-900 dark:text-white leading-tight">
              {conversation.otherUser.name}
            </h3>
            <p className="text-xs font-medium text-neutral-500 flex items-center gap-2">
              {isMyTurn ? (
                <span className="text-brand">YOUR TURN</span>
              ) : (
                <span>THEIR TURN</span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
           <button className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors text-neutral-500">
             <Phone className="w-5 h-5" />
           </button>
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
          messages.map((msg) => {
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
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 shrink-0">
        <form onSubmit={handleSend} className="flex items-center gap-2 relative">
          <input
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type a message..."
            className="w-full h-12 pl-4 pr-12 rounded-full bg-neutral-100 dark:bg-neutral-800 border-transparent focus:border-brand focus:ring-0 transition-all font-medium text-neutral-900 dark:text-white placeholder:text-neutral-400 outline-none"
            disabled={isSending}
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isSending}
            className="absolute right-2 w-8 h-8 flex items-center justify-center bg-brand hover:bg-brand-300 text-white rounded-full transition-all shadow-lg shadow-brand/20 disabled:opacity-50 disabled:shadow-none cursor-pointer"
          >
            <Send className="w-4 h-4 ml-0.5" />
          </button>
        </form>
      </div>
    </div>
  )
}
