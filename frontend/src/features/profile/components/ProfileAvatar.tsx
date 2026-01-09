'use client'

import { motion } from 'framer-motion'
import { Camera, User } from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface ProfileAvatarProps {
  photo?: string
  completeness: number
  onEdit?: () => void
}

export const ProfileAvatar = ({ photo, completeness, onEdit }: ProfileAvatarProps) => {
  const radius = 60
  const stroke = 6
  const normalizedRadius = radius - stroke * 2
  const circumference = normalizedRadius * 2 * Math.PI
  const strokeDashoffset = circumference - (completeness / 100) * circumference

  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div className="relative group">
        {/* Progress Ring SVG */}
        <div className="relative w-40 h-40 flex items-center justify-center">
          <svg
            height={radius * 2 + 10} // Add padding for shadow/glow
            width={radius * 2 + 10}
            className="rotate-[-90deg] drop-shadow-xl"
          >
            {/* Background Circle */}
            <circle
              stroke="currentColor"
              fill="transparent"
              strokeWidth={stroke}
              r={normalizedRadius}
              cx={radius + 5}
              cy={radius + 5}
              className="text-neutral-100 dark:text-neutral-800"
            />
            {/* Progress Circle */}
            <circle
              stroke="currentColor"
              fill="transparent"
              strokeWidth={stroke}
              strokeDasharray={circumference + ' ' + circumference}
              style={{ strokeDashoffset }}
              strokeLinecap="round"
              r={normalizedRadius}
              cx={radius + 5}
              cy={radius + 5}
              className={cn(
                'transition-all duration-1000 ease-out',
                completeness >= 80 ? 'text-green-500' : 'text-brand'
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

            {/* Edit Overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
              <div className="bg-white/90 dark:bg-black/90 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg backdrop-blur-sm transform translate-y-2 group-hover:translate-y-0">
                <Camera className="w-5 h-5 text-brand" />
              </div>
            </div>
          </motion.div>
          
          {/* Percentage Badge */}
          <div className="absolute -bottom-2 bg-white dark:bg-neutral-900 px-3 py-1 rounded-full shadow-lg border border-neutral-100 dark:border-neutral-800 z-20 flex items-center gap-1.5">
             <span className={cn(
               "text-xs font-black", 
               completeness >= 80 ? "text-green-500" : "text-brand"
             )}>
               {Math.round(completeness)}%
             </span>
          </div>
        </div>
      </div>
      
      <p className="mt-4 text-xs font-bold text-neutral-400 uppercase tracking-widest text-center">
        {completeness >= 80 ? 'Profile Complete' : 'Complete your profile'}
      </p>
    </div>
  )
}
