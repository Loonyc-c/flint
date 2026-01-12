'use client'

import { motion } from 'framer-motion'
import { type SwipeAction } from '../../types'

interface SwipeIndicatorProps {
  type: SwipeAction
  opacity: number
}

export const SwipeIndicator = ({ type, opacity }: SwipeIndicatorProps) => {
  const styles = {
    smash: {
      text: 'SMASH',
      color: 'text-green-500',
      border: 'border-green-500',
      bg: 'bg-green-500/10',
      position: 'left-6 top-1/4 -rotate-12',
    },
    pass: {
      text: 'PASS',
      color: 'text-red-500',
      border: 'border-red-500',
      bg: 'bg-red-500/10',
      position: 'right-6 top-1/4 rotate-12',
    },
    super: {
      text: 'SUPER',
      color: 'text-blue-500',
      border: 'border-blue-500',
      bg: 'bg-blue-500/10',
      position: 'left-1/2 -translate-x-1/2 top-1/4',
    },
  }

  const s = styles[type]

  return (
    <motion.div
      className={`absolute ${s.position} z-40 pointer-events-none`}
      style={{ opacity }}
    >
      <div
        className={`
        px-6 py-3 border-4 ${s.border} ${s.bg} rounded-xl
        backdrop-blur-sm
      `}
      >
        <span className={`text-3xl sm:text-4xl font-black ${s.color}`}>{s.text}</span>
      </div>
    </motion.div>
  )
}
