'use client'

import { useState } from 'react'
import { motion, AnimatePresence, useAnimation, useMotionValue } from 'framer-motion'
import { Heart, X } from 'lucide-react'
import Image from 'next/image'
import { type User, InteractionType } from '@shared/types'
import { CustomAudioPlayer } from '@/components/ui/custom-audio-player'

// =============================================================================
// Types
// =============================================================================

interface SwipeCardProps {
  candidate: User
  onSwipe: (targetId: string, type: InteractionType) => Promise<void>
}

type StampType = 'SMASH' | 'PASS' | null

// =============================================================================
// Sub-Components
// =============================================================================

interface StampOverlayProps {
  stampType: StampType
}

const StampOverlay = ({ stampType }: StampOverlayProps) => (
  <AnimatePresence>
    {stampType && (
      <motion.div
        initial={{ opacity: 0, scale: 0.5, rotate: -20 }}
        animate={{ opacity: 1, scale: 1.2, rotate: stampType === 'PASS' ? -15 : 15 }}
        className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none"
      >
        <div
          className={`border-10 rounded-3xl px-8 py-4 ${
            stampType === 'SMASH'
              ? 'border-green-500 text-green-500'
              : 'border-red-500 text-red-500'
          }`}
        >
          <span className="text-6xl font-black">{stampType}</span>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
)

// =============================================================================
// Main Component
// =============================================================================

/**
 * Card component displaying a candidate's profile for swiping.
 * Includes photo, info, audio player, and action buttons.
 */
export const SwipeCard = ({ candidate, onSwipe }: SwipeCardProps) => {
  const [stampType, setStampType] = useState<StampType>(null)
  const controls = useAnimation()
  const opacity = useMotionValue(1)

  const photo = candidate.profile?.photo

  const handleAction = async (type: InteractionType) => {
    setStampType(type === InteractionType.LIKE ? 'SMASH' : 'PASS')

    await controls.start({
      x: type === InteractionType.LIKE ? 200 : -200,
      opacity: 0,
      transition: { duration: 0.3 }
    })

    await onSwipe(candidate.id, type)
  }

  return (
    <motion.div
      animate={controls}
      style={{ opacity }}
      className="relative w-full max-w-md mx-auto bg-white dark:bg-neutral-800 rounded-3xl shadow-2xl overflow-hidden h-[650px] flex flex-col"
    >
      {/* Profile Photo */}
      <div className="relative h-[400px] bg-neutral-200 dark:bg-neutral-700">
        {photo ? (
          <Image
            src={photo}
            alt={candidate.profile?.nickName || 'Profile photo'}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-neutral-300 dark:bg-neutral-600">
            <span className="text-neutral-500">No Photo</span>
          </div>
        )}

        <StampOverlay stampType={stampType} />
      </div>

      {/* Info Section */}
      <div className="p-6 flex-1 overflow-y-auto">
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {candidate.firstName} {candidate.lastName}
            {candidate.profile?.age && (
              <span className="text-gray-600 font-normal">, {candidate.profile.age}</span>
            )}
          </h2>
          {candidate.profile?.nickName && (
            <p className="text-sm text-gray-500">@{candidate.profile.nickName}</p>
          )}
        </div>

        {candidate.profile?.bio && (
          <p className="text-gray-700 dark:text-gray-300 text-sm mb-4">{candidate.profile.bio}</p>
        )}

        {/* Voice Intro */}
        {candidate.profile?.voiceIntro && (
          <div className="mb-4">
            <CustomAudioPlayer
              audioUrl={candidate.profile.voiceIntro}
              question="Voice Intro"
              size="small"
            />
          </div>
        )}

        {/* Q&A */}
        {candidate.profile?.questions && candidate.profile.questions.length > 0 && (
          <div className="space-y-3">
            {candidate.profile.questions.map(
              (q: { questionId: string; audioUrl: string }, idx: number) => (
                <CustomAudioPlayer
                  key={idx}
                  audioUrl={q.audioUrl}
                  question={`Question ${idx + 1}`}
                  size="small"
                />
              )
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-6 border-t border-neutral-100 dark:border-neutral-700 flex justify-center gap-8">
        <button
          onClick={() => handleAction(InteractionType.DISLIKE)}
          className="w-16 h-16 rounded-full bg-white dark:bg-neutral-700 shadow-lg flex items-center justify-center text-gray-600 hover:scale-110 transition-transform cursor-pointer"
        >
          <X className="w-8 h-8" />
        </button>
        <button
          onClick={() => handleAction(InteractionType.LIKE)}
          className="w-16 h-16 rounded-full bg-linear-to-br from-[#B33A2E] to-[#CF5144] shadow-lg flex items-center justify-center text-white hover:scale-110 transition-transform cursor-pointer"
        >
          <Heart className="w-8 h-8 fill-white" />
        </button>
      </div>
    </motion.div>
  )
}
