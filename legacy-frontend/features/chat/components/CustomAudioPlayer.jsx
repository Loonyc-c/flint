import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Play, Pause, Trash2 } from "lucide-react";

/**
 * Custom Audio Player with Waveform Visualization
 * 
 * @param {string} audioUrl - URL of the audio file
 * @param {string} question - Question text to display (optional)
 * @param {function} onDelete - Callback when delete button is clicked (optional)
 * @param {boolean} showQuestion - Whether to show question text (default: true)
 * @param {boolean} showDelete - Whether to show delete button (default: false)
 * @param {string} size - Size variant: 'small' | 'medium' | 'large' (default: 'medium')
 */
const CustomAudioPlayer = ({
  audioUrl,
  question = "",
  onDelete = null,
  showQuestion = true,
  showDelete = false,
  size = "medium",
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [waveformBars, setWaveformBars] = useState([
    40, 60, 80, 60, 40, 70, 50, 90, 60, 40,
  ]);
  
  const audioRef = useRef(null);
  const waveformIntervalRef = useRef(null);

  // Size configurations
  const sizeConfig = {
    small: {
      playButton: "w-10 h-10",
      playIcon: "w-4 h-4",
      waveformHeight: "h-10",
      barWidth: "w-1",
      questionText: "text-sm",
      timeText: "text-xs",
      padding: "p-3",
      gap: "gap-2",
    },
    medium: {
      playButton: "w-16 h-16",
      playIcon: "w-7 h-7",
      waveformHeight: "h-16",
      barWidth: "w-1.5",
      questionText: "text-lg",
      timeText: "text-sm",
      padding: "p-6",
      gap: "gap-4",
    },
    large: {
      playButton: "w-20 h-20",
      playIcon: "w-9 h-9",
      waveformHeight: "h-20",
      barWidth: "w-2",
      questionText: "text-xl",
      timeText: "text-base",
      padding: "p-8",
      gap: "gap-6",
    },
  };

  const config = sizeConfig[size] || sizeConfig.medium;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (waveformIntervalRef.current) {
        clearInterval(waveformIntervalRef.current);
      }
    };
  }, []);

  // Handle audio play
  const handleAudioPlay = () => {
    setIsPlaying(true);
    // Start waveform animation
    waveformIntervalRef.current = setInterval(() => {
      setWaveformBars((prev) => prev.map(() => Math.random() * 100 + 20));
    }, 150);
  };

  // Handle audio pause
  const handleAudioPause = () => {
    setIsPlaying(false);
    if (waveformIntervalRef.current) {
      clearInterval(waveformIntervalRef.current);
      waveformIntervalRef.current = null;
    }
  };

  // Handle audio ended
  const handleAudioEnded = () => {
    setIsPlaying(false);
    if (waveformIntervalRef.current) {
      clearInterval(waveformIntervalRef.current);
      waveformIntervalRef.current = null;
    }
  };

  // Toggle play/pause
  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
  };

  // Handle time update
  const handleTimeUpdate = () => {
    const audio = audioRef.current;
    if (!audio) return;
    setCurrentTime(audio.currentTime);
  };

  // Handle loaded metadata
  const handleLoadedMetadata = () => {
    const audio = audioRef.current;
    if (!audio) return;
    setDuration(audio.duration);
  };

  // Format time (seconds to MM:SS)
  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div
      className={`bg-white rounded-2xl ${config.padding} border-2 border-neutral-100 shadow-sm hover:shadow-md transition-shadow`}
    >
      {/* Question Text */}
      {showQuestion && question && (
        <h3 className={`${config.questionText} font-semibold text-neutral-800 mb-4`}>
          {question}
        </h3>
      )}

      {/* Audio Player Container */}
      <div className={`flex items-center ${config.gap}`}>
        {/* Play/Pause Button */}
        <motion.button
          type="button"
          onClick={togglePlayPause}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`flex-shrink-0 ${config.playButton} rounded-full bg-gradient-to-br from-[#B33A2E] to-[#CF5144] flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow`}
        >
          {isPlaying ? (
            <Pause className={`${config.playIcon} text-white`} fill="white" />
          ) : (
            <Play className={`${config.playIcon} text-white ml-0.5`} fill="white" />
          )}
        </motion.button>

        {/* Waveform and Time Container */}
        <div className="flex-1 flex flex-col gap-2">
          {/* Waveform Visualization */}
          <div
            className={`flex items-center justify-center gap-1 ${config.waveformHeight} bg-gradient-to-r from-neutral-50 to-neutral-100 rounded-xl px-4`}
          >
            {waveformBars.map((height, i) => {
              const progress = currentTime || 0;
              const audioDuration = duration || 1;
              const barProgress = (i / waveformBars.length) * audioDuration;
              const isPassed = progress >= barProgress;

              return (
                <motion.div
                  key={i}
                  className={`${config.barWidth} rounded-full transition-colors duration-300 ${
                    isPassed
                      ? "bg-gradient-to-t from-[#B33A2E] to-[#CF5144]"
                      : "bg-neutral-300"
                  }`}
                  animate={{
                    height: isPlaying ? `${height}%` : `${height * 0.6}%`,
                  }}
                  transition={{
                    duration: 0.15,
                    ease: "easeInOut",
                  }}
                />
              );
            })}
          </div>

          {/* Time Display */}
          <div className={`flex items-center justify-between ${config.timeText} text-neutral-500 px-1`}>
            <span className="font-medium">{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Delete Button */}
        {showDelete && onDelete && (
          <motion.button
            type="button"
            onClick={onDelete}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="flex-shrink-0 p-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
          >
            <Trash2 className="w-5 h-5" />
          </motion.button>
        )}
      </div>

      {/* Hidden Audio Element */}
      <audio
        ref={audioRef}
        src={audioUrl}
        onPlay={handleAudioPlay}
        onPause={handleAudioPause}
        onEnded={handleAudioEnded}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        className="hidden"
        preload="metadata"
      />
    </div>
  );
};

export default CustomAudioPlayer;

