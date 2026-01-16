'use client'

import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSwipe } from '../hooks/useSwipe'
import { useSwipeShortcuts } from '../hooks/useSwipeShortcuts'
import { SwipeCard, type SwipeCardRef } from './SwipeCard'
import { SwipeControls } from './controls/SwipeControls'
import { MatchModal } from './modals/MatchModal'
import { type User, type SwipeAction } from '@shared/types'
import { SwipeHeader } from './controls/SwipeHeader'
import { EmptyState } from './states/EmptyState'
import { SwipeSkeleton } from './states/SwipeSkeleton'

export const SwipeFeature = () => {
  const {
    currentCandidate,
    candidates,
    isLoading,
    handleSwipe,
    handleUndo,
    canUndo,
    fetchCandidates,
    isSwiping,
    hasMore
  } = useSwipe()

  const cardRef = useRef<SwipeCardRef>(null)
  const [matchedUser, setMatchedUser] = useState<User | null>(null)
  const [showMatchModal, setShowMatchModal] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const onSwipeAction = useCallback(
    async (type: SwipeAction, fromDrag = false) => {
      if (isSwiping || !currentCandidate) return

      if (cardRef.current && !fromDrag) {
        await cardRef.current.triggerSwipe(type)
      }

      const result = await handleSwipe(type)

      if (result && result.isMatch) {
        setMatchedUser(currentCandidate)
        setShowMatchModal(true)
      }
    },
    [isSwiping, currentCandidate, handleSwipe]
  )

  useSwipeShortcuts({
    currentCandidate,
    showMatchModal,
    handleUndo,
    onSwipeAction: type => onSwipeAction(type)
  })

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    await fetchCandidates()
    setIsRefreshing(false)
  }, [fetchCandidates])

  const containerClass =
    'relative w-full h-[100dvh] flex flex-col bg-gradient-to-b from-neutral-50 to-white dark:from-neutral-900 dark:to-neutral-900 overflow-hidden safe-p-top'

  if (isLoading && !currentCandidate) {
    return (
      <div className={containerClass}>
        <SwipeSkeleton />
      </div>
    )
  }

  if (!hasMore && !isLoading && !currentCandidate) {
    return (
      <div className={containerClass}>
        <EmptyState onRefresh={handleRefresh} isRefreshing={isRefreshing} />
      </div>
    )
  }

  return (
    <div className={containerClass}>
      {/* Card Container - Flexible middle section */}
      <div className="relative flex-1 w-full max-w-screen-md mx-auto px-4 py-2 sm:px-6 flex flex-col justify-center overflow-hidden">
        <AnimatePresence mode="wait">
          {currentCandidate && (
            <motion.div
              key={currentCandidate.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              className="relative w-full h-full flex flex-col"
            >
              <SwipeCard
                ref={cardRef}
                candidate={currentCandidate}
                onSwipe={type => onSwipeAction(type, true)}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {candidates.length > 1 && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              className="absolute left-6 right-6 sm:left-8 sm:right-8 top-4 bottom-2 transform scale-[0.96] translate-y-3 bg-neutral-100 dark:bg-neutral-800 shadow-lg pointer-events-none rounded-[2rem] -z-10"
            />
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              className="absolute left-8 right-8 sm:left-10 sm:right-10 top-6 bottom-4 transform scale-[0.92] translate-y-6 bg-neutral-200 dark:bg-neutral-700 shadow-lg pointer-events-none rounded-[2rem] -z-20"
            />
          </>
        )}
      </div>

      {/* Controls Container - Anchored at the bottom */}
      {/* <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-20 px-4 py-6 sm:py-8 shrink-0 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
      >
        <SwipeControls
          onSwipe={(type) => onSwipeAction(type)}
          onUndo={handleUndo}
          canUndo={canUndo}
          isSwiping={isSwiping}
        />
      </motion.div> */}

      <MatchModal
        isOpen={showMatchModal}
        matchedUser={matchedUser}
        onClose={() => setShowMatchModal(false)}
      />
    </div>
  )
}
