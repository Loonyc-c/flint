'use client'

import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Play, Pause } from 'lucide-react'

// =============================================================================
// Types
// =============================================================================

interface CustomAudioPlayerProps {
  audioUrl: string
  question?: string
  showQuestion?: boolean
  size?: 'small' | 'medium' | 'large'
}

interface SizeConfig {
  playButton: string
  playIcon: string
  waveformHeight: string
  barWidth: string
  questionText: string
  timeText: string
  padding: string
  gap: string
}

// =============================================================================
// Constants
// =============================================================================

const SIZE_CONFIGS: Record<'small' | 'medium' | 'large', SizeConfig> = {
  small: {
    playButton: 'w-10 h-10',
    playIcon: 'w-4 h-4',
    waveformHeight: 'h-10',
    barWidth: 'w-1',
    questionText: 'text-sm',
    timeText: 'text-xs',
    padding: 'p-3',
    gap: 'gap-2'
  },
  medium: {
    playButton: 'w-16 h-16',
    playIcon: 'w-7 h-7',
    waveformHeight: 'h-16',
    barWidth: 'w-1.5',
    questionText: 'text-lg',
    timeText: 'text-sm',
    padding: 'p-6',
    gap: 'gap-4'
  },
  large: {
    playButton: 'w-20 h-20',
    playIcon: 'w-9 h-9',
    waveformHeight: 'h-20',
    barWidth: 'w-2',
    questionText: 'text-xl',
    timeText: 'text-base',
    padding: 'p-8',
    gap: 'gap-6'
  }
}

const INITIAL_WAVEFORM = [40, 60, 80, 60, 40, 70, 50, 90, 60, 40]

// =============================================================================
// Helpers
// =============================================================================

const formatTime = (seconds: number): string => {
  if (!seconds || isNaN(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// =============================================================================
// Component
// =============================================================================

/**
 * Custom audio player with animated waveform visualization.
 */
export const CustomAudioPlayer = ({
  audioUrl,
  question = '',
  showQuestion = true,
  size = 'medium'
}: CustomAudioPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [waveformBars, setWaveformBars] = useState(INITIAL_WAVEFORM)

  const audioRef = useRef<HTMLAudioElement>(null)
  const waveformIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const config = SIZE_CONFIGS[size]

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (waveformIntervalRef.current) {
        clearInterval(waveformIntervalRef.current)
      }
    }
  }, [])

  const handleAudioPlay = () => {
    setIsPlaying(true)
    waveformIntervalRef.current = setInterval(() => {
      setWaveformBars(prev => prev.map(() => Math.random() * 100 + 20))
    }, 150)
  }

  const handleAudioPause = () => {
    setIsPlaying(false)
    if (waveformIntervalRef.current) {
      clearInterval(waveformIntervalRef.current)
      waveformIntervalRef.current = null
    }
  }

  const handleAudioEnded = () => {
    setIsPlaying(false)
    if (waveformIntervalRef.current) {
      clearInterval(waveformIntervalRef.current)
      waveformIntervalRef.current = null
    }
  }

  const togglePlayPause = () => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
    } else {
      audio.play()
    }
  }

  const handleTimeUpdate = () => {
    const audio = audioRef.current
    if (!audio) return
    setCurrentTime(audio.currentTime)
  }

  const handleLoadedMetadata = () => {
    const audio = audioRef.current
    if (!audio) return
    setDuration(audio.duration)
  }

  return (
    <div
      className={`bg-white rounded-2xl ${config.padding} border-2 border-neutral-100 shadow-sm hover:shadow-md transition-shadow`}
    >
      {showQuestion && question && (
        <h3 className={`${config.questionText} font-semibold text-neutral-800 mb-4`}>{question}</h3>
      )}

      <div className={`flex items-center ${config.gap}`}>
        <motion.button
          type="button"
          onClick={togglePlayPause}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`shrink-0 ${config.playButton} rounded-full bg-linear-to-br from-[#B33A2E] to-[#CF5144] flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow cursor-pointer`}
        >
          {isPlaying ? (
            <Pause className={`${config.playIcon} text-white`} fill="white" />
          ) : (
            <Play className={`${config.playIcon} text-white ml-0.5`} fill="white" />
          )}
        </motion.button>

        <div className="flex-1 flex flex-col gap-2">
          <div
            className={`flex items-center justify-center gap-1 ${config.waveformHeight} bg-linear-to-r from-neutral-50 to-neutral-100 rounded-xl px-4`}
          >
            {waveformBars.map((height, i) => {
              const progress = currentTime || 0
              const audioDuration = duration || 1
              const barProgress = (i / waveformBars.length) * audioDuration
              const isPassed = progress >= barProgress

              return (
                <motion.div
                  key={i}
                  className={`${config.barWidth} rounded-full transition-colors duration-300 ${
                    isPassed ? 'bg-linear-to-t from-[#B33A2E] to-[#CF5144]' : 'bg-neutral-300'
                  }`}
                  animate={{
                    height: isPlaying ? `${height}%` : `${height * 0.6}%`
                  }}
                  transition={{
                    duration: 0.15,
                    ease: 'easeInOut'
                  }}
                />
              )
            })}
          </div>

          <div
            className={`flex items-center justify-between ${config.timeText} text-neutral-500 px-1`}
          >
            <span className="font-medium">{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      </div>

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
  )
}
