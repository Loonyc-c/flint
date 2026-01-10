'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Settings, Heart, Sparkles, ChevronDown, type LucideIcon } from 'lucide-react'
import { type ChatConversation } from '@shared/types'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import Image from 'next/image'

// =============================================================================
// Types
// =============================================================================

interface SidebarProps {
  conversations: ChatConversation[]
  activeMatchId: string | null
  matchCount?: number
  likeCount?: number
  hiddenCount?: number
  onPick: (matchId: string) => void
  onOpenMatches: () => void
  onOpenLikes: () => void
  isLoading?: boolean
}

// =============================================================================
// Internal Components
// =============================================================================

const StatCard = ({ 
  icon: Icon, 
  label, 
  value, 
  variant = 'default', 
  onClick,
  disabled = false
}: { 
  icon: LucideIcon
  label: string
  value: number
  variant?: 'default' | 'brand' | 'likes'
  onClick: () => void
  disabled?: boolean
}) => {
  const variants = {
    default: {
      bg: 'bg-neutral-100/80 dark:bg-neutral-800/80',
      hover: 'hover:bg-neutral-200/80 dark:hover:bg-neutral-700/80',
      text: 'text-neutral-700 dark:text-neutral-200',
      icon: 'text-neutral-500 dark:text-neutral-400',
      value: 'text-neutral-900 dark:text-white',
    },
    brand: {
      bg: 'bg-gradient-to-br from-brand/10 to-brand-300/10 dark:from-brand/20 dark:to-brand-300/20',
      hover: 'hover:from-brand/20 hover:to-brand-300/20 dark:hover:from-brand/30 dark:hover:to-brand-300/30',
      text: 'text-brand dark:text-brand-300',
      icon: 'text-brand dark:text-brand-300',
      value: 'text-brand dark:text-brand-300',
    },
    likes: {
      bg: 'bg-gradient-to-br from-amber-500/10 to-orange-500/10 dark:from-amber-500/20 dark:to-orange-500/20',
      hover: 'hover:from-amber-500/20 hover:to-orange-500/20 dark:hover:from-amber-500/30 dark:hover:to-orange-500/30',
      text: 'text-amber-600 dark:text-amber-400',
      icon: 'text-amber-500 dark:text-amber-400',
      value: 'text-amber-600 dark:text-amber-400',
    },
  }

  const v = variants[variant]

  return (
    <motion.button
      whileHover={disabled ? {} : { scale: 1.02, y: -2 }}
      whileTap={disabled ? {} : { scale: 0.98 }}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={cn(
        "w-full min-w-0 flex flex-col gap-2 rounded-2xl px-4 py-3.5 transition-all",
        disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
        v.bg, 
        !disabled && v.hover
      )}
    >
      <div className="flex items-center gap-2 w-full">
        <Icon className={cn("h-4 w-4 shrink-0", v.icon)} />
        <span className={cn("font-medium text-sm", v.text)}>{label}</span>
        {disabled && (
          <span className="ml-auto text-[10px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
            Soon
          </span>
        )}
      </div>
      <div className={cn("text-2xl font-bold leading-none", v.value)}>
        {value}
      </div>
    </motion.button>
  )
}

const Section = ({ 
  title, 
  count,
  open, 
  onToggle, 
  children 
}: { 
  title: string
  count?: number
  open: boolean
  onToggle: () => void
  children: React.ReactNode 
}) => (
  <div className="flex flex-col">
    <motion.button
      whileTap={{ scale: 0.98 }}
      type="button"
      onClick={onToggle}
      className="flex items-center justify-between py-3 px-1 group"
      aria-expanded={open}
    >
      <span className="flex items-center gap-2">
        <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">{title}</span>
        {count !== undefined && count > 0 && (
          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300">
            {count}
          </span>
        )}
      </span>
      <motion.div
        animate={{ rotate: open ? 180 : 0 }}
        transition={{ duration: 0.2 }}
      >
        <ChevronDown className="h-4 w-4 text-neutral-400 group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors" />
      </motion.div>
    </motion.button>
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden"
        >
          <div className="flex flex-col gap-1 pb-2">{children}</div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
)

const ThreadItem = ({ 
  conversation, 
  isActive, 
  onClick,
  index
}: { 
  conversation: ChatConversation
  isActive: boolean
  onClick: () => void
  index: number
}) => (
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
    {/* Active indicator */}
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
    
    {/* Time indicator */}
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

// Empty state component
const EmptyState = ({ title, subtitle }: { title: string; subtitle: string }) => (
  <motion.div 
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="px-4 py-8 text-center"
  >
    <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
      <Sparkles className="w-5 h-5 text-neutral-400" />
    </div>
    <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">{title}</p>
    <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">{subtitle}</p>
  </motion.div>
)

// =============================================================================
// Main Component
// =============================================================================

export const Sidebar = ({ 
  conversations, 
  activeMatchId, 
  onPick, 
  matchCount = 0, 
  likeCount = 0, 
  hiddenCount = 0,
  onOpenMatches, 
  onOpenLikes,
  isLoading 
}: SidebarProps) => {
  const t = useTranslations('chat')
  const [openYourTurn, setOpenYourTurn] = useState(true)
  const [openTheirTurn, setOpenTheirTurn] = useState(true)

  const yourTurnConvos = conversations.filter(c => !c.isTheirTurn)
  const theirTurnConvos = conversations.filter(c => c.isTheirTurn)

  return (
    <div className="flex flex-col h-full bg-transparent p-4 gap-4 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
          {t('messages')}
        </h2>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="p-2.5 rounded-xl bg-neutral-100/80 dark:bg-neutral-800/80 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200/80 dark:hover:bg-neutral-700/80 transition-colors"
          aria-label="Settings"
        >
          <Settings className="h-4 w-4" />
        </motion.button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-3 shrink-0">
        <StatCard
          icon={Heart}
          label={t('matches')}
          value={matchCount}
          variant="brand"
          onClick={onOpenMatches}
        />
        <StatCard
          icon={Sparkles}
          label={t('likes')}
          value={likeCount}
          variant="likes"
          onClick={onOpenLikes}
          disabled
        />
      </div>

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-neutral-200 dark:via-neutral-700 to-transparent" />

      {/* Loading State */}
      {isLoading ? (
        <div className="space-y-3 mt-2">
          {[...Array(5)].map((_, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center gap-3 p-3"
            >
              <div className="w-12 h-12 rounded-full bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-24 bg-neutral-200 dark:bg-neutral-800 rounded-lg animate-pulse" />
                <div className="h-3 w-32 bg-neutral-200 dark:bg-neutral-800 rounded-lg animate-pulse" />
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-2">
          {/* Your Turn Group */}
          <Section
            title={t('yourTurn')}
            count={yourTurnConvos.length}
            open={openYourTurn}
            onToggle={() => setOpenYourTurn(!openYourTurn)}
          >
            {yourTurnConvos.length > 0 ? (
              yourTurnConvos.map((c, i) => (
                <ThreadItem 
                  key={c.id} 
                  conversation={c} 
                  isActive={activeMatchId === c.id} 
                  onClick={() => onPick(c.id)}
                  index={i}
                />
              ))
            ) : (
              <EmptyState 
                title="No chats waiting"
                subtitle="Start swiping to find matches!"
              />
            )}
          </Section>

          {/* Their Turn Group */}
          <Section
            title={t('theirTurn')}
            count={theirTurnConvos.length}
            open={openTheirTurn}
            onToggle={() => setOpenTheirTurn(!openTheirTurn)}
          >
            {theirTurnConvos.length > 0 ? (
              theirTurnConvos.map((c, i) => (
                <ThreadItem 
                  key={c.id} 
                  conversation={c} 
                  isActive={activeMatchId === c.id} 
                  onClick={() => onPick(c.id)}
                  index={i}
                />
              ))
            ) : (
              <EmptyState 
                title="All caught up!"
                subtitle="Waiting for replies..."
              />
            )}
          </Section>
        </div>
      )}
      
      {/* Hidden Info Footer */}
      {hiddenCount > 0 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-auto pt-4 text-center shrink-0"
        >
          <button className="text-xs font-semibold text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors">
            {hiddenCount} {t('hiddenChats')}
          </button>
        </motion.div>
      )}
    </div>
  )
}
