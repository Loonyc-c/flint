'use client'

import { forwardRef, useImperativeHandle } from 'react'
import { motion } from 'framer-motion'
import { type User, type SwipeAction } from '@shared/types'
import { useSwipeCard } from '../hooks/useSwipeCard'
import { SwipeCardHero } from './card/SwipeCardHero'
import { SwipeCardContent } from './card/SwipeCardContent'
import { SwipeCardActions } from './card/SwipeCardActions'
import { StampOverlay } from './card/StampOverlay'
import { SwipeIndicator } from './card/SwipeIndicator'

interface SwipeCardContainerProps {
  candidate: User
  onSwipe?: (type: SwipeAction) => Promise<void>
}

export interface SwipeCardRef {
  triggerSwipe: (type: SwipeAction) => Promise<void>
}

/**
 * Main swipe card container with gesture handling and sub-components.
 * Handles horizontal swipe gestures while allowing vertical scrolling in content.
 */
export const SwipeCardContainer = forwardRef<SwipeCardRef, SwipeCardContainerProps>(
  ({ candidate, onSwipe }, ref) => {
    const {
      currentPhotoIndex,
      setCurrentPhotoIndex,
      photos,
      nextPhoto,
      prevPhoto,
      isPlayingVoice,
      handleToggleVoice,
      stampType,
      showStamp,
      isDragging,
      setIsDragging,
      handleDragEnd,
      triggerSwipe,
      motionValues: { x, y, rotate, likeOpacity, passOpacity, superOpacity, cardOpacity, controls }
    } = useSwipeCard({ candidate, onSwipe })

    useImperativeHandle(ref, () => ({
      triggerSwipe
    }))

    return (
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragDirectionLock
        dragElastic={{ left: 0.1, right: 0.1, top: 0, bottom: 0 }}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={handleDragEnd}
        animate={controls}
        style={{ x, y, rotate, opacity: cardOpacity }}
        className="relative w-full h-full flex flex-col overflow-hidden bg-background shadow-2xl cursor-grab active:cursor-grabbing select-none rounded-[2rem] border border-border"
      >
        {/* Swipe Indicators */}
        {isDragging && (
          <>
            <SwipeIndicator type="smash" opacity={likeOpacity} />
            <SwipeIndicator type="pass" opacity={passOpacity} />
            <SwipeIndicator type="super" opacity={superOpacity} />
          </>
        )}

        {/* Stamp Overlay */}
        <StampOverlay showStamp={showStamp} stampType={stampType} />

        {/* Hero Section - Photo & Name */}
        <SwipeCardHero
          candidate={candidate}
          photos={photos}
          currentPhotoIndex={currentPhotoIndex}
          setCurrentPhotoIndex={setCurrentPhotoIndex}
          nextPhoto={nextPhoto}
          prevPhoto={prevPhoto}
          isPlayingVoice={isPlayingVoice}
          handleToggleVoice={handleToggleVoice}
        />

        {/* Scrollable Content Section */}
        <SwipeCardContent candidate={candidate} />

        {/* Fixed Action Buttons */}
        {/* <SwipeCardActions
          onPass={() => triggerSwipe('pass')}
          onLike={() => triggerSwipe('smash')}
          disabled={false}
        /> */}
      </motion.div>
    )
  }
)

SwipeCardContainer.displayName = 'SwipeCardContainer'
