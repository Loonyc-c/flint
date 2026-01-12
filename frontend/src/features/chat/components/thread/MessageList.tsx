'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { type Message, type ChatConversation } from '@shared/types'
import { type RefObject } from 'react'

interface MessageListProps {
  messages: Message[]
  currentUserId?: string
  isLoading: boolean
  conversation: ChatConversation
  isPartnerTyping: boolean
  messagesEndRef: RefObject<HTMLDivElement | null>
}

export const MessageList = ({
  messages,
  currentUserId,
  isLoading,
  conversation,
  isPartnerTyping,
  messagesEndRef,
}: MessageListProps) => {
  return (
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
            const isMe = msg.senderId === currentUserId
            return (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={msg.id}
                className={cn('flex w-full', isMe ? 'justify-end' : 'justify-start')}
              >
                <div
                  className={cn(
                    'max-w-[75%] px-4 py-2.5 rounded-2xl text-sm font-medium leading-relaxed shadow-sm',
                    isMe
                      ? 'bg-brand text-white rounded-tr-none'
                      : 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-tl-none border border-neutral-100 dark:border-neutral-700'
                  )}
                >
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
                    <span
                      className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce"
                      style={{ animationDelay: '0ms' }}
                    />
                    <span
                      className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce"
                      style={{ animationDelay: '150ms' }}
                    />
                    <span
                      className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce"
                      style={{ animationDelay: '300ms' }}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
      <div ref={messagesEndRef} />
    </div>
  )
}
