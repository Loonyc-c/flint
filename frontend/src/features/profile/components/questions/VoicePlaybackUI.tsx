'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Play, PauseCircle, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { WaveformVisualizer } from './WaveformVisualizer'

interface VoicePlaybackUIProps {
  audioURL: string
  mimeType: string
  audioRef: React.RefObject<HTMLAudioElement | null>
  isPlayback: boolean
  togglePlayback: () => void
  handleDelete: () => void
  onEnded: () => void
}

export const VoicePlaybackUI = ({
  audioURL,
  mimeType,
  audioRef,
  isPlayback,
  togglePlayback,
  handleDelete,
  onEnded
}: VoicePlaybackUIProps) => {
  const [duration, setDuration] = useState<number>(0)
  const [currentTime, setCurrentTime] = useState<number>(0)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    // Force reload when URL changes
    audio.load()
    audio.currentTime = 0

    const handleLoadedMetadata = () => setDuration(audio.duration)
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime)

    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('timeupdate', handleTimeUpdate)

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('timeupdate', handleTimeUpdate)
    }
  }, [audioRef, audioURL])

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-6">
      <audio 
        key={audioURL} 
        ref={audioRef} 
        onEnded={onEnded} 
        onDurationChange={(e) => setDuration(e.currentTarget.duration)}
        onError={(e) => console.error('Audio playback error:', e)}
        preload="auto"
      >
        <source src={audioURL} type={mimeType} />
      </audio>
      
      <div className="p-6 border-2 shadow-sm bg-card rounded-3xl border-border">
        <div className="flex items-center gap-4">
          <motion.button
            onClick={togglePlayback}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="shrink-0 w-16 h-16 rounded-full bg-linear-to-br from-brand to-brand-200 flex items-center justify-center shadow-lg cursor-pointer"
          >
            {isPlayback ? (
              <PauseCircle className="w-8 h-8 text-brand-foreground" />
            ) : (
              <Play className="w-8 h-8 ml-1 text-brand-foreground" fill="currentColor" />
            )}
          </motion.button>

          <div className="flex-1 space-y-2">
             <div className="px-4 bg-muted rounded-2xl">
                <WaveformVisualizer 
                  isActive={isPlayback} 
                  color={isPlayback ? 'bg-brand' : 'bg-muted-foreground/30'} 
                />
             </div>
             <div className="flex justify-between px-1 text-[10px] font-black tracking-widest text-muted-foreground uppercase">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
             </div>
          </div>

          <Button onClick={handleDelete} variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 rounded-xl cursor-pointer">
            <Trash2 className="w-6 h-6" />
          </Button>
        </div>
      </div>
    </div>
  )
}
