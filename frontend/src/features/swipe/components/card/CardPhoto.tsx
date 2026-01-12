'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, Volume2, Pause, ChevronLeft, ChevronRight } from 'lucide-react'
import Image from 'next/image'
import { type User } from '@shared/types'
import { CarouselDots } from './CarouselDots'

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
  return (
    <div className="relative h-[50%] min-h-[200px] bg-neutral-900 shrink-0 overflow-hidden">
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
            <span className="text-sm text-neutral-500">No Photo</span>
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
            className="absolute inset-y-0 left-0 z-10 w-1/3 flex items-center justify-start pl-2 opacity-0 hover:opacity-100 transition-opacity"
            aria-label="Previous photo"
          >
            <div className="w-8 h-8 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center">
              <ChevronLeft className="w-5 h-5 text-white" />
            </div>
          </button>
          <button
            onClick={nextPhoto}
            className="absolute inset-y-0 right-0 z-10 w-1/3 flex items-center justify-end pr-2 opacity-0 hover:opacity-100 transition-opacity"
            aria-label="Next photo"
          >
            <div className="w-8 h-8 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center">
              <ChevronRight className="w-5 h-5 text-white" />
            </div>
          </button>
        </>
      )}

      {/* Gradient Overlay */}
      <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none bg-gradient-to-t from-black/90 via-black/50 to-transparent" />

      {/* Name overlay on photo */}
      <div className="absolute bottom-0 left-0 right-0 z-10 p-4">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white drop-shadow-lg flex items-baseline gap-2">
              {candidate.profile?.nickName || candidate.firstName}
              {candidate.profile?.age && (
                <span className="text-xl sm:text-2xl font-normal text-white/80">
                  {candidate.profile.age}
                </span>
              )}
            </h2>
            <div className="flex items-center gap-1.5 text-white/70 mt-1">
              <MapPin className="w-3.5 h-3.5" />
              <span className="text-sm">Nearby</span>
            </div>
          </div>

          {/* Voice intro quick button */}
          {candidate.profile?.voiceIntro && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation()
                handleToggleVoice()
              }}
              className={`
                    w-12 h-12 rounded-full flex items-center justify-center
                    ${
                      isPlayingVoice
                        ? 'bg-brand shadow-lg shadow-brand/40'
                        : 'bg-white/20 backdrop-blur-md hover:bg-white/30'
                    }
                    transition-all duration-300
                  `}
              aria-label={isPlayingVoice ? 'Pause voice intro' : 'Play voice intro'}
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
