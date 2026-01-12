'use client'

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
  return (
    <div className="space-y-6">
      <audio 
        key={audioURL} 
        ref={audioRef} 
        onEnded={onEnded} 
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
          </div>

          <Button onClick={handleDelete} variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 rounded-xl cursor-pointer">
            <Trash2 className="w-6 h-6" />
          </Button>
        </div>
      </div>
    </div>
  )
}
