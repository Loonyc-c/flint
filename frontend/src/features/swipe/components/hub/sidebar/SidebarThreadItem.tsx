'use client'

import { motion } from 'framer-motion'
import { type ChatConversation } from '@shared/types'
import { cn } from '@/lib/utils'
import Image from 'next/image'

interface SidebarThreadItemProps {
  conversation: ChatConversation
  isActive: boolean
  onClick: () => void
  index: number
}

export const SidebarThreadItem = ({ 
  conversation, 
  isActive, 
  onClick,
  index
}: SidebarThreadItemProps) => (
  <motion.button
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: index * 0.05 }}
    whileHover={{ x: 4 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className={cn(
      "w-full flex items-center gap-3 p-3 rounded-2xl transition-all text-left relative cursor-pointer",
      isActive 
        ? "bg-gradient-to-r from-brand/10 to-brand-300/10 dark:from-brand/20 dark:to-brand-300/20" 
        : "hover:bg-neutral-100/80 dark:hover:bg-neutral-800/50"
    )}
  >
    {isActive && (
      <motion.div
        layoutId="activeThread"
        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-brand to-brand-300 rounded-full"
      />
    )}
    
    <div className="relative shrink-0">
      <div className={cn(
        "w-12 h-12 rounded-full overflow-hidden relative",
        "ring-2 ring-offset-2 ring-offset-white dark:ring-offset-neutral-900",
        isActive ? "ring-brand/50" : "ring-transparent"
      )}>
        {conversation.otherUser.avatar ? (
          <Image 
            src={conversation.otherUser.avatar} 
            alt={conversation.otherUser.name} 
            fill 
            className="object-cover" 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-lg font-bold bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-neutral-700 dark:to-neutral-600 text-neutral-500 dark:text-neutral-400">
            {conversation.otherUser.name.charAt(0)}
          </div>
        )}
      </div>
      {conversation.unreadCount > 0 && (
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-brand to-brand-300 text-white text-[10px] font-bold flex items-center justify-center rounded-full shadow-lg shadow-brand/30"
        >
          {conversation.unreadCount}
        </motion.div>
      )}
    </div>
    
    <div className="flex-1 min-w-0">
      <h3 className={cn(
        "font-semibold truncate text-sm",
        conversation.unreadCount > 0 
          ? "text-neutral-900 dark:text-white" 
          : "text-neutral-700 dark:text-neutral-300"
      )}>
        {conversation.otherUser.name}
      </h3>
      <p className={cn(
        "text-xs truncate mt-0.5",
        conversation.unreadCount > 0 
          ? "font-medium text-neutral-700 dark:text-neutral-200" 
          : "text-neutral-500 dark:text-neutral-500"
      )}>
        {conversation.lastMessage?.text || "New Match! Say hi 👋"}
      </p>
    </div>
    
    {conversation.lastMessage?.createdAt && (
      <span className="text-[10px] text-neutral-400 shrink-0">
        {new Date(conversation.lastMessage.createdAt).toLocaleDateString(undefined, { 
          month: 'short', 
          day: 'numeric' 
        })}
      </span>
    )}
  </motion.button>
)
