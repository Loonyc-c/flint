'use client'

import { useState, useRef, useEffect } from 'react'
import { Mic } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from 'react-toastify'
import { uploadAudioToCloudinary } from '@/lib/cloudinary'
import { VoiceIntroModal } from './VoiceIntroModal'
import { VoicePlaybackUI } from '../questions/VoicePlaybackUI'

interface VoiceIntroWidgetProps {
  initialVoiceIntro?: Blob | string
  onVoiceChange: (audioBlob: Blob | string | undefined) => void
}

/**
 * Widget for recording, previewing, and saving voice introductions.
 */
export const VoiceIntroWidget = ({ initialVoiceIntro, onVoiceChange }: VoiceIntroWidgetProps) => {
  const t = useTranslations('profile.voice')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [currentVoiceIntro, setCurrentVoiceIntro] = useState<Blob | string | undefined>(initialVoiceIntro)
  const [audioURL, setAudioURL] = useState<string | undefined>(
    typeof initialVoiceIntro === 'string' ? initialVoiceIntro : undefined
  )
  const [isPlayback, setIsPlayback] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    if (currentVoiceIntro instanceof Blob) {
      const url = URL.createObjectURL(currentVoiceIntro)
      setAudioURL(url)
      return () => URL.revokeObjectURL(url)
    } else if (typeof currentVoiceIntro === 'string') {
      setAudioURL(currentVoiceIntro)
    } else {
      setAudioURL(undefined)
    }
  }, [currentVoiceIntro])

  const handleSave = (audioFile: Blob | string | undefined) => {
    setCurrentVoiceIntro(audioFile);
    onVoiceChange(audioFile);
    toast.success(t('uploadSuccess')); // Note: It's saving locally until form submit
  };

  const handleDelete = () => {
    setCurrentVoiceIntro(undefined)
    onVoiceChange(undefined)
    setIsPlayback(false)
  }

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

  return (
    <section className="space-y-4">
      <div className="relative flex items-center justify-between p-6 shadow-xl bg-card rounded-3xl group overflow-hidden">
        <div className="absolute inset-0 transition-opacity opacity-0 bg-linear-to-r from-brand/20 to-transparent group-hover:opacity-100" />
        <div className="relative z-10 flex items-center gap-4">
          <div className="flex items-center justify-center w-12 h-12 shadow-lg rounded-2xl bg-brand text-brand-foreground shadow-brand/40">
            <Mic className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-black tracking-wide uppercase text-foreground">{t('title')}</h3>
            <p className="text-xs text-muted-foreground">{t('subtitle')}</p>
          </div>
        </div>
        {!currentVoiceIntro && (
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            disabled={isUploading}
            className="relative z-10 px-6 py-2 text-xs font-black transition-all rounded-full cursor-pointer bg-brand text-brand-foreground active:scale-95 disabled:opacity-50"
          >
            {isUploading ? t('uploading') : t('record')}
          </button>
        )}
      </div>

      {currentVoiceIntro && audioURL && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
          <VoicePlaybackUI
            audioURL={audioURL}
            audioRef={audioRef}
            isPlayback={isPlayback}
            togglePlayback={togglePlayback}
            handleDelete={handleDelete}
            onEnded={() => setIsPlayback(false)}
          />
        </div>
      )}

      <VoiceIntroModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        initialAudio={currentVoiceIntro}
      />
    </section>
  )
}