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
        className="absolute inset-0 flex flex-col w-full h-full overflow-hidden bg-white shadow-2xl cursor-grab active:cursor-grabbing select-none dark:bg-neutral-800 rounded-3xl"
      >
        {isDragging && (
          <>
            <SwipeIndicator type="smash" opacity={likeOpacity} />
            <SwipeIndicator type="pass" opacity={passOpacity} />
            <SwipeIndicator type="super" opacity={superOpacity} />
          </>
        )}

        <StampOverlay showStamp={showStamp} stampType={stampType} />

        <CardPhoto
          candidate={candidate}
          photos={photos}
          currentPhotoIndex={currentPhotoIndex}
          setCurrentPhotoIndex={setCurrentPhotoIndex}
          nextPhoto={nextPhoto}
          prevPhoto={prevPhoto}
          isPlayingVoice={isPlayingVoice}
          handleToggleVoice={handleToggleVoice}
        />

        <CardInfo
          candidate={candidate}
          isPlayingVoice={isPlayingVoice}
          handleToggleVoice={handleToggleVoice}
        />
      </motion.div>
    );
  }
);

SwipeCard.displayName = "SwipeCard";
