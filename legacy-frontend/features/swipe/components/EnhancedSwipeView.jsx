import React, { useEffect, useState, useRef } from "react";
import SwipeableProfileCard from "./SwipeableProfileCard";
import { Heart, X, Star, Bookmark, RotateCcw } from "lucide-react";
import { useSwipeStore } from "@/features/swipe";
import { useMatchStore, useAudioStore } from "@/features/chat";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";

export default function EnhancedSwipeView() {
  const { t } = useTranslation();
  const {
    candidates,
    currentIndex,
    getCandidates,
    swipeUser,
    undoSwipe,
    lastSwipe,
    getCurrentCandidate,
    hasMoreCandidates,
    isLoadingCandidates,
    isSwiping,
  } = useSwipeStore();

  const { getMatches } = useMatchStore();
  const { preloadAudio, pauseAudio, toggleAudio } = useAudioStore();
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [matchedUser, setMatchedUser] = useState(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const cardRef = useRef(null);

  const currentCandidate = getCurrentCandidate();

  useEffect(() => {
    getCandidates();
  }, [getCandidates]);

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mediaQuery.matches);

    const handleChange = (e) => setReducedMotion(e.matches);
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger if user is typing in an input
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") {
        return;
      }

      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault();
          handleButtonSwipe("dislike");
          break;
        case "ArrowRight":
          e.preventDefault();
          handleButtonSwipe("like");
          break;
        case "ArrowUp":
          e.preventDefault();
          handleButtonSwipe("save");
          break;
        case "z":
        case "Z":
          e.preventDefault();
          handleUndo();
          break;
        case " ":
          e.preventDefault();
          // Toggle audio for current card's voice intro
          if (currentCandidate?.voiceIntro) {
            toggleAudio(
              `voice-intro-${currentCandidate._id}`,
              currentCandidate.voiceIntro
            );
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentCandidate, toggleAudio]);

  // Preload audio for next 2-3 cards
  useEffect(() => {
    if (candidates.length > 0) {
      const audioUrls = [];
      const nextCards = candidates.slice(currentIndex, currentIndex + 3);

      nextCards.forEach((candidate) => {
        if (candidate.voiceIntro) {
          audioUrls.push(candidate.voiceIntro);
        }
        if (candidate.questions) {
          candidate.questions.forEach((q) => {
            if (q.audioUrl) {
              audioUrls.push(q.audioUrl);
            }
          });
        }
      });

      if (audioUrls.length > 0) {
        preloadAudio(audioUrls);
      }
    }
  }, [candidates, currentIndex, preloadAudio]);

  const handleSwipe = async (action) => {
    if (!currentCandidate || isSwiping) return;

    const result = await swipeUser(currentCandidate._id, action);

    // Return result for SwipeableProfileCard to handle limit modal
    if (result && result.limitReached) {
      return result;
    }

    if (result && result.isMatch) {
      setMatchedUser(currentCandidate);
      setShowMatchModal(true);
      getMatches(); // Refresh matches

      setTimeout(() => {
        setShowMatchModal(false);
      }, 3000);
    }

    // Check if we need to load more candidates
    if (!hasMoreCandidates()) {
      getCandidates();
    }

    return result;
  };

  const handleButtonSwipe = (action) => {
    if (!currentCandidate || isSwiping) return;

    // Log button swipe event
    console.log("[EVENT] button_swipe", {
      action,
      userId: currentCandidate._id,
    });

    // Trigger animation on card via ref
    if (cardRef.current && cardRef.current.triggerSwipe) {
      cardRef.current.triggerSwipe(action);
    } else {
      // Fallback to direct swipe if ref not available
      handleSwipe(action);
    }
  };

  const handleUndo = () => {
    const result = undoSwipe();
    if (result.success) {
      // Pause any playing audio
      pauseAudio();
    }
  };

  if (isLoadingCandidates && candidates.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-[#B33A2E] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-600">Finding amazing people for you...</p>
        </div>
      </div>
    );
  }

  if (!currentCandidate) {
    return (
      <div className="flex items-center justify-center h-screen px-4">
        <div className="text-center space-y-4 max-w-md">
          <div className="w-20 h-20 bg-gradient-to-br from-[#B33A2E] to-[#CF5144] rounded-full flex items-center justify-center mx-auto">
            <Heart className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {t("empty.noMoreProfiles")}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {t("empty.checkBackLater")}
          </p>
          <button
            onClick={() => getCandidates()}
            className="mt-4 px-6 py-3 bg-gradient-to-r from-[#B33A2E] to-[#CF5144] text-white rounded-full font-medium hover:shadow-lg transition-all"
          >
            <RotateCcw className="w-5 h-5 inline mr-2" />
            {t("empty.adjustPreferences")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-[#D9776D]/10 via-[#CF5144]/10 to-[#B33A2E]/5 dark:from-[#D9776D]/5 dark:via-[#CF5144]/5 dark:to-[#B33A2E]/5 dark:bg-neutral-900 py-8 px-4">
      {/* Header */}
      <div className="max-w-md mx-auto mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-[#B33A2E] to-[#CF5144] bg-clip-text text-transparent">
              {t("swipe.discover")}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t("swipe.profilesRemaining", {
                count: candidates.length - currentIndex,
              })}
            </p>
          </div>
          <div className="flex gap-2">
            <div className="px-3 py-1 bg-white dark:bg-neutral-800 rounded-full shadow-sm text-xs font-medium text-gray-600 dark:text-gray-300">
              {t("swipe.swipeToExplore")}
            </div>
          </div>
        </div>
      </div>

      {/* Card stack */}
      <div
        className="relative max-w-md mx-auto mb-8"
        style={{ willChange: "transform" }}
      >
        <AnimatePresence mode="wait">
          <SwipeableProfileCard
            ref={cardRef}
            key={currentCandidate._id}
            candidate={currentCandidate}
            onSwipe={handleSwipe}
            disabled={isSwiping}
          />
        </AnimatePresence>

        {/* Preview next card */}
        {candidates[currentIndex + 1] && (
          <div className="absolute inset-0 -z-10 scale-95 opacity-50 blur-sm pointer-events-none">
            <div className="w-full h-[600px] bg-white dark:bg-neutral-800 rounded-3xl shadow-xl" />
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-center gap-4">
          {/* Undo button */}
          <AnimatePresence>
            {lastSwipe && !lastSwipe.wasMatch && (
              <motion.button
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleUndo}
                className="w-12 h-12 rounded-full bg-purple-500 shadow-lg flex items-center justify-center text-white hover:shadow-xl transition-all"
                aria-label="Undo last swipe (Z)"
                title="Undo (Z)"
              >
                <RotateCcw className="w-5 h-5" />
              </motion.button>
            )}
          </AnimatePresence>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleButtonSwipe("dislike")}
            disabled={isSwiping}
            className="w-16 h-16 rounded-full bg-white shadow-lg flex items-center justify-center text-gray-600 hover:text-gray-800 hover:shadow-xl transition-all disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
            aria-label="Pass (←)"
          >
            <X className="w-8 h-8" strokeWidth={2.5} />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleButtonSwipe("save")}
            disabled={isSwiping}
            className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 shadow-lg flex items-center justify-center text-white hover:shadow-xl transition-all disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2"
            aria-label="Save (↑)"
          >
            <Bookmark className="w-6 h-6" fill="white" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleButtonSwipe("like")}
            disabled={isSwiping}
            className="w-16 h-16 rounded-full bg-gradient-to-br from-[#B33A2E] to-[#CF5144] shadow-lg flex items-center justify-center text-white hover:shadow-xl transition-all disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[#B33A2E] focus:ring-offset-2"
            aria-label="Smash (→)"
          >
            <Heart className="w-8 h-8" fill="white" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleButtonSwipe("superlike")}
            disabled={isSwiping}
            className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 shadow-lg flex items-center justify-center text-white hover:shadow-xl transition-all disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
            aria-label="Superlike"
          >
            <Star className="w-6 h-6" fill="white" />
          </motion.button>
        </div>

        {/* Keyboard shortcuts hint */}
        <div className="mt-6 flex flex-col items-center gap-2">
          <div className="flex justify-center gap-6 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full" />
              <span>← Pass</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-amber-400 rounded-full" />
              <span>↑ Save</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-[#B33A2E] rounded-full" />
              <span>→ Smash</span>
            </div>
          </div>
          <div className="text-xs text-gray-400">
            <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-600 font-mono">
              Z
            </kbd>{" "}
            to undo •{" "}
            <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-600 font-mono">
              Space
            </kbd>{" "}
            to play audio
          </div>
        </div>
      </div>

      {/* Match modal */}
      <AnimatePresence>
        {showMatchModal && matchedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white dark:bg-neutral-800 rounded-3xl p-8 max-w-md w-full text-center space-y-6"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-[#B33A2E] to-[#CF5144] rounded-full flex items-center justify-center mx-auto animate-bounce">
                <Heart className="w-10 h-10 text-white" fill="white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-[#B33A2E] to-[#CF5144] bg-clip-text text-transparent mb-2">
                  {t("swipe.itsAMatch")}
                </h2>
                <p className="text-gray-600 dark:text-gray-300">
                  {t("swipe.youAndMatched", {
                    name: matchedUser.nickname || matchedUser.fullName,
                  })}
                </p>
              </div>
              <button
                onClick={() => setShowMatchModal(false)}
                className="w-full py-3 bg-gradient-to-r from-[#B33A2E] to-[#CF5144] text-white rounded-full font-medium hover:shadow-lg transition-all"
              >
                {t("swipe.startChatting")}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
