'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

import {
  useLiveCall
} from '@/features/live-call/hooks/useLiveCall'
import { useProfileReadiness } from '@/features/profile/hooks/useProfileReadiness'
import { ProfileGuidance } from '@/features/profile/components/ProfileGuidance'
import { useCallSystem } from '@/features/call-system'

import { LiveCallStateQueueing } from './live-call/LiveCallStateQueueing'

interface LiveCallOverlayProps {
  isOpen: boolean
  onClose: () => void
}

export const LiveCallOverlay = ({ isOpen, onClose }: LiveCallOverlayProps) => {
  const {
    status,
    joinQueue,
    leaveQueue,
    reset
  } = useLiveCall()

  const { score, missingFields, isReady, isLoading: isCheckingReadiness } = useProfileReadiness()
  const [showGuidance, setShowGuidance] = useState(false)
  const { startPreflight } = useCallSystem()
  const [isHardwareReady, setIsHardwareReady] = useState(false)

  const handleClose = useCallback(() => {
    if (status === 'queueing' || status === 'connecting') {
      leaveQueue()
    }
    reset()
    setShowGuidance(false)
    setIsHardwareReady(false)
    onClose()
  }, [status, leaveQueue, reset, onClose])

  // Handle handover: close overlay when match is found and global UI takes over
  useEffect(() => {
    if (status === 'in-call') {
      onClose()
    }
  }, [status, onClose])

  useEffect(() => {
    if (isOpen && status === 'idle' && !isCheckingReadiness) {
      if (!isReady) {
        setShowGuidance(true)
        return
      }

      // Pre-flight hardware check before queueing
      if (!isHardwareReady) {
        startPreflight({
          requireVideo: false, // Live call starts with audio
          onReady: () => {
            setIsHardwareReady(true)
            joinQueue()
          },
          onCancel: () => {
            handleClose()
          }
        })
      } else {
        joinQueue()
      }
    }
  }, [isOpen, isReady, isCheckingReadiness, status, isHardwareReady, joinQueue, startPreflight, handleClose])

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
              {(status === 'queueing' || status === 'connecting') ? (
                <LiveCallStateQueueing
                  status={status}
                  onClose={handleClose}
                />
              ) : (
                /* This handles the 'idle' status while hardware check is running */
                <LiveCallStateQueueing
                  status="queueing"
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
