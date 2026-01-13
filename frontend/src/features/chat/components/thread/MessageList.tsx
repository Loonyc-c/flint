'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { type Message, type ChatConversation } from '@shared/types'
import { type RefObject } from 'react'
import { useTranslations } from 'next-intl'

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
  const t = useTranslations('chat')

  return (
    <div className="flex-1 min-h-0 p-4 space-y-4 overflow-y-auto custom-scrollbar bg-muted/30">
      {isLoading ? (
        <div className="flex items-center justify-center h-full">
          <div className="w-8 h-8 border-2 rounded-full animate-spin border-brand border-t-transparent" />
        </div>
      ) : messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full px-8 text-center opacity-40">
          <div className="flex items-center justify-center w-20 h-20 mb-4 text-4xl rounded-full grayscale bg-muted">
            👋
          </div>
          <p className="text-lg font-bold text-foreground">{t('sayHello')}</p>
          <p className="text-sm text-muted-foreground">{t('breakIce', { name: conversation.otherUser.name })}</p>
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
                      ? 'bg-brand text-brand-foreground rounded-tr-none'
                      : 'bg-card text-foreground rounded-tl-none border border-border'
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
                <div className="px-4 py-3 border shadow-sm bg-card rounded-2xl rounded-tl-none border-border">
                  <div className="flex items-center gap-1">
                    <span
                      className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce"
                      style={{ animationDelay: '0ms' }}
                    />
                    <span
                      className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce"
                      style={{ animationDelay: '150ms' }}
                    />
                    <span
                      className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce"
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
