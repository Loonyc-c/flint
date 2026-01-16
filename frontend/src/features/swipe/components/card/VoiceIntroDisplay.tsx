'use client'

import { useState, useRef, useEffect } from 'react'
import { Mic } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { VoicePlaybackUI } from '@/features/profile/components/questions/VoicePlaybackUI'

interface VoiceIntroDisplayProps {
  voiceIntroUrl?: string
}

/**
 * Read-only voice intro display for swipe cards.
 * Shows playback UI without recording functionality.
 */
export const VoiceIntroDisplay = ({ voiceIntroUrl }: VoiceIntroDisplayProps) => {
  const t = useTranslations('swipe.card')
  const [isPlayback, setIsPlayback] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    const audio = audioRef.current
    return () => {
      if (audio) {
        audio.pause()
        audio.src = ''
      }
    }
  }, [])

  const togglePlayback = async () => {
    if (!audioRef.current) return
    try {
      if (isPlayback) {
        audioRef.current.pause()
        setIsPlayback(false)
      } else {
        await audioRef.current.play()
        setIsPlayback(true)
      }
    } catch (err) {
      console.error('Playback error:', err)
    }
  }

  const handleDelete = () => {
    // No-op for display mode
  }

  if (!voiceIntroUrl) {
    return (
      <div className="p-4 bg-card border border-border rounded-2xl">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Mic className="w-5 h-5" />
          <span className="text-sm">{t('noVoiceIntro')}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Mic className="w-4 h-4 text-brand" />
        <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">
          {t('voiceIntro')}
        </h3>
      </div>
      <VoicePlaybackUI
        audioURL={voiceIntroUrl}
        audioRef={audioRef}
        isPlayback={isPlayback}
        togglePlayback={togglePlayback}
        handleDelete={handleDelete}
        onEnded={() => setIsPlayback(false)}
      />
    </div>
  )
}

