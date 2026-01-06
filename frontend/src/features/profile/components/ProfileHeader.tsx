'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface ProfileHeaderProps {
  completeness: number
}

export const ProfileHeader = ({ completeness }: ProfileHeaderProps) => {
  return (
    <div className="sticky top-0 z-30 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-neutral-200 dark:border-neutral-800 p-4 pt-[env(safe-area-inset-top)]">
      <div className="max-w-2xl mx-auto flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Profile</h1>
          <p className="text-[10px] uppercase tracking-wider font-bold text-neutral-400">
            Personalize your identity
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'text-sm font-black transition-colors duration-500',
                completeness >= 80 ? 'text-green-500' : 'text-brand'
              )}
            >
              {completeness}%
            </span>
            <span className="text-[10px] font-bold text-neutral-400 uppercase">Completeness</span>
          </div>
          <div className="w-32 h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${completeness}%` }}
              className={cn(
                'h-full transition-colors duration-500',
                completeness >= 80 ? 'bg-green-500' : 'bg-brand'
              )}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
