'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

import {
  useLiveCall,
  type LiveCallStatus as _LiveCallStatus
} from '@/features/live-call/hooks/useLiveCall'
import { useProfileReadiness } from '@/features/profile/hooks/useProfileReadiness'
import { ProfileGuidance } from '@/features/profile/components/ProfileGuidance'

import { LiveCallStateQueueing } from './live-call/LiveCallStateQueueing'
import { LiveCallStateActive } from './live-call/LiveCallStateActive'
import { LiveCallStateEnded } from './live-call/LiveCallStateEnded'
import { LiveCallStateError } from './live-call/LiveCallStateError'

interface LiveCallOverlayProps {
  isOpen: boolean
  onClose: () => void
}

export const LiveCallOverlay = ({ isOpen, onClose }: LiveCallOverlayProps) => {
  const {
    status,
    matchData,
    remainingTime,
    error,
    hasLiked,
    hasPassed,
    joinQueue,
    leaveQueue,
    performAction,
    reset
  } = useLiveCall()

  const { score, missingFields, isReady, isLoading: isCheckingReadiness } = useProfileReadiness()
  const [showGuidance, setShowGuidance] = useState(false)

  useEffect(() => {
    if (isOpen && status === 'idle' && !isCheckingReadiness) {
      if (isReady) {
        joinQueue()
      } else {
        setShowGuidance(true)
      }
    }
  }, [isOpen, isReady, isCheckingReadiness, status, joinQueue])

  const handleClose = () => {
    if (status === 'queueing' || status === 'connecting') {
      leaveQueue()
    }
    reset()
    setShowGuidance(false)
    onClose()
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
      >
        <div className="w-full max-w-md relative">
          {showGuidance ? (
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="bg-card rounded-3xl p-6 shadow-2xl border border-border"
            >
              <ProfileGuidance
                score={score}
                missingFields={missingFields}
                isLoading={isCheckingReadiness}
                onClose={handleClose}
              />
            </motion.div>
          ) : (
            <div className="bg-card rounded-3xl shadow-2xl border border-border overflow-hidden">
              {(status === 'queueing' || status === 'connecting') && (
                <LiveCallStateQueueing
                  status={status}
                  onClose={handleClose}
                />
              )}

              {status === 'in-call' && matchData && (
                <LiveCallStateActive
                  matchData={matchData}
                  remainingTime={remainingTime}
                  hasLiked={hasLiked}
                  hasPassed={hasPassed}
                  performAction={performAction}
                  onClose={handleClose}
                />
              )}

              {status === 'ended' && (
                <LiveCallStateEnded
                  hasLiked={hasLiked}
                  hasPassed={hasPassed}
                  onClose={handleClose}
                />
              )}

              {status === 'error' && (
                <LiveCallStateError
                  error={error}
                  onClose={handleClose}
                />
              )}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

