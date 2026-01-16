'use client'

import { motion } from 'framer-motion'
import { Volume2, Pause, MapPin } from 'lucide-react'
import { type User } from '@shared/types'
import { useTranslations } from 'next-intl'
import { CardPhoto } from './CardPhoto'

interface SwipeCardHeroProps {
  candidate: User
  photos: string[]
  currentPhotoIndex: number
  setCurrentPhotoIndex: (index: number) => void
  nextPhoto: () => void
  prevPhoto: () => void
  isPlayingVoice: boolean
  handleToggleVoice: () => void
}

export const SwipeCardHero = ({
  candidate,
  photos,
  currentPhotoIndex,
  setCurrentPhotoIndex,
  nextPhoto,
  prevPhoto,
  isPlayingVoice,
  handleToggleVoice
}: SwipeCardHeroProps) => {
  const t = useTranslations('swipe.card')

  return (
    <div className="relative w-full h-[50vh] sm:h-[55vh]">
      {/* Photo Background */}
      <div className="absolute inset-0 w-full h-full">
        <CardPhoto
          candidate={candidate}
          photos={photos}
          currentPhotoIndex={currentPhotoIndex}
          setCurrentPhotoIndex={setCurrentPhotoIndex}
          nextPhoto={nextPhoto}
          prevPhoto={prevPhoto}
        />
      </div>

      {/* Gradient Overlay for readability */}
      <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/20 to-transparent pointer-events-none z-10" />

      {/* Name and Info Overlay */}
      <div className="absolute bottom-0 left-0 right-0 z-20 p-5">
        <div className="flex items-end justify-between">
          <div className="flex-1">
            <h2 className="text-3xl sm:text-4xl font-bold text-white drop-shadow-md flex items-baseline gap-2">
              {candidate.profile?.nickName || candidate.firstName}
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
              onClick={e => {
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
      </div>
    </div>
  )
}
