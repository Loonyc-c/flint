'use client'

import { motion } from 'framer-motion'
import { Camera, User, Loader2 } from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

// =============================================================================
// Types
// =============================================================================

interface ProfileAvatarProps {
  photo?: string
  completeness: number
  onEdit?: () => void
  isUploading?: boolean
}

// =============================================================================
// Constants
// =============================================================================

const RADIUS = 60
const STROKE = 6
const NORMALIZED_RADIUS = RADIUS - STROKE * 2
const CIRCUMFERENCE = NORMALIZED_RADIUS * 2 * Math.PI

// =============================================================================
// Component
// =============================================================================

/**
 * Circular avatar component with progress ring showing profile completeness.
 * Supports photo display and edit functionality.
 */
export const ProfileAvatar = ({
  photo,
  completeness,
  onEdit,
  isUploading = false
}: ProfileAvatarProps) => {
  const strokeDashoffset = CIRCUMFERENCE - (completeness / 100) * CIRCUMFERENCE
  const isComplete = completeness >= 80

  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div className="relative group">
        {/* Progress Ring SVG */}
        <div className="relative w-40 h-40 flex items-center justify-center">
          <svg
            height={RADIUS * 2 + 10}
            width={RADIUS * 2 + 10}
            className="rotate-[-90deg] drop-shadow-xl"
          >
            {/* Background Circle */}
            <circle
              stroke="currentColor"
              fill="transparent"
              strokeWidth={STROKE}
              r={NORMALIZED_RADIUS}
              cx={RADIUS + 5}
              cy={RADIUS + 5}
              className="text-neutral-100 dark:text-neutral-800"
            />
            {/* Progress Circle */}
            <circle
              stroke="currentColor"
              fill="transparent"
              strokeWidth={STROKE}
              strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
              style={{ strokeDashoffset }}
              strokeLinecap="round"
              r={NORMALIZED_RADIUS}
              cx={RADIUS + 5}
              cy={RADIUS + 5}
              className={cn(
                'transition-all duration-1000 ease-out',
                isComplete ? 'text-green-500' : 'text-brand'
              )}
            />
          </svg>

          {/* Avatar Container */}
          <motion.div
            whileTap={{ scale: 0.95 }}
            onClick={onEdit}
            className="absolute inset-[14px] rounded-full overflow-hidden bg-neutral-100 dark:bg-neutral-800 cursor-pointer shadow-inner border-4 border-white dark:border-neutral-900 z-10"
          >
            {photo ? (
              <Image src={photo} fill className="object-cover" alt="Profile" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-neutral-300 gap-1">
                <User className="w-12 h-12" />
              </div>
            )}

            {/* Edit/Loading Overlay */}
            <div
              className={cn(
                'absolute inset-0 transition-colors flex items-center justify-center',
                isUploading ? 'bg-black/40' : 'bg-black/0 group-hover:bg-black/20'
              )}
            >
              {isUploading ? (
                <div className="bg-white/90 dark:bg-black/90 p-2 rounded-full shadow-lg backdrop-blur-sm">
                  <Loader2 className="w-5 h-5 text-brand animate-spin" />
                </div>
              ) : (
                <div className="bg-white/90 dark:bg-black/90 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg backdrop-blur-sm transform translate-y-2 group-hover:translate-y-0">
                  <Camera className="w-5 h-5 text-brand" />
                </div>
              )}
            </div>
          </motion.div>

          {/* Percentage Badge */}
          <div className="absolute -bottom-2 bg-white dark:bg-neutral-900 px-3 py-1 rounded-full shadow-lg border border-neutral-100 dark:border-neutral-800 z-20 flex items-center gap-1.5">
            <span
              className={cn('text-xs font-black', isComplete ? 'text-green-500' : 'text-brand')}
            >
              {Math.round(completeness)}%
            </span>
          </div>
        </div>
      </div>

      <p className="mt-4 text-xs font-bold text-neutral-400 uppercase tracking-widest text-center">
        {isComplete ? 'Profile Complete' : 'Complete your profile'}
      </p>
    </div>
  )
}
