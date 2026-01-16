'use client'

import { useRef, useState } from 'react'
import { Mic, Square, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useVoiceRecorder } from '@/features/profile/hooks/useVoiceRecorder'
import { WaveformVisualizer } from './WaveformVisualizer'
import { useTranslations } from 'next-intl'
import { VoicePlaybackUI } from './VoicePlaybackUI'

interface QuestionVoiceRecorderProps {
  initialAudioFile?: Blob | string
  onSave: (audioBlob: Blob | string | undefined) => void
  onCancel: () => void
}

const QuestionVoiceRecorder = ({
  initialAudioFile,
  onSave,
  onCancel
}: QuestionVoiceRecorderProps) => {
  const t = useTranslations('profile.questions.recorder')
  const {
    isRecording,
    recordedAudio,
    audioURL,
    recordingTime,
    startRecording,
    stopRecording,
    resetRecording
  } = useVoiceRecorder(initialAudioFile)
  const [isPlayback, setIsPlayback] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60)
    const sec = seconds % 60
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
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
    } catch (_err) {
      alert(t('playbackError'))
    }
  }

  const handleDelete = () => {
    resetRecording()
    setIsPlayback(false)
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
  }

  return (
    <div className="space-y-6">
      {!recordedAudio && !isRecording && (
        <Button
          onClick={startRecording}
          className="w-full h-14 bg-brand hover:bg-brand-300 text-white font-bold rounded-2xl flex items-center justify-center gap-3 shadow-lg shadow-brand/20 transition-all active:scale-95 cursor-pointer"
        >
          <Mic className="h-6 w-6" /> {t('recordButton')}
        </Button>
      )}

      {isRecording && (
        <div className="space-y-4">
          <Button
            onClick={stopRecording}
            variant="destructive"
            className="w-full h-14 font-bold rounded-2xl flex items-center justify-center gap-3 shadow-lg shadow-red-500/20 active:scale-95 cursor-pointer"
          >
            <Square className="h-6 w-6" /> {t('stopButton')}
          </Button>
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-2 text-sm font-bold text-red-500 uppercase tracking-widest">
              <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              {t('recordingStatus', { time: formatTime(recordingTime) })}
            </div>
            <div className="w-full bg-red-50 dark:bg-red-900/20 rounded-2xl px-6">
              <WaveformVisualizer isActive={true} color="bg-red-500" />
            </div>
          </div>
        </div>
      )}

      {recordedAudio && audioURL && (
        <div className="space-y-6">
          <VoicePlaybackUI
            audioURL={audioURL}
            audioRef={audioRef}
            isPlayback={isPlayback}
            togglePlayback={togglePlayback}
            handleDelete={handleDelete}
            onEnded={() => setIsPlayback(false)}
          />
          <div className="flex gap-3">
            <Button
              onClick={() => onSave(recordedAudio)}
              className="flex-1 h-12 bg-brand hover:bg-brand-300 text-white font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer"
            >
              <CheckCircle className="h-5 w-5" /> {t('done')}
            </Button>
            <Button
              onClick={onCancel}
              variant="outline"
              className="flex-1 h-12 font-bold rounded-xl cursor-pointer"
            >
              {t('cancel')}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default QuestionVoiceRecorder
