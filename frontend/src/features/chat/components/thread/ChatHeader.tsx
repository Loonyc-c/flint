'use client'

import { ArrowLeft, MoreVertical, Phone, Video } from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { type ChatConversation, type MatchStage } from '@shared/types'
import { useTranslations } from 'next-intl'

interface ChatHeaderProps {
  conversation: ChatConversation
  onClose: () => void
  onVideoCall?: () => void
  handleStagedAudioCall: () => void
  handleStagedVideoCall: () => void
  matchStage?: MatchStage
  isPartnerOnline: boolean
  isPartnerTyping: boolean
  isMyTurn: boolean
  isConnected: boolean
}

export const ChatHeader = ({
  conversation,
  onClose,
  onVideoCall,
  handleStagedAudioCall,
  handleStagedVideoCall,
  matchStage,
  isPartnerOnline,
  isPartnerTyping,
  isMyTurn,
  isConnected,
}: ChatHeaderProps) => {
  const t = useTranslations('chat')
  const stage = matchStage || conversation.stage || 'fresh'
  const canMakeVideoCalls = stage === 'unlocked'
  const canMakeAudioCalls = stage === 'fresh' || stage === 'unlocked'

  return (
    <div className="px-6 py-4 border-b border-border flex items-center justify-between shrink-0 bg-background z-10">
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
              <Image
                src={conversation.otherUser.avatar}
                alt={conversation.otherUser.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-bold text-neutral-400">
                {conversation.otherUser.name.charAt(0)}
              </div>
            )}
          </div>
          {/* Online Status Dot */}
          <div
            className={cn(
              'absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-neutral-900 transition-colors',
              isPartnerOnline ? 'bg-green-500' : 'bg-neutral-400'
            )}
          />
        </div>

        <div>
          <h3 className="font-bold text-neutral-900 dark:text-white leading-tight">
            {conversation.otherUser.name}
          </h3>
          <p className="text-xs font-medium text-neutral-500 flex items-center gap-2">
            {isPartnerTyping ? (
              <span className="text-brand animate-pulse">{t('typing')}</span>
            ) : isPartnerOnline ? (
              <span className="text-green-500">{t('online')}</span>
            ) : isMyTurn ? (
              <span className="text-brand">{t('yourTurnUpper')}</span>
            ) : (
              <span>{t('theirTurnUpper')}</span>
            )}
            {!isConnected && <span className="text-amber-500 ml-2">• {t('reconnecting')}</span>}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Audio call button - always visible for fresh or unlocked */}
        {canMakeAudioCalls && (
          <button
            onClick={stage === 'unlocked' ? onVideoCall : handleStagedAudioCall}
            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors text-neutral-500 hover:text-brand"
            title={stage === 'fresh' ? t('audioCallTitle') : t('audioCall')}
          >
            <Phone className="w-5 h-5" />
          </button>
        )}
        {/* Video call button - only visible for unlocked matches */}
        {canMakeVideoCalls && (
          <button
            onClick={onVideoCall}
            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors text-neutral-500 hover:text-brand"
            title={t('videoCall')}
          >
            <Video className="w-5 h-5" />
          </button>
        )}
        {/* Stage indicator/button for non-unlocked matches */}
        {!canMakeVideoCalls && stage !== 'fresh' && (
          <button
            onClick={stage === 'stage1_complete' ? handleStagedVideoCall : undefined}
            className={cn(
              'px-3 py-1 rounded-full text-xs font-bold transition-all shadow-sm',
              stage === 'stage1_complete'
                ? 'bg-brand text-white hover:bg-brand-300 cursor-pointer'
                : 'bg-brand/10 text-brand cursor-default'
            )}
          >
            {stage === 'stage1_complete' ? t('startStage2') : t('stage3Available')}
          </button>
        )}
        <button className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors text-neutral-500">
          <MoreVertical className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
