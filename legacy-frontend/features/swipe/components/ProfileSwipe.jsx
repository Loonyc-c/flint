import React, { useEffect, useState } from "react";
import SwapHeader from "@/shared/components/SwapHeader";
import Info from "@/features/home/components/Info";
import Question from "@/features/profile/components/Question";
import { AudioLines, Heart, X } from "lucide-react";
import profile from "@/assets/profile.jpg";
import { FloatingDockSwipe } from "@/shared/components/ui/FloatingDockSwipe";
import { useSwipeStore } from "@/features/swipe";
import toast from "react-hot-toast";
import {
  motion,
  useMotionValue,
  useTransform,
  useAnimation,
  AnimatePresence,
} from "framer-motion";
import LikeLimitModal from "./LikeLimitModal";
import { CustomAudioPlayer } from "@/features/chat";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function ProfileSwipe() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const {
    candidates,
    currentIndex,
    getCandidates,
    swipeUser,
    getCurrentCandidate,
    hasMoreCandidates,
    isLoadingCandidates,
    isSwiping,
  } = useSwipeStore();

  const currentCandidate = getCurrentCandidate();

  // Stamp effect state
  const [showStamp, setShowStamp] = useState(false);
  const [stampType, setStampType] = useState(null); // "SMASH", "PASS", "SUPER"
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [limitInfo, setLimitInfo] = useState({ limit: 5, used: 5 });

  // Animation values - ALL HOOKS MUST BE AT TOP LEVEL
  const controls = useAnimation();
  const opacity = useMotionValue(1);

  useEffect(() => {
    getCandidates();
  }, [getCandidates]);

  const handleSwipe = async (action) => {
    if (!currentCandidate || isSwiping) return;

    const result = await swipeUser(currentCandidate._id, action);

    // Check for limit error
    if (result && result.limitReached) {
      setLimitInfo({
        limit: result.limit || 5,
        used: result.used || 5,
      });
      setShowLimitModal(true);
      return result; // Return early with limit info
    }

    if (result.isMatch) {
      toast.success(
        `🎉 You matched with ${
          currentCandidate.nickname || currentCandidate.fullName
        }!`
      );
    }

    // Check if we need to load more candidates
    if (!hasMoreCandidates()) {
      getCandidates();
    }

    return result;
  };

  const handleButtonSwipe = async (action) => {
    if (!currentCandidate || isSwiping) return;

    // Determine stamp type
    let stamp = null;
    switch (action) {
      case "like":
        stamp = "SMASH";
        break;
      case "dislike":
        stamp = "PASS";
        break;
      case "superlike":
        stamp = "SUPER";
        break;
      default:
        stamp = "SMASH";
    }

    // Show stamp
    setStampType(stamp);
    setShowStamp(true);

    // Start swipe action immediately (parallel with animation)
    const swipePromise = handleSwipe(action);

    // Wait for stamp to be visible (500ms - faster)
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Fade out stamp and card together
    setShowStamp(false);

    // Animate card out with smooth scale and fade
    const animationPromise = controls.start({
      scale: 0.9,
      opacity: 0,
      y: 10, // Subtle downward movement
      transition: {
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1], // Smooth cubic-bezier easing
      },
    });

    // Wait for both animation and swipe to complete
    await Promise.all([animationPromise, swipePromise]);

    // Reset for next card
    controls.set({ scale: 1, opacity: 1 });
  };

  if (isLoadingCandidates && candidates.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand"></div>
      </div>
    );
  }

  if (!currentCandidate) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-6 px-6 text-center">
        <div className="text-6xl">😔</div>
        <div className="space-y-2">
          <p className="text-xl font-semibold text-gray-800">
            No more profiles right now
          </p>
          <p className="text-gray-600">
            We've shown you everyone in your area. Check back later for new
            people!
          </p>
        </div>
        <div className="space-y-3 w-full max-w-xs">
          <button
            onClick={() => getCandidates()}
            className="w-full px-6 py-3 bg-brand text-white rounded-lg hover:bg-brand/90 transition-colors font-semibold"
          >
            Refresh
          </button>
          <button
            onClick={() => {
              // Navigate to Main page and switch to Matching Preferences tab
              navigate("/main");
              // Wait for navigation, then click the tab using value (works in all languages)
              setTimeout(() => {
                const tabButton = document.querySelector(
                  '[data-tab="Matching Preferences"]'
                );
                if (tabButton) {
                  tabButton.click();
                } else {
                  // Fallback: try to find by value attribute
                  const allTabs = document.querySelectorAll("[data-tab]");
                  const matchingTab = Array.from(allTabs).find(
                    (tab) =>
                      tab.getAttribute("data-tab") === "Matching Preferences"
                  );
                  if (matchingTab) {
                    matchingTab.click();
                  }
                }
              }, 100);
            }}
            className="w-full px-6 py-3 bg-gray-200 dark:bg-neutral-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-neutral-600 transition-colors font-semibold"
          >
            {t("empty.adjustPreferences")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <SwapHeader
        name={currentCandidate.nickname || currentCandidate.fullName}
        isOnline={currentCandidate.isOnline}
      />

      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto pb-24 relative">
        {/* Loading overlay - only when fetching new candidates */}
        <AnimatePresence>
          {isLoadingCandidates && candidates.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 flex items-center justify-center bg-white/80 backdrop-blur-sm"
            >
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-[#B33A2E]"></div>
                <p className="text-sm font-medium text-gray-700">
                  Loading more profiles...
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stamp overlay - FIXED position so always visible regardless of scroll */}
        <AnimatePresence>
          {showStamp && (
            <motion.div
              initial={{ opacity: 0, scale: 0.3, rotate: -20 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{
                duration: 0.5,
                ease: [0.34, 1.56, 0.64, 1], // Custom spring-like easing
              }}
              className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
            >
              {/* Subtle backdrop blur */}
              <div className="absolute inset-0 bg-white/30 backdrop-blur-sm" />

              {/* Stamp with shadow and glow effect */}
              <motion.div
                initial={{ rotate: -15, scale: 0.5 }}
                animate={{
                  rotate: stampType === "PASS" ? -15 : 15,
                  scale: 1.2,
                }}
                transition={{
                  duration: 0.4,
                  ease: "backOut",
                  delay: 0.1,
                }}
                className={`relative border-[10px] rounded-3xl px-16 py-8 shadow-2xl ${
                  stampType === "SMASH"
                    ? "border-green-500 bg-green-500/10"
                    : stampType === "PASS"
                    ? "border-red-500 bg-red-500/10"
                    : "border-blue-500 bg-blue-500/10"
                }`}
                style={{
                  boxShadow:
                    stampType === "SMASH"
                      ? "0 0 60px rgba(34, 197, 94, 0.6)"
                      : stampType === "PASS"
                      ? "0 0 60px rgba(239, 68, 68, 0.6)"
                      : "0 0 60px rgba(59, 130, 246, 0.6)",
                }}
              >
                <span
                  className={`text-8xl font-black tracking-wider drop-shadow-2xl ${
                    stampType === "SMASH"
                      ? "text-green-500"
                      : stampType === "PASS"
                      ? "text-red-500"
                      : "text-blue-500"
                  }`}
                >
                  {stampType}
                </span>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          className="flex flex-col gap-6"
          animate={controls}
          style={{ opacity }}
        >
          <div className="w-full flex justify-center">
            <div className="w-full max-w-md">
              <div className="aspect-square w-full bg-black rounded-xl overflow-hidden">
                <img
                  src={
                    currentCandidate.profilePic ||
                    currentCandidate.photos?.[0] ||
                    profile
                  }
                  alt={currentCandidate.nickname || currentCandidate.fullName}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.src = profile;
                  }}
                />
              </div>
            </div>
          </div>

          <Info
            name={currentCandidate.fullName || currentCandidate.nickname}
            age={currentCandidate.age}
            location={currentCandidate.location}
            bio={currentCandidate.bio}
          />

          {currentCandidate.interests &&
            currentCandidate.interests.length > 0 && (
              <div className="px-4">
                <h3 className="font-semibold mb-2">Interests</h3>
                <div className="flex flex-wrap gap-2">
                  {currentCandidate.interests.map((interest, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-brand/10 text-brand rounded-full text-sm"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            )}

          {/* Questions Section */}
          {currentCandidate.questions &&
            currentCandidate.questions.length > 0 && (
              <div className="px-4">
                <h3 className="font-semibold mb-3">About Me</h3>
                <div className="space-y-3">
                  {currentCandidate.questions.map((q, idx) => (
                    <div key={idx}>
                      {q.audioUrl && (
                        <CustomAudioPlayer
                          audioUrl={q.audioUrl}
                          question={q.question}
                          showQuestion={true}
                          showDelete={false}
                          size="small"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
        </motion.div>
      </div>

      {/* Fixed swipe buttons at bottom */}
      <FloatingDockSwipe
        className="fixed inset-x-0 bottom-0 z-50 px-4 py-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] bg-white/80 backdrop-blur border-t border-accent"
        onLike={() => handleButtonSwipe("like")}
        onDislike={() => handleButtonSwipe("dislike")}
        onSuperlike={() => handleButtonSwipe("superlike")}
        disabled={isSwiping}
      />

      {/* Like Limit Modal */}
      <LikeLimitModal
        isOpen={showLimitModal}
        onClose={() => setShowLimitModal(false)}
        limit={limitInfo.limit}
        used={limitInfo.used}
      />
    </div>
  );
}
