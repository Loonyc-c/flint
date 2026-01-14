'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Heart, Sparkles } from 'lucide-react'
import { type ChatConversation } from '@shared/types'
import { useTranslations } from 'next-intl'
import { SidebarHeader } from './SidebarHeader'
import { SidebarStatCard } from './SidebarStatCard'
import { SidebarSection } from './SidebarSection'
import { SidebarThreadItem } from './SidebarThreadItem'
import { SidebarEmptyState } from './SidebarEmptyState'
import { SidebarLoading } from './SidebarLoading'

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

  const { yourTurnConvos, theirTurnConvos } = useMemo(() => ({
    yourTurnConvos: conversations.filter(c => !c.isTheirTurn),
    theirTurnConvos: conversations.filter(c => c.isTheirTurn)
  }), [conversations])

  return (
    <div className="flex flex-col h-full bg-transparent p-4 gap-4 overflow-y-auto">
      <SidebarHeader title={t('messages')} />

      <div className="grid grid-cols-2 gap-3 shrink-0">
        <SidebarStatCard
          icon={Heart}
          label={t('matches')}
          value={matchCount}
          variant="brand"
          onClick={onOpenMatches}
        />
        <SidebarStatCard
          icon={Sparkles}
          label={t('likes')}
          value={likeCount}
          variant="likes"
          onClick={onOpenLikes}
          disabled
        />
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-neutral-200 dark:via-neutral-700 to-transparent" />

      {isLoading ? (
        <SidebarLoading />
      ) : (
        <div className="flex-1 overflow-y-auto space-y-2">
          <SidebarSection
            title={t('yourTurn')}
            count={yourTurnConvos.length}
            open={openYourTurn}
            onToggle={() => setOpenYourTurn(!openYourTurn)}
          >
            {yourTurnConvos.length > 0 ? (
              yourTurnConvos.map((c, i) => (
                <SidebarThreadItem 
                  key={c.id} 
                  conversation={c} 
                  isActive={activeMatchId === c.id} 
                  onClick={() => onPick(c.id)}
                  index={i}
                />
              ))
            ) : (
              <SidebarEmptyState 
                title={t('noChatsTitle')}
                subtitle={t('noChatsSubtitle')}
              />
            )}
          </SidebarSection>

          <SidebarSection
            title={t('theirTurn')}
            count={theirTurnConvos.length}
            open={openTheirTurn}
            onToggle={() => setOpenTheirTurn(!openTheirTurn)}
          >
            {theirTurnConvos.length > 0 ? (
              theirTurnConvos.map((c, i) => (
                <SidebarThreadItem 
                  key={c.id} 
                  conversation={c} 
                  isActive={activeMatchId === c.id} 
                  onClick={() => onPick(c.id)}
                  index={i}
                />
              ))
            ) : (
              <SidebarEmptyState 
                title={t('allCaughtUpTitle')}
                subtitle={t('allCaughtUpSubtitle')}
              />
            )}
          </SidebarSection>
        </div>
      )}
      
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
