"use client";

import React, { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence, useAnimation, useMotionValue } from "framer-motion";
import { Heart, X, MapPin, Volume2 } from "lucide-react";
import { UserProfile, InteractionType } from "@shared/types";
import { CustomAudioPlayer } from "@/components/ui/custom-audio-player";

interface SwipeCardProps {
  candidate: UserProfile;
  onSwipe: (targetId: string, type: InteractionType) => Promise<any>;
}

export const SwipeCard: React.FC<SwipeCardProps> = ({ candidate, onSwipe }) => {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [stampType, setStampType] = useState<"SMASH" | "PASS" | null>(null);
  const controls = useAnimation();
  const opacity = useMotionValue(1);

  const photos = useMemo(
    () => candidate.photos || [],
    [candidate.photos]
  );

  const nextPhoto = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentPhotoIndex((prev) => (prev + 1) % photos.length);
  }, [photos.length]);

  const prevPhoto = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
  }, [photos.length]);

  const handleAction = async (type: InteractionType) => {
    setStampType(type === InteractionType.LIKE ? "SMASH" : "PASS");
    
    await controls.start({
      x: type === InteractionType.LIKE ? 200 : -200,
      opacity: 0,
      transition: { duration: 0.3 }
    });

    await onSwipe(candidate.id, type);
  };

  return (
    <motion.div
      animate={controls}
      style={{ opacity }}
      className="relative w-full max-w-md mx-auto bg-white dark:bg-neutral-800 rounded-3xl shadow-2xl overflow-hidden h-[650px] flex flex-col"
    >
      {/* Photo Carousel */}
      <div className="relative h-[400px] bg-neutral-200 dark:bg-neutral-700">
        {photos.length > 0 ? (
          <img
            src={photos[currentPhotoIndex]}
            alt={candidate.nickName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-neutral-300 dark:bg-neutral-600">
            <span className="text-neutral-500">No Photo</span>
          </div>
        )}

        {/* Photo Navigation */}
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
            <div className="absolute inset-0 flex">
              <div className="w-1/2 h-full cursor-pointer" onClick={prevPhoto} />
              <div className="w-1/2 h-full cursor-pointer" onClick={nextPhoto} />
            </div>
          </>
        )}

        {/* Stamp Overlay */}
        <AnimatePresence>
          {stampType && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5, rotate: -20 }}
              animate={{ opacity: 1, scale: 1.2, rotate: stampType === "PASS" ? -15 : 15 }}
              className={`absolute inset-0 z-50 flex items-center justify-center pointer-events-none`}
            >
              <div className={`border-[10px] rounded-3xl px-8 py-4 ${
                stampType === "SMASH" ? "border-green-500 text-green-500" : "border-red-500 text-red-500"
              }`}>
                <span className="text-6xl font-black">{stampType}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Info Section */}
      <div className="p-6 flex-1 overflow-y-auto">
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {candidate.firstName} {candidate.lastName}
            {candidate.age && <span className="text-gray-600 font-normal">, {candidate.age}</span>}
          </h2>
          {candidate.nickName && (
            <p className="text-sm text-gray-500">@{candidate.nickName}</p>
          )}
        </div>

        {candidate.bio && (
          <p className="text-gray-700 dark:text-gray-300 text-sm mb-4">
            {candidate.bio}
          </p>
        )}

        {/* Voice Intro */}
        {candidate.voiceIntro && (
          <div className="mb-4">
            <CustomAudioPlayer
              audioUrl={candidate.voiceIntro}
              question="Voice Intro"
              size="small"
            />
          </div>
        )}

        {/* Q&A */}
        {candidate.questions && candidate.questions.length > 0 && (
          <div className="space-y-3">
            {candidate.questions.map((q, idx) => (
              <CustomAudioPlayer
                key={idx}
                audioUrl={q.audioUrl}
                question={`Question ${idx + 1}`}
                size="small"
              />
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-6 border-t border-neutral-100 dark:border-neutral-700 flex justify-center gap-8">
        <button
          onClick={() => handleAction(InteractionType.DISLIKE)}
          className="w-16 h-16 rounded-full bg-white dark:bg-neutral-700 shadow-lg flex items-center justify-center text-gray-600 hover:scale-110 transition-transform"
        >
          <X className="w-8 h-8" />
        </button>
        <button
          onClick={() => handleAction(InteractionType.LIKE)}
          className="w-16 h-16 rounded-full bg-gradient-to-br from-[#B33A2E] to-[#CF5144] shadow-lg flex items-center justify-center text-white hover:scale-110 transition-transform"
        >
          <Heart className="w-8 h-8 fill-white" />
        </button>
      </div>
    </motion.div>
  );
};
