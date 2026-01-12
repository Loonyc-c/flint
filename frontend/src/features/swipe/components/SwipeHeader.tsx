'use client'

import { motion } from 'framer-motion'
import { Users, Filter } from 'lucide-react'

interface SwipeHeaderProps {
  candidateCount: number
  onFilterClick?: () => void
}

export const SwipeHeader = ({ candidateCount, onFilterClick }: SwipeHeaderProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between px-4 sm:px-6 py-4 shrink-0"
    >
      <div>
        <h2 className="text-2xl sm:text-3xl italic font-black text-transparent uppercase bg-gradient-to-r from-brand to-brand-300 bg-clip-text">
          Discover
        </h2>
        <motion.div
          key={candidateCount}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2 mt-0.5"
        >
          <Users className="w-3.5 h-3.5 text-neutral-400" />
          <p className="text-xs font-semibold tracking-wide text-neutral-400">
            {candidateCount} {candidateCount === 1 ? 'profile' : 'profiles'} nearby
          </p>
        </motion.div>
      </div>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="w-10 h-10 rounded-full bg-white dark:bg-neutral-800 shadow-md flex items-center justify-center text-neutral-500 hover:text-brand transition-colors cursor-pointer"
        aria-label="Filter preferences"
        onClick={onFilterClick}
      >
        <Filter className="w-5 h-5" />
      </motion.button>
    </motion.div>
  )
}
