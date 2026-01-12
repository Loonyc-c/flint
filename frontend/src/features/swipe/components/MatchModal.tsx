'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { type User } from '@shared/types'
import { MatchEffects } from './modal/MatchEffects'
import { MatchContent } from './modal/MatchContent'

interface MatchModalProps {
  isOpen: boolean
  matchedUser: User | null
  onClose: () => void
}

export const MatchModal = ({ isOpen, matchedUser, onClose }: MatchModalProps) => {
  const [showContent, setShowContent] = useState(false)

  // #region agent log
  if (isOpen && matchedUser) {
    fetch('http://127.0.0.1:7242/ingest/b19804b6-4386-4870-8813-100e008e11a3', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location: 'MatchModal.tsx:76',
        message: 'MatchModal opened',
        data: { matchedUserId: matchedUser.id, matchedUserName: matchedUser.firstName },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        hypothesisId: 'H1',
      }),
    }).catch(() => {})
  }
  // #endregion

  useEffect(() => {
    if (isOpen) {
      // Delay content reveal for dramatic effect
      const timer = setTimeout(() => setShowContent(true), 300)
      return () => clearTimeout(timer)
    } else {
      setShowContent(false)
    }
  }, [isOpen])

  if (!matchedUser) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-hidden"
        >
          {/* Animated gradient background */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-gradient-to-br from-brand/90 via-brand-300/90 to-pink-500/90 backdrop-blur-xl"
          />

          {/* Effects (Confetti & Hearts) */}
          <MatchEffects />

          {/* Content Card */}
          <MatchContent
            showContent={showContent}
            matchedUser={matchedUser}
            onClose={onClose}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}