"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSwipe } from "../hooks/useSwipe";
import { useSwipeShortcuts } from "../hooks/useSwipeShortcuts";
import { SwipeCard, type SwipeCardRef } from "./SwipeCard";
import { SwipeControls } from "./controls/SwipeControls";
import { MatchModal } from "./modals/MatchModal";
import { type User, type SwipeAction } from "@shared/types";
import { SwipeHeader } from "./controls/SwipeHeader";
import { EmptyState } from "./states/EmptyState";
import { SwipeSkeleton } from "./states/SwipeSkeleton";

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
    hasMore,
  } = useSwipe();

  const cardRef = useRef<SwipeCardRef>(null);
  const [matchedUser, setMatchedUser] = useState<User | null>(null);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const onSwipeAction = useCallback(
    async (type: SwipeAction, fromDrag = false) => {
      if (isSwiping || !currentCandidate) return;

      if (cardRef.current && !fromDrag) {
        await cardRef.current.triggerSwipe(type);
      }

      const result = await handleSwipe(type);

      if (result && result.isMatch) {
        setMatchedUser(currentCandidate);
        setShowMatchModal(true);
      }
    },
    [isSwiping, currentCandidate, handleSwipe]
  );

  useSwipeShortcuts({
    currentCandidate,
    showMatchModal,
    handleUndo,
    onSwipeAction: (type) => void onSwipeAction(type),
  });

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchCandidates();
    setIsRefreshing(false);
  }, [fetchCandidates]);

  const containerClass =
    "w-full flex flex-col bg-gradient-to-b from-neutral-50 to-white dark:from-neutral-900 dark:to-neutral-900";

  if (isLoading && !currentCandidate) {
    return (
      <div className={containerClass}>
        <SwipeSkeleton />
      </div>
    );
  }

  if (!hasMore && !isLoading && !currentCandidate) {
    return (
      <div className={containerClass}>
        <EmptyState onRefresh={handleRefresh} isRefreshing={isRefreshing} />
      </div>
    );
  }

  return (
    <div className={containerClass}>
      <SwipeHeader candidateCount={candidates.length} />

      <div className="relative w-full aspect-[1/1.5] sm:aspect-[1/1.4] max-h-[600px] mx-auto px-4 sm:px-6 pb-2">
        <AnimatePresence mode="wait">
          {currentCandidate && (
            <motion.div
              key={currentCandidate.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 px-4 sm:px-6"
            >
              <SwipeCard 
                ref={cardRef} 
                candidate={currentCandidate} 
                onSwipe={(type) => void onSwipeAction(type, true)}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {candidates.length > 1 && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              className="absolute left-4 right-4 sm:left-6 sm:right-6 top-2 bottom-0 transform scale-[0.96] translate-y-3 bg-neutral-100 dark:bg-neutral-800 shadow-lg pointer-events-none rounded-3xl -z-10"
            />
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              className="absolute left-4 right-4 sm:left-6 sm:right-6 top-4 bottom-0 transform scale-[0.92] translate-y-6 bg-neutral-200 dark:bg-neutral-700 shadow-lg pointer-events-none rounded-3xl -z-20"
            />
          </>
        )}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-4 py-5 sm:py-6 shrink-0 bg-gradient-to-t from-white via-white to-transparent dark:from-neutral-900 dark:via-neutral-900"
      >
        <SwipeControls
          onSwipe={(type) => void onSwipeAction(type)}
          onUndo={handleUndo}
          canUndo={canUndo}
          isSwiping={isSwiping}
        />
      </motion.div>

      <MatchModal
        isOpen={showMatchModal}
        matchedUser={matchedUser}
        onClose={() => setShowMatchModal(false)}
      />
    </div>
  );
};
