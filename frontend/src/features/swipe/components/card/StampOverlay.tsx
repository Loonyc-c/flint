'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Heart, X, Star } from 'lucide-react'

interface StampOverlayProps {
  showStamp: boolean
  stampType: 'SMASH' | 'PASS' | 'SUPER' | null
}

export const StampOverlay = ({ showStamp, stampType }: StampOverlayProps) => {
  const getStampStyles = () => {
    switch (stampType) {
      case 'SMASH':
        return {
          border: 'border-green-500',
          bg: 'bg-green-500/20',
          text: 'text-green-500',
          shadow: '0 0 80px rgba(34, 197, 94, 0.7)',
          iconBg: 'bg-green-500',
        }
      case 'PASS':
        return {
          border: 'border-red-500',
          bg: 'bg-red-500/20',
          text: 'text-red-500',
          shadow: '0 0 80px rgba(239, 68, 68, 0.7)',
          iconBg: 'bg-red-500',
        }
      case 'SUPER':
        return {
          border: 'border-blue-500',
          bg: 'bg-blue-500/20',
          text: 'text-blue-500',
          shadow: '0 0 80px rgba(59, 130, 246, 0.7)',
          iconBg: 'bg-blue-500',
        }
      default:
        return {
          border: 'border-green-500',
          bg: 'bg-green-500/20',
          text: 'text-green-500',
          shadow: '0 0 80px rgba(34, 197, 94, 0.7)',
          iconBg: 'bg-green-500',
        }
    }
  }

  const stampStyles = getStampStyles()

  return (
    <AnimatePresence>
      {showStamp && stampType && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none"
        >
          {/* Backdrop with blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-md"
          />

          {/* Stamp container */}
          <motion.div
            initial={{ scale: 0.3, rotate: -30, opacity: 0 }}
            animate={{
              scale: 1,
              rotate: stampType === 'PASS' ? -15 : stampType === 'SUPER' ? 0 : 15,
              opacity: 1,
            }}
            exit={{ scale: 1.2, opacity: 0 }}
            transition={{
              type: 'spring',
              stiffness: 400,
              damping: 20,
            }}
            className={`
                  relative flex flex-col items-center gap-4
                  border-[6px] sm:border-[8px] rounded-2xl sm:rounded-3xl 
                  px-8 sm:px-14 py-5 sm:py-8 
                  ${stampStyles.border} ${stampStyles.bg}
                  backdrop-blur-sm
                `}
            style={{ boxShadow: stampStyles.shadow }}
          >
            {/* Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 500 }}
              className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full ${stampStyles.iconBg} flex items-center justify-center shadow-lg`}
            >
              {stampType === 'SMASH' && (
                <Heart className="w-7 h-7 sm:w-8 sm:h-8 text-white fill-white" />
              )}
              {stampType === 'PASS' && (
                <X className="w-7 h-7 sm:w-8 sm:h-8 text-white" strokeWidth={3} />
              )}
              {stampType === 'SUPER' && (
                <Star className="w-7 h-7 sm:w-8 sm:h-8 text-white fill-white" />
              )}
            </motion.div>

            {/* Text */}
            <span
              className={`text-4xl sm:text-6xl font-black tracking-wider ${stampStyles.text}`}
            >
              {stampType === 'SMASH'
                ? 'SMASH!'
                : stampType === 'PASS'
                  ? 'PASS'
                  : 'SUPER!'}
            </span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
