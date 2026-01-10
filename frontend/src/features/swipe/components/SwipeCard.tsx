"use client";

import {
  useState,
  useMemo,
  useEffect,
  forwardRef,
  useImperativeHandle,
  useCallback,
} from "react";
import {
  motion,
  AnimatePresence,
  useAnimation,
  useMotionValue,
  useTransform,
  PanInfo,
} from "framer-motion";
import { MapPin, Volume2, Play, Pause, Heart, X, Star, ChevronLeft, ChevronRight, Mic } from "lucide-react";
import Image from "next/image";
import { type User } from "@shared/types";
import { CustomAudioPlayer } from "@/components/ui/custom-audio-player";

// =============================================================================
// Types
// =============================================================================

interface SwipeCardProps {
  candidate: User;
  onSwipe?: (type: "smash" | "super" | "pass") => Promise<void>;
}

export interface SwipeCardRef {
  triggerSwipe: (type: "smash" | "super" | "pass") => Promise<void>;
}

// =============================================================================
// Constants
// =============================================================================

const SWIPE_THRESHOLD = 100;
const ROTATION_RANGE = 15;

// =============================================================================
// Sub Components
// =============================================================================

// Photo carousel dots
const CarouselDots = ({ 
  total, 
  current, 
  onSelect 
}: { 
  total: number; 
  current: number; 
  onSelect: (idx: number) => void;
}) => (
  <div className="absolute left-0 right-0 z-20 flex gap-1.5 px-4 top-4">
    {Array.from({ length: total }).map((_, idx) => (
      <button
        key={idx}
        onClick={(e) => { e.stopPropagation(); onSelect(idx); }}
        className={`
          flex-1 h-1 rounded-full transition-all duration-300 cursor-pointer
          ${idx === current 
            ? "bg-white shadow-lg shadow-white/30" 
            : "bg-white/40 hover:bg-white/60"
          }
        `}
        aria-label={`View photo ${idx + 1}`}
      />
    ))}
  </div>
);

// Swipe direction indicator overlay
const SwipeIndicator = ({ 
  type, 
  opacity 
}: { 
  type: "smash" | "pass" | "super"; 
  opacity: number;
}) => {
  const styles = {
    smash: {
      text: "SMASH",
      color: "text-green-500",
      border: "border-green-500",
      bg: "bg-green-500/10",
      position: "left-6 top-1/4 -rotate-12",
    },
    pass: {
      text: "PASS",
      color: "text-red-500",
      border: "border-red-500",
      bg: "bg-red-500/10",
      position: "right-6 top-1/4 rotate-12",
    },
    super: {
      text: "SUPER",
      color: "text-blue-500",
      border: "border-blue-500",
      bg: "bg-blue-500/10",
      position: "left-1/2 -translate-x-1/2 top-1/4",
    },
  };

  const s = styles[type];

  return (
    <motion.div
      className={`absolute ${s.position} z-40 pointer-events-none`}
      style={{ opacity }}
    >
      <div className={`
        px-6 py-3 border-4 ${s.border} ${s.bg} rounded-xl
        backdrop-blur-sm
      `}>
        <span className={`text-3xl sm:text-4xl font-black ${s.color}`}>
          {s.text}
        </span>
      </div>
    </motion.div>
  );
};

// =============================================================================
// Main Component
// =============================================================================

export const SwipeCard = forwardRef<SwipeCardRef, SwipeCardProps>(
  ({ candidate, onSwipe }, ref) => {
    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
    const [stampType, setStampType] = useState<"SMASH" | "PASS" | "SUPER" | null>(null);
    const [showStamp, setShowStamp] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    const controls = useAnimation();
    
    // Motion values for drag
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    
    // Derived values for rotation and opacity
    const rotate = useTransform(x, [-300, 0, 300], [-ROTATION_RANGE, 0, ROTATION_RANGE]);
    const likeOpacity = useTransform(x, [0, SWIPE_THRESHOLD], [0, 1]);
    const passOpacity = useTransform(x, [-SWIPE_THRESHOLD, 0], [1, 0]);
    const superOpacity = useTransform(y, [-SWIPE_THRESHOLD, 0], [1, 0]);
    const cardOpacity = useMotionValue(1);

    // Memoize photos array
    const photos = useMemo(() => {
      const photoList = [];
      if (candidate.profile?.photo) photoList.push(candidate.profile.photo);
      if (candidate.profile?.photos) photoList.push(...candidate.profile.photos);
      return photoList.filter(Boolean) as string[];
    }, [candidate.profile?.photo, candidate.profile?.photos]);

    const [isPlayingVoice, setIsPlayingVoice] = useState(false);
    const [voiceAudio, setVoiceAudio] = useState<HTMLAudioElement | null>(null);

    const handleToggleVoice = useCallback(() => {
      if (!candidate.profile?.voiceIntro) return;

      if (isPlayingVoice && voiceAudio) {
        voiceAudio.pause();
        setIsPlayingVoice(false);
      } else {
        if (!voiceAudio) {
          const audio = new Audio(candidate.profile.voiceIntro);
          audio.onended = () => setIsPlayingVoice(false);
          setVoiceAudio(audio);
          audio.play();
        } else {
          voiceAudio.play();
        }
        setIsPlayingVoice(true);
      }
    }, [candidate.profile?.voiceIntro, isPlayingVoice, voiceAudio]);

    // Cleanup audio on unmount
    useEffect(() => {
      return () => {
        if (voiceAudio) {
          voiceAudio.pause();
          voiceAudio.src = "";
        }
      };
    }, [voiceAudio]);

    const nextPhoto = useCallback(() => {
      if (photos.length > 1) {
        setCurrentPhotoIndex((prev) => (prev + 1) % photos.length);
      }
    }, [photos.length]);

    const prevPhoto = useCallback(() => {
      if (photos.length > 1) {
        setCurrentPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
      }
    }, [photos.length]);

    // Handle drag end
    const handleDragEnd = useCallback(async (_: unknown, info: PanInfo) => {
      setIsDragging(false);
      
      const swipeX = info.offset.x;
      const swipeY = info.offset.y;
      const velocityX = info.velocity.x;
      const velocityY = info.velocity.y;
      
      // Determine swipe direction
      const isSwipeRight = swipeX > SWIPE_THRESHOLD || velocityX > 500;
      const isSwipeLeft = swipeX < -SWIPE_THRESHOLD || velocityX < -500;
      const isSwipeUp = swipeY < -SWIPE_THRESHOLD || velocityY < -500;
      
      if (isSwipeUp && Math.abs(swipeY) > Math.abs(swipeX)) {
        // Super
        await triggerSwipe("super");
        onSwipe?.("super");
      } else if (isSwipeRight) {
        // Smash
        await triggerSwipe("smash");
        onSwipe?.("smash");
      } else if (isSwipeLeft) {
        // Pass
        await triggerSwipe("pass");
        onSwipe?.("pass");
      } else {
        // Spring back to center
        await controls.start({
          x: 0,
          y: 0,
          transition: { type: "spring", stiffness: 500, damping: 30 },
        });
        x.set(0);
        y.set(0);
      }
    }, [controls, onSwipe, x, y]);

    const triggerSwipe = async (type: "smash" | "super" | "pass") => {
      let stamp: "SMASH" | "PASS" | "SUPER" = "SMASH";
      let exitX = 0;
      let exitY = 0;
      
      if (type === "pass") {
        stamp = "PASS";
        exitX = -400;
      } else if (type === "super") {
        stamp = "SUPER";
        exitY = -400;
      } else {
        exitX = 400;
      }

      // Show stamp with animation
      setStampType(stamp);
      setShowStamp(true);

      // Wait for stamp to be visible
      await new Promise((resolve) => setTimeout(resolve, 400));

      // Fade out stamp
      setShowStamp(false);

      // Animate card out
      await controls.start({
        x: exitX,
        y: exitY,
        opacity: 0,
        scale: 0.8,
        transition: {
          duration: 0.4,
          ease: [0.4, 0, 0.2, 1],
        },
      });
    };

    useImperativeHandle(ref, () => ({
      triggerSwipe,
    }));

    // Get stamp styles
    const getStampStyles = () => {
      switch (stampType) {
        case "SMASH":
          return {
            border: "border-green-500",
            bg: "bg-green-500/20",
            text: "text-green-500",
            shadow: "0 0 80px rgba(34, 197, 94, 0.7)",
            iconBg: "bg-green-500",
          };
        case "PASS":
          return {
            border: "border-red-500",
            bg: "bg-red-500/20",
            text: "text-red-500",
            shadow: "0 0 80px rgba(239, 68, 68, 0.7)",
            iconBg: "bg-red-500",
          };
        case "SUPER":
          return {
            border: "border-blue-500",
            bg: "bg-blue-500/20",
            text: "text-blue-500",
            shadow: "0 0 80px rgba(59, 130, 246, 0.7)",
            iconBg: "bg-blue-500",
          };
        default:
          return {
            border: "border-green-500",
            bg: "bg-green-500/20",
            text: "text-green-500",
            shadow: "0 0 80px rgba(34, 197, 94, 0.7)",
            iconBg: "bg-green-500",
          };
      }
    };

    const stampStyles = getStampStyles();

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
        {/* Drag direction indicators */}
        {isDragging && (
          <>
            <SwipeIndicator type="smash" opacity={likeOpacity.get()} />
            <SwipeIndicator type="pass" opacity={passOpacity.get()} />
            <SwipeIndicator type="super" opacity={superOpacity.get()} />
          </>
        )}

        {/* Stamp Overlay with Enhanced Animation */}
        <AnimatePresence>
          {showStamp && stampType && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none"
            >
              {/* Backdrop with blur */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 bg-black/40 backdrop-blur-md" 
              />

              {/* Stamp container */}
              <motion.div
                initial={{ scale: 0.3, rotate: -30, opacity: 0 }}
                animate={{ 
                  scale: 1, 
                  rotate: stampType === "PASS" ? -15 : stampType === "SUPER" ? 0 : 15, 
                  opacity: 1 
                }}
                exit={{ scale: 1.2, opacity: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 20,
                }}
                className={`
                  relative flex flex-col items-center gap-4
                  border-[6px] sm:border-[8px] rounded-2xl sm:rounded-3xl 
                  px-8 sm:px-14 py-5 sm:py-8 
                  ${stampStyles.border} ${stampStyles.bg}
                  backdrop-blur-sm
                `}
                style={{ boxShadow: stampStyles.shadow }}
              >
                {/* Icon */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: "spring", stiffness: 500 }}
                  className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full ${stampStyles.iconBg} flex items-center justify-center shadow-lg`}
                >
                  {stampType === "SMASH" && <Heart className="w-7 h-7 sm:w-8 sm:h-8 text-white fill-white" />}
                  {stampType === "PASS" && <X className="w-7 h-7 sm:w-8 sm:h-8 text-white" strokeWidth={3} />}
                  {stampType === "SUPER" && <Star className="w-7 h-7 sm:w-8 sm:h-8 text-white fill-white" />}
                </motion.div>
                
                {/* Text */}
                <span className={`text-4xl sm:text-6xl font-black tracking-wider ${stampStyles.text}`}>
                  {stampType === "SMASH" ? "SMASH!" : stampType === "PASS" ? "PASS" : "SUPER!"}
                </span>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Photo Area */}
        <div className="relative h-[50%] min-h-[200px] bg-neutral-900 shrink-0 overflow-hidden">
          {photos.length > 0 ? (
            <AnimatePresence mode="wait">
              <motion.div
                key={currentPhotoIndex}
                initial={{ opacity: 0, scale: 1.1 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0"
              >
                <Image
                  src={photos[currentPhotoIndex]}
                  alt={candidate.profile?.nickName || candidate.firstName || "User"}
                  fill
                  className="object-cover pointer-events-none"
                  priority
                  draggable={false}
                />
              </motion.div>
            </AnimatePresence>
          ) : (
            <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-neutral-800 to-neutral-900">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-neutral-700 flex items-center justify-center">
                  <span className="text-3xl">👤</span>
                </div>
                <span className="text-sm text-neutral-500">No Photo</span>
              </div>
            </div>
          )}

          {/* Carousel Navigation */}
          {photos.length > 1 && (
            <>
              <CarouselDots 
                total={photos.length} 
                current={currentPhotoIndex}
                onSelect={setCurrentPhotoIndex}
              />
              
              {/* Navigation areas */}
              <button
                onClick={prevPhoto}
                className="absolute inset-y-0 left-0 z-10 w-1/3 flex items-center justify-start pl-2 opacity-0 hover:opacity-100 transition-opacity"
                aria-label="Previous photo"
              >
                <div className="w-8 h-8 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center">
                  <ChevronLeft className="w-5 h-5 text-white" />
                </div>
              </button>
              <button
                onClick={nextPhoto}
                className="absolute inset-y-0 right-0 z-10 w-1/3 flex items-center justify-end pr-2 opacity-0 hover:opacity-100 transition-opacity"
                aria-label="Next photo"
              >
                <div className="w-8 h-8 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center">
                  <ChevronRight className="w-5 h-5 text-white" />
                </div>
              </button>
            </>
          )}

          {/* Gradient Overlay */}
          <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none bg-gradient-to-t from-black/90 via-black/50 to-transparent" />

          {/* Name overlay on photo */}
          <div className="absolute bottom-0 left-0 right-0 z-10 p-4">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white drop-shadow-lg flex items-baseline gap-2">
                  {candidate.profile?.nickName || candidate.firstName}
                  {candidate.profile?.age && (
                    <span className="text-xl sm:text-2xl font-normal text-white/80">
                      {candidate.profile.age}
                    </span>
                  )}
                </h2>
                <div className="flex items-center gap-1.5 text-white/70 mt-1">
                  <MapPin className="w-3.5 h-3.5" />
                  <span className="text-sm">Nearby</span>
                </div>
              </div>
              
              {/* Voice intro quick button */}
              {candidate.profile?.voiceIntro && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => { e.stopPropagation(); handleToggleVoice(); }}
                  className={`
                    w-12 h-12 rounded-full flex items-center justify-center
                    ${isPlayingVoice 
                      ? "bg-brand shadow-lg shadow-brand/40" 
                      : "bg-white/20 backdrop-blur-md hover:bg-white/30"
                    }
                    transition-all duration-300
                  `}
                  aria-label={isPlayingVoice ? "Pause voice intro" : "Play voice intro"}
                >
                  {isPlayingVoice ? (
                    <Pause className="w-5 h-5 text-white fill-white" />
                  ) : (
                    <Volume2 className="w-5 h-5 text-white" />
                  )}
                </motion.button>
              )}
            </div>
          </div>
        </div>

        {/* Info Section - Scrollable */}
        <div className="flex-1 overflow-y-auto bg-white dark:bg-neutral-800">
          <div className="p-4 space-y-4">
            {/* Voice Intro Section */}
            {candidate.profile?.voiceIntro ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <button
                  onClick={handleToggleVoice}
                  className="flex items-center w-full gap-4 p-4 text-white transition-all shadow-lg cursor-pointer bg-gradient-to-r from-brand to-brand-300 hover:shadow-xl rounded-2xl shadow-brand/30 group"
                >
                  <div className={`
                    flex items-center justify-center rounded-full w-12 h-12 shrink-0
                    ${isPlayingVoice ? "bg-white/30" : "bg-white/20"}
                    transition-colors group-hover:bg-white/30
                  `}>
                    {isPlayingVoice ? (
                      <Pause className="w-5 h-5 fill-white" />
                    ) : (
                      <Play className="w-5 h-5 fill-white ml-0.5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="font-bold flex items-center gap-2">
                      <Mic className="w-4 h-4" />
                      Voice Intro
                    </p>
                    <p className="text-sm opacity-90">
                      {isPlayingVoice ? "Playing..." : "Tap to hear their voice"}
                    </p>
                  </div>
                  
                  {/* Sound wave animation */}
                  {isPlayingVoice && (
                    <div className="flex items-center gap-0.5">
                      {[...Array(4)].map((_, i) => (
                        <motion.div
                          key={i}
                          className="w-1 bg-white/80 rounded-full"
                          animate={{ height: [8, 20, 8] }}
                          transition={{
                            duration: 0.5,
                            repeat: Infinity,
                            delay: i * 0.1,
                          }}
                        />
                      ))}
                    </div>
                  )}
                </button>
              </motion.div>
            ) : (
              <div className="flex items-center w-full gap-4 p-4 bg-neutral-100 dark:bg-neutral-700/50 rounded-2xl opacity-60">
                <div className="flex items-center justify-center rounded-full w-12 h-12 bg-neutral-200 dark:bg-neutral-600 shrink-0">
                  <Volume2 className="w-5 h-5 text-neutral-400" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-bold text-neutral-700 dark:text-neutral-300">
                    Voice Intro
                  </p>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    Not recorded yet
                  </p>
                </div>
              </div>
            )}

            {/* Bio */}
            {candidate.profile?.bio && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="p-4 bg-neutral-50 dark:bg-neutral-700/30 rounded-2xl"
              >
                <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-2">
                  About
                </h3>
                <p className="text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
                  {candidate.profile.bio}
                </p>
              </motion.div>
            )}

            {/* Questions */}
            {candidate.profile?.questions && candidate.profile.questions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-3"
              >
                <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-400 px-1">
                  Get to know me
                </h3>
                {candidate.profile.questions.slice(0, 2).map((q, i) => {
                  if (!q.questionId) return null;
                  return (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + i * 0.1 }}
                    >
                      {q.audioUrl ? (
                        <CustomAudioPlayer
                          audioUrl={q.audioUrl}
                          question={`Question ${i + 1}`}
                          size="small"
                        />
                      ) : (
                        <div className="bg-gradient-to-r from-brand/5 to-brand-300/5 dark:from-brand/10 dark:to-brand-300/10 rounded-xl p-3 border border-brand/10">
                          <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                            Question {i + 1}
                          </p>
                          <p className="text-xs italic text-neutral-400 dark:text-neutral-500 mt-0.5">
                            No answer yet
                          </p>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
                {candidate.profile.questions.length > 2 && (
                  <p className="text-xs text-neutral-400 text-center py-1">
                    +{candidate.profile.questions.length - 2} more questions
                  </p>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    );
  }
);

SwipeCard.displayName = "SwipeCard";
