'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, Volume2, Pause, ChevronLeft, ChevronRight } from 'lucide-react'
import Image from 'next/image'
import { type User } from '@shared/types'
import { CarouselDots } from './CarouselDots'
import { useTranslations } from 'next-intl'

interface CardPhotoProps {
  candidate: User
  photos: string[]
  currentPhotoIndex: number
  setCurrentPhotoIndex: (index: number) => void
  nextPhoto: () => void
  prevPhoto: () => void
  isPlayingVoice: boolean
  handleToggleVoice: () => void
}

export const CardPhoto = ({
  candidate,
  photos,
  currentPhotoIndex,
  setCurrentPhotoIndex,
  nextPhoto,
  prevPhoto,
  isPlayingVoice,
  handleToggleVoice,
}: CardPhotoProps) => {
  const t = useTranslations('swipe.card')

  return (
    <div className="relative w-full h-full bg-neutral-900 overflow-hidden">
      {photos.length > 0 ? (
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPhotoIndex}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0"
          >
            <Image
              src={photos[currentPhotoIndex] ?? ''}
              alt={candidate.profile?.nickName || candidate.firstName || 'User'}
              fill
              className="object-cover pointer-events-none"
              priority
              draggable={false}
            />
          </motion.div>
        </AnimatePresence>
      ) : (
        <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-neutral-800 to-neutral-900">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-neutral-700 flex items-center justify-center">
              <span className="text-3xl">👤</span>
            </div>
            <span className="text-sm text-neutral-500">{t('noPhoto')}</span>
          </div>
        </div>
      )}

      {/* Carousel Navigation */}
      {photos.length > 1 && (
        <>
          <CarouselDots
            total={photos.length}
            current={currentPhotoIndex}
            onSelect={setCurrentPhotoIndex}
          />

          {/* Navigation areas */}
          <button
            onClick={prevPhoto}
            className="absolute inset-y-0 left-0 z-30 w-1/3 flex items-center justify-start pl-2 opacity-0 hover:opacity-100 transition-opacity"
            aria-label={t('prevPhoto')}
          >
            <div className="w-8 h-8 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center">
              <ChevronLeft className="w-5 h-5 text-white" />
            </div>
          </button>
          <button
            onClick={nextPhoto}
            className="absolute inset-y-0 right-0 z-30 w-1/3 flex items-center justify-end pr-2 opacity-0 hover:opacity-100 transition-opacity"
            aria-label={t('nextPhoto')}
          >
            <div className="w-8 h-8 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center">
              <ChevronRight className="w-5 h-5 text-white" />
            </div>
          </button>
        </>
      )}
    </div>
  )
}
