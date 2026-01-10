"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw, Heart, Sparkles, Users, Filter } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useSwipe } from "../hooks/useSwipe";
import { SwipeCard, type SwipeCardRef } from "./SwipeCard";
import { SwipeControls } from "./SwipeControls";
import { MatchModal } from "./MatchModal";
import { type User } from "@shared/types";

// =============================================================================
// Types
// =============================================================================

type SwipeAction = "smash" | "super" | "pass";

// =============================================================================
// Sub-Components
// =============================================================================

interface EmptyStateProps {
  onRefresh: () => void;
  isRefreshing?: boolean;
}

const EmptyState = ({ onRefresh, isRefreshing }: EmptyStateProps) => (
  <motion.div 
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="flex flex-col items-center justify-center h-full p-6 text-center sm:p-8"
  >
    {/* Animated heart icon */}
    <motion.div 
      className="relative mb-8"
      animate={{ y: [0, -8, 0] }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
    >
      <div className="flex items-center justify-center w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br from-brand to-brand-300 shadow-2xl shadow-brand/30">
        <Heart className="w-12 h-12 sm:w-14 sm:h-14 text-white fill-white" />
      </div>
      
      {/* Floating sparkles */}
      <motion.div
        className="absolute -top-2 -right-2"
        animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.2, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <Sparkles className="w-6 h-6 text-yellow-400" />
      </motion.div>
      
      {/* Pulse rings */}
      <motion.div
        className="absolute inset-0 rounded-full border-2 border-brand/30"
        animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
    </motion.div>
    
    <h2 className="mb-3 text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white">
      No more profiles!
    </h2>
    <p className="max-w-sm mb-8 text-neutral-500 dark:text-neutral-400 leading-relaxed">
      We&apos;ve shown you everyone in your area. Try adjusting your preferences or come back later for new matches.
    </p>
    
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onRefresh}
      disabled={isRefreshing}
      className="flex items-center gap-3 px-8 py-4 font-bold text-white transition-all shadow-xl cursor-pointer bg-gradient-to-r from-brand to-brand-300 rounded-2xl shadow-brand/30 hover:shadow-2xl hover:shadow-brand/40 disabled:opacity-50"
    >
      <RotateCcw className={`w-5 h-5 ${isRefreshing ? "animate-spin" : ""}`} />
      {isRefreshing ? "Refreshing..." : "Refresh Profiles"}
    </motion.button>
  </motion.div>
);

// Loading skeleton for card
const LoadingSkeleton = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="flex flex-col items-center justify-center h-full gap-6"
  >
    {/* Animated card skeleton */}
    <div className="relative">
      <motion.div 
        className="w-72 h-96 sm:w-80 sm:h-[420px] bg-neutral-200 dark:bg-neutral-800 rounded-3xl shadow-xl overflow-hidden"
        animate={{ opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        {/* Photo area */}
        <div className="h-1/2 bg-neutral-300 dark:bg-neutral-700" />
        
        {/* Content area */}
        <div className="p-4 space-y-3">
          <div className="h-6 w-2/3 bg-neutral-300 dark:bg-neutral-700 rounded-lg" />
          <div className="h-4 w-1/2 bg-neutral-300 dark:bg-neutral-700 rounded-lg" />
          <div className="h-16 w-full bg-neutral-300 dark:bg-neutral-700 rounded-xl mt-4" />
        </div>
      </motion.div>
      
      {/* Stacked cards behind */}
      <div className="absolute inset-0 -z-10 transform scale-[0.95] translate-y-3 bg-neutral-300 dark:bg-neutral-700 rounded-3xl opacity-50" />
      <div className="absolute inset-0 -z-20 transform scale-[0.90] translate-y-6 bg-neutral-300 dark:bg-neutral-700 rounded-3xl opacity-25" />
    </div>
    
    <div className="flex flex-col items-center gap-2">
      <LoadingSpinner fullScreen={false} />
      <motion.p 
        className="text-sm font-bold tracking-widest uppercase text-neutral-400"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        Finding People...
      </motion.p>
    </div>
  </motion.div>
);

// =============================================================================
// Main Component
// =============================================================================

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

  const onSwipeAction = useCallback(async (type: SwipeAction) => {
    if (isSwiping || !currentCandidate) return;

    // Trigger visual animation on card
    if (cardRef.current) {
      await cardRef.current.triggerSwipe(type);
    }

    // Process logic - handleSwipe now accepts smash/super/pass directly
    const result = await handleSwipe(type);

    if (result && result.isMatch) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/b19804b6-4386-4870-8813-100e008e11a3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SwipeFeature.tsx:157',message:'Match detected - showing modal',data:{matchId:result.matchId,matchedUserId:currentCandidate?.id,isMatch:result.isMatch},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H2'})}).catch(()=>{});
      // #endregion
      setMatchedUser(currentCandidate);
      setShowMatchModal(true);
    }
  }, [isSwiping, currentCandidate, handleSwipe]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;
      if (showMatchModal || !currentCandidate) return;

      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault();
          void onSwipeAction("pass");
          break;
        case "ArrowRight":
          e.preventDefault();
          void onSwipeAction("smash");
          break;
        case "ArrowUp":
          e.preventDefault();
          void onSwipeAction("super");
          break;
        case "z":
        case "Z":
          e.preventDefault();
          handleUndo();
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentCandidate, showMatchModal, handleUndo, onSwipeAction]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchCandidates();
    setIsRefreshing(false);
  }, [fetchCandidates]);

  // Container styles
  const containerClass = "h-full w-full flex flex-col overflow-hidden bg-gradient-to-b from-neutral-50 to-white dark:from-neutral-900 dark:to-neutral-900";

  if (isLoading && !currentCandidate) {
    return (
      <div className={containerClass}>
        <LoadingSkeleton />
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
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between px-4 sm:px-6 py-4 shrink-0"
      >
        <div>
          <h2 className="text-2xl sm:text-3xl italic font-black text-transparent uppercase bg-gradient-to-r from-brand to-brand-300 bg-clip-text">
            Discover
          </h2>
          <motion.div 
            key={candidates.length}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 mt-0.5"
          >
            <Users className="w-3.5 h-3.5 text-neutral-400" />
            <p className="text-xs font-semibold tracking-wide text-neutral-400">
              {candidates.length} {candidates.length === 1 ? "profile" : "profiles"} nearby
            </p>
          </motion.div>
        </div>
        
        {/* Filter button placeholder - can be connected later */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="w-10 h-10 rounded-full bg-white dark:bg-neutral-800 shadow-md flex items-center justify-center text-neutral-500 hover:text-brand transition-colors cursor-pointer"
          aria-label="Filter preferences"
        >
          <Filter className="w-5 h-5" />
        </motion.button>
      </motion.div>

      {/* Card Stack - Main content area */}
      <div className="relative flex-1 min-h-0 px-4 sm:px-6 pb-2">
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
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Next Card Preview (Visual Stack Effect) */}
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

      {/* Controls */}
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

      {/* Match Modal */}
      <MatchModal
        isOpen={showMatchModal}
        matchedUser={matchedUser}
        onClose={() => setShowMatchModal(false)}
      />
    </div>
  );
};
