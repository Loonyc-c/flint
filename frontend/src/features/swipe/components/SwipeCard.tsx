"use client";

import { forwardRef, useImperativeHandle } from "react";
import { motion } from "framer-motion";
import { type User, type SwipeAction } from "@shared/types";
import { useSwipeCard } from "../hooks/useSwipeCard";
import { CardInfo } from "./card/CardInfo";
import { CardPhoto } from "./card/CardPhoto";
import { StampOverlay } from "./card/StampOverlay";
import { SwipeIndicator } from "./card/SwipeIndicator";

interface SwipeCardProps {
  candidate: User;
  onSwipe?: (type: SwipeAction) => Promise<void>;
}

export interface SwipeCardRef {
  triggerSwipe: (type: SwipeAction) => Promise<void>;
}

export const SwipeCard = forwardRef<SwipeCardRef, SwipeCardProps>(
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
      motionValues: {
        x,
        y,
        rotate,
        likeOpacity,
        passOpacity,
        superOpacity,
        cardOpacity,
        controls,
      },
    } = useSwipeCard({ candidate, onSwipe });

    useImperativeHandle(ref, () => ({
      triggerSwipe,
    }));

    return (
      <motion.div
        drag
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        dragElastic={0.9}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={handleDragEnd}
        animate={controls}
        style={{ x, y, rotate, opacity: cardOpacity }}
        className="absolute inset-0 w-full h-full overflow-hidden bg-neutral-100 shadow-2xl cursor-grab active:cursor-grabbing select-none dark:bg-neutral-800 rounded-[2rem] border border-white/10"
      >
        {isDragging && (
          <>
            <SwipeIndicator type="smash" opacity={likeOpacity} />
            <SwipeIndicator type="pass" opacity={passOpacity} />
            <SwipeIndicator type="super" opacity={superOpacity} />
          </>
        )}

        <StampOverlay showStamp={showStamp} stampType={stampType} />

        {/* Full-height photo background */}
        <div className="absolute inset-0 w-full h-full">
          <CardPhoto
            candidate={candidate}
            photos={photos}
            currentPhotoIndex={currentPhotoIndex}
            setCurrentPhotoIndex={setCurrentPhotoIndex}
            nextPhoto={nextPhoto}
            prevPhoto={prevPhoto}
          />
        </div>

        {/* Gradient overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none z-10" />

        {/* Info overlay positioned at bottom */}
        <div
          className="absolute bottom-0 left-0 right-0 z-20 max-h-[45%] overflow-y-auto custom-scrollbar overscroll-contain touch-pan-y pb-[max(1.5rem,env(safe-area-inset-bottom))]"
          onPointerDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
        >
          <CardInfo
            candidate={candidate}
            isPlayingVoice={isPlayingVoice}
            handleToggleVoice={handleToggleVoice}
          />
        </div>
      </motion.div>
    );
  }
);

SwipeCard.displayName = "SwipeCard";
