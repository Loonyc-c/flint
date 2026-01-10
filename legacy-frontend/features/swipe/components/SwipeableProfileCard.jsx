import React, {
  useState,
  useRef,
  useEffect,
  useImperativeHandle,
  forwardRef,
  useCallback,
  useMemo,
} from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  useAnimation,
  AnimatePresence,
} from "framer-motion";
import {
  Heart,
  X,
  Star,
  Bookmark,
  Play,
  Pause,
  MapPin,
  Volume2,
} from "lucide-react";
import profile from "@/assets/profile.jpg";
import { useAudioStore, CustomAudioPlayer } from "@/features/chat";
import LikeLimitModal from "./LikeLimitModal";

const SwipeableProfileCard = forwardRef(
  ({ candidate, onSwipe, disabled = false, index = 0 }, ref) => {
    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
    const [showStamp, setShowStamp] = useState(false);
    const [stampType, setStampType] = useState(null); // "SMASH", "PASS", "SUPER"
    const [showLimitModal, setShowLimitModal] = useState(false);
    const [limitInfo, setLimitInfo] = useState({ limit: 5, used: 5 });
    const cardRef = useRef(null);

    const { toggleAudio, isAudioPlaying, preloadAudio } = useAudioStore();

    const controls = useAnimation();
    const opacity = useMotionValue(1);

    // Memoize photos array to prevent recalculation
    const photos = useMemo(
      () => [candidate.profilePic, ...(candidate.photos || [])].filter(Boolean),
      [candidate.profilePic, candidate.photos]
    );

    // Preload images for smooth transitions
    useEffect(() => {
      photos.forEach((photoUrl) => {
        const img = new Image();
        img.src = photoUrl;
      });
    }, [photos]);

    // Preload audio for this card
    useEffect(() => {
      const audioUrls = [];

      // Add voice intro if available
      if (candidate.voiceIntro) {
        audioUrls.push(candidate.voiceIntro);
      }

      // Add question audio URLs
      if (candidate.questions) {
        candidate.questions.forEach((q) => {
          if (q.audioUrl) {
            audioUrls.push(q.audioUrl);
          }
        });
      }

      if (audioUrls.length > 0) {
        preloadAudio(audioUrls);
      }
    }, [candidate, preloadAudio]);

    const handleToggleAudio = useCallback(
      (audioUrl, audioId) => {
        toggleAudio(audioId, audioUrl);
      },
      [toggleAudio]
    );

    const nextPhoto = useCallback(() => {
      setCurrentPhotoIndex((prev) => (prev + 1) % photos.length);
    }, [photos.length]);

    const prevPhoto = useCallback(() => {
      setCurrentPhotoIndex(
        (prev) => (prev - 1 + photos.length) % photos.length
      );
    }, [photos.length]);

    // Programmatic swipe function for button clicks with stamp effect
    const triggerSwipe = async (action) => {
      if (disabled) return;

      // Determine stamp type
      let stamp = null;
      switch (action) {
        case "like":
          stamp = "SMASH";
          break;
        case "dislike":
          stamp = "PASS";
          break;
        case "save":
        case "superlike":
          stamp = "SUPER";
          break;
        default:
          stamp = "SMASH";
      }

      // Show stamp
      setStampType(stamp);
      setShowStamp(true);

      // Wait for stamp to be visible (700ms - slightly faster)
      await new Promise((resolve) => setTimeout(resolve, 700));

      // Start fading out stamp and card together with smooth animation
      setShowStamp(false);

      // Animate card out with smooth scale and fade
      await controls.start({
        scale: 0.85,
        opacity: 0,
        y: 20, // Slight downward movement
        transition: {
          duration: 0.4,
          ease: [0.4, 0, 0.2, 1], // Smooth cubic-bezier easing
        },
      });

      // Call onSwipe and check for limit error
      const result = await onSwipe(action);

      // If limit reached, show modal and reset card
      if (result && result.limitReached) {
        setLimitInfo({
          limit: result.limit || 5,
          used: result.used || 5,
        });
        setShowLimitModal(true);

        // Reset card position
        controls.set({ scale: 1, opacity: 1 });
      }
    };

    // Expose triggerSwipe method to parent via ref
    useImperativeHandle(ref, () => ({
      triggerSwipe,
    }));

    return (
      <motion.div
        ref={cardRef}
        className="relative w-full max-w-md mx-auto h-[600px]"
        style={{ opacity }}
        animate={controls}
      >
        {/* Stamp overlay - appears on button click (card-only, no full-screen overlay) */}
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
              className="absolute inset-0 rounded-3xl z-50 flex items-center justify-center pointer-events-none"
            >
              {/* Subtle backdrop blur only on card */}
              <div className="absolute inset-0 bg-white/30 backdrop-blur-sm rounded-3xl" />

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

        {/* Main card */}
        <div className="relative w-full h-full bg-white dark:bg-neutral-800 rounded-3xl shadow-2xl overflow-hidden">
          {/* Photo carousel */}
          <div className="relative h-[400px] bg-black">
            <img
              src={photos[currentPhotoIndex] || profile}
              alt={candidate.nickname || candidate.fullName}
              className="w-full h-full object-cover transition-opacity duration-300"
              loading="eager"
              decoding="async"
              onError={(e) => {
                e.currentTarget.src = profile;
              }}
            />

            {/* Photo navigation */}
            {photos.length > 1 && (
              <>
                <div className="absolute top-4 left-0 right-0 flex gap-1 px-4 z-20">
                  {photos.map((_, index) => (
                    <div
                      key={index}
                      className={`flex-1 h-1 rounded-full transition-all ${
                        index === currentPhotoIndex ? "bg-white" : "bg-white/30"
                      }`}
                    />
                  ))}
                </div>

                <button
                  onClick={prevPhoto}
                  className="absolute left-0 top-0 bottom-0 w-1/3 z-10"
                  aria-label="Previous photo"
                />
                <button
                  onClick={nextPhoto}
                  className="absolute right-0 top-0 bottom-0 w-1/3 z-10"
                  aria-label="Next photo"
                />
              </>
            )}

            {/* Gradient overlay */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/60 to-transparent" />
          </div>

          {/* Profile info */}
          <div className="p-6 space-y-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {candidate.fullName || candidate.nickname}
                {candidate.age && (
                  <span className="text-gray-600 dark:text-gray-400 font-normal">
                    , {candidate.age}
                  </span>
                )}
              </h2>
              {candidate.location && (
                <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400 mt-1">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">{candidate.location}</span>
                </div>
              )}
            </div>

            {/* Voice Intro - Prominent */}
            {candidate.voiceIntro ? (
              <motion.button
                onClick={() =>
                  handleToggleAudio(
                    candidate.voiceIntro,
                    `voice-intro-${candidate._id}`
                  )
                }
                className="w-full bg-gradient-to-r from-[#B33A2E] to-[#CF5144] hover:from-[#8A2D23] hover:to-[#B33A2E] text-white rounded-2xl p-4 flex items-center gap-3 shadow-lg transition-all"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                aria-label="Play voice introduction"
              >
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  {isAudioPlaying(`voice-intro-${candidate._id}`) ? (
                    <Pause className="w-6 h-6" fill="white" />
                  ) : (
                    <Play className="w-6 h-6 ml-1" fill="white" />
                  )}
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold text-sm">Voice Intro</p>
                  <p className="text-xs text-white/90">
                    {isAudioPlaying(`voice-intro-${candidate._id}`)
                      ? "Playing..."
                      : "Tap to hear their voice"}
                  </p>
                </div>
                <Volume2 className="w-5 h-5" />
              </motion.button>
            ) : (
              <div className="w-full bg-gray-100 dark:bg-neutral-700 rounded-2xl p-4 flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-200 dark:bg-neutral-600 rounded-full flex items-center justify-center">
                  <Volume2 className="w-6 h-6 text-gray-400 dark:text-gray-300" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold text-sm text-gray-700 dark:text-gray-300">
                    Voice Intro
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    No audio yet
                  </p>
                </div>
              </div>
            )}

            {candidate.bio && (
              <p className="text-gray-700 dark:text-gray-300 text-sm line-clamp-2">
                {candidate.bio}
              </p>
            )}

            {/* Q&A - Top 3 */}
            {candidate.questions && candidate.questions.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Get to know me
                </p>
                {candidate.questions.slice(0, 3).map((q, index) => {
                  const hasAudio = q.audioUrl && q.audioUrl.trim() !== "";

                  return (
                    <div key={index}>
                      {hasAudio ? (
                        <CustomAudioPlayer
                          audioUrl={q.audioUrl}
                          question={q.question}
                          showQuestion={true}
                          showDelete={false}
                          size="small"
                        />
                      ) : q.answer ? (
                        <div className="bg-gradient-to-r from-[#D9776D]/10 to-[#CF5144]/10 dark:from-[#D9776D]/20 dark:to-[#CF5144]/20 rounded-xl p-3">
                          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 leading-relaxed">
                            {q.question}
                          </p>
                          <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                            {q.answer}
                          </p>
                        </div>
                      ) : (
                        <div className="bg-gradient-to-r from-[#D9776D]/10 to-[#CF5144]/10 dark:from-[#D9776D]/20 dark:to-[#CF5144]/20 rounded-xl p-3">
                          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 leading-relaxed">
                            {q.question}
                          </p>
                          <p className="text-sm text-gray-400 dark:text-gray-500 italic">
                            No answer yet
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Show more indicator if there are more questions */}
                {candidate.questions.length > 3 && (
                  <p className="text-xs text-gray-500 text-center">
                    +{candidate.questions.length - 3} more questions
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Like Limit Modal */}
        <LikeLimitModal
          isOpen={showLimitModal}
          onClose={() => setShowLimitModal(false)}
          limit={limitInfo.limit}
          used={limitInfo.used}
        />
      </motion.div>
    );
  }
);

SwipeableProfileCard.displayName = "SwipeableProfileCard";

// Memoize the component to prevent unnecessary re-renders
export default React.memo(SwipeableProfileCard);
