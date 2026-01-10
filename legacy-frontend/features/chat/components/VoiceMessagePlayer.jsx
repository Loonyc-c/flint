import React, { useState, useRef, useEffect, useCallback } from "react";
import { Play, Pause } from "lucide-react";
import { motion } from "framer-motion";

const VoiceMessagePlayer = React.memo(
  ({ voiceUrl, duration, isOwn = false }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [audioDuration, setAudioDuration] = useState(duration || 0);
    const audioRef = useRef(null);

    useEffect(() => {
      const audio = audioRef.current;
      if (!audio) return;

      const handleTimeUpdate = () => {
        setCurrentTime(audio.currentTime);
      };

      const handleLoadedMetadata = () => {
        setAudioDuration(audio.duration);
      };

      const handleEnded = () => {
        setIsPlaying(false);
        setCurrentTime(0);
      };

      audio.addEventListener("timeupdate", handleTimeUpdate);
      audio.addEventListener("loadedmetadata", handleLoadedMetadata);
      audio.addEventListener("ended", handleEnded);

      return () => {
        audio.removeEventListener("timeupdate", handleTimeUpdate);
        audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
        audio.removeEventListener("ended", handleEnded);
      };
    }, []);

    const togglePlay = useCallback(() => {
      const audio = audioRef.current;
      if (!audio) return;

      if (isPlaying) {
        audio.pause();
      } else {
        audio.play();
      }
      setIsPlaying(!isPlaying);
    }, [isPlaying]);

    const formatTime = (seconds) => {
      if (!seconds || isNaN(seconds)) return "0:00";
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    const progress =
      audioDuration > 0 ? (currentTime / audioDuration) * 100 : 0;

    return (
      <div
        className={`flex items-center gap-3 p-3 rounded-2xl max-w-xs shadow-lg ${
          isOwn
            ? "bg-gradient-to-r from-[#B33A2E] to-[#CF5144] text-white shadow-[#D9776D]/50"
            : "bg-gray-100 text-gray-800 shadow-gray-200"
        }`}
      >
        <button
          onClick={togglePlay}
          className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
            isOwn
              ? "bg-white/20 hover:bg-white/30"
              : "bg-white hover:bg-gray-50"
          }`}
        >
          {isPlaying ? (
            <Pause
              className={`w-5 h-5 ${isOwn ? "text-white" : "text-[#B33A2E]"}`}
              fill="currentColor"
            />
          ) : (
            <Play
              className={`w-5 h-5 ${isOwn ? "text-white" : "text-[#B33A2E]"}`}
              fill="currentColor"
            />
          )}
        </button>

        <div className="flex-1 min-w-0">
          {/* Waveform/Progress bar */}
          <div className="relative h-8 flex items-center">
            <div
              className={`absolute inset-0 rounded-full ${
                isOwn ? "bg-white/20" : "bg-gray-200"
              }`}
            />
            <motion.div
              className={`absolute inset-y-0 left-0 rounded-full ${
                isOwn ? "bg-white/40" : "bg-[#D9776D]/40"
              }`}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.1 }}
            />

            {/* Waveform bars */}
            <div className="relative w-full flex items-center justify-around px-2 gap-0.5">
              {Array.from({ length: 30 }).map((_, i) => {
                const height = Math.random() * 60 + 40;
                const isPassed = (i / 30) * 100 < progress;
                return (
                  <div
                    key={i}
                    className={`w-0.5 rounded-full transition-all ${
                      isOwn
                        ? isPassed
                          ? "bg-white"
                          : "bg-white/40"
                        : isPassed
                        ? "bg-[#B33A2E]"
                        : "bg-gray-400"
                    }`}
                    style={{ height: `${height}%` }}
                  />
                );
              })}
            </div>
          </div>

          {/* Time */}
          <div className="flex justify-between items-center mt-1 px-1">
            <span
              className={`text-xs font-medium ${
                isOwn ? "text-white/80" : "text-gray-600"
              }`}
            >
              {formatTime(currentTime)}
            </span>
            <span
              className={`text-xs ${isOwn ? "text-white/60" : "text-gray-500"}`}
            >
              {formatTime(audioDuration)}
            </span>
          </div>
        </div>

        <audio ref={audioRef} src={voiceUrl} preload="metadata" />
      </div>
    );
  }
);

VoiceMessagePlayer.displayName = "VoiceMessagePlayer";

export default VoiceMessagePlayer;
