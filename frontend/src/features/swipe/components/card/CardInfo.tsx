'use client'

import { motion } from 'framer-motion'
import { Volume2, Play, Pause, Mic } from 'lucide-react'
import { type User } from '@shared/types'
import { CustomAudioPlayer } from '@/components/ui/custom-audio-player'
import { useTranslations } from 'next-intl'

interface CardInfoProps {
  candidate: User
  isPlayingVoice: boolean
  handleToggleVoice: () => void
}

export const CardInfo = ({ candidate, isPlayingVoice, handleToggleVoice }: CardInfoProps) => {
  const t = useTranslations('swipe.card')

  return (
    <div className="flex-1 overflow-y-auto bg-white dark:bg-neutral-800">
      <div className="p-4 space-y-4">
        {/* Voice Intro Section */}
        {candidate.profile?.voiceIntro ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <button
              onClick={handleToggleVoice}
              className="flex items-center w-full gap-4 p-4 text-white transition-all shadow-lg cursor-pointer bg-gradient-to-r from-brand to-brand-300 hover:shadow-xl rounded-2xl shadow-brand/30 group"
            >
              <div
                className={`
                    flex items-center justify-center rounded-full w-12 h-12 shrink-0
                    ${isPlayingVoice ? 'bg-white/30' : 'bg-white/20'}
                    transition-colors group-hover:bg-white/30
                  `}
              >
                {isPlayingVoice ? (
                  <Pause className="w-5 h-5 fill-white" />
                ) : (
                  <Play className="w-5 h-5 fill-white ml-0.5" />
                )}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="font-bold flex items-center gap-2">
                  <Mic className="w-4 h-4" />
                  {t('voiceIntro')}
                </p>
                <p className="text-sm opacity-90">
                  {isPlayingVoice ? t('voiceIntroPlaying') : t('voiceIntroTap')}
                </p>
              </div>

              {/* Sound wave animation */}
              {isPlayingVoice && (
                <div className="flex items-center gap-0.5">
                  {[...Array(4)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="w-1 bg-white/80 rounded-full"
                      animate={{ height: [8, 20, 8] }}
                      transition={{
                        duration: 0.5,
                        repeat: Infinity,
                        delay: i * 0.1,
                      }}
                    />
                  ))}
                </div>
              )}
            </button>
          </motion.div>
        ) : (
          <div className="flex items-center w-full gap-4 p-4 bg-neutral-100 dark:bg-neutral-700/50 rounded-2xl opacity-60">
            <div className="flex items-center justify-center rounded-full w-12 h-12 bg-neutral-200 dark:bg-neutral-600 shrink-0">
              <Volume2 className="w-5 h-5 text-neutral-400" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-bold text-neutral-700 dark:text-neutral-300">{t('voiceIntro')}</p>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('voiceIntroEmpty')}</p>
            </div>
          </div>
        )}

        {/* Bio */}
        {candidate.profile?.bio && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-4 bg-neutral-50 dark:bg-neutral-700/30 rounded-2xl"
          >
            <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-2">
              {t('about')}
            </h3>
            <p className="text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
              {candidate.profile.bio}
            </p>
          </motion.div>
        )}

        {/* Questions */}
        {candidate.profile?.questions && candidate.profile.questions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-3"
          >
            <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-400 px-1">
              {t('getToKnowMe')}
            </h3>
            {candidate.profile.questions.slice(0, 2).map((q, i) => {
              if (!q.questionId) return null
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                >
                  {q.audioUrl ? (
                    <CustomAudioPlayer
                      audioUrl={q.audioUrl}
                      question={t('question', { number: i + 1 })}
                      size="small"
                    />
                  ) : (
                    <div className="bg-gradient-to-r from-brand/5 to-brand-300/5 dark:from-brand/10 dark:to-brand-300/10 rounded-xl p-3 border border-brand/10">
                      <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                        {t('question', { number: i + 1 })}
                      </p>
                      <p className="text-xs italic text-neutral-400 dark:text-neutral-500 mt-0.5">
                        {t('noAnswer')}
                      </p>
                    </div>
                  )}
                </motion.div>
              )
            })}
            {candidate.profile.questions.length > 2 && (
              <p className="text-xs text-neutral-400 text-center py-1">
                {t('moreQuestions', { count: candidate.profile.questions.length - 2 })}
              </p>
            )}
          </motion.div>
        )}
      </div>
    </div>
  )
}
