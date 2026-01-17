'use client'

import { motion } from 'framer-motion'
import { Volume2, Pause, Mic, MapPin } from 'lucide-react'
import { type User } from '@shared/types'
import { useTranslations } from 'next-intl'

interface CardInfoProps {
  candidate: User
  isPlayingVoice: boolean
  handleToggleVoice: () => void
}

export const CardInfo = ({ candidate, isPlayingVoice, handleToggleVoice }: CardInfoProps) => {
  const t = useTranslations('swipe.card')

  return (
    <div className="w-full bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-12 pb-6 px-5">
      <div className="space-y-4">
        {/* Name and Basic Info Overlay */}
        <div className="flex items-end justify-between mb-2">
          <div className="flex-1">
            <h2 className="text-3xl sm:text-4xl font-bold text-white drop-shadow-md flex items-baseline gap-2">
              {candidate.profile?.nickName || 'User'}
              {candidate.profile?.age && (
                <span className="text-2xl sm:text-3xl font-normal text-white/80">
                  {candidate.profile.age}
                </span>
              )}
            </h2>
            <div className="flex items-center gap-1.5 text-white/70 mt-1">
              <MapPin className="w-4 h-4" />
              <span className="text-sm font-medium">{t('nearby')}</span>
            </div>
          </div>

          {/* Quick Voice Toggle */}
          {candidate.profile?.voiceIntro && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation()
                handleToggleVoice()
              }}
              className={`
                w-12 h-12 rounded-full flex items-center justify-center
                ${isPlayingVoice ? 'bg-brand' : 'bg-white/20 backdrop-blur-md'}
                transition-all duration-300 shadow-lg
              `}
            >
              {isPlayingVoice ? (
                <Pause className="w-5 h-5 text-white fill-white" />
              ) : (
                <Volume2 className="w-5 h-5 text-white" />
              )}
            </motion.button>
          )}
        </div>

        {/* Bio - Condensed for overlay */}
        {candidate.profile?.bio && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm leading-relaxed text-white/90 line-clamp-3 drop-shadow-sm"
          >
            {candidate.profile.bio}
          </motion.div>
        )}

        {/* Voice Intro Expanded (Optional/Visible when bio is short or space allows) */}
        {candidate.profile?.voiceIntro && isPlayingVoice && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-3 bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-brand/40 flex items-center justify-center animate-pulse">
                <Mic className="w-4 h-4 text-white" />
              </div>
              <p className="text-xs font-semibold text-white">
                {t('voiceIntroPlaying')}
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
