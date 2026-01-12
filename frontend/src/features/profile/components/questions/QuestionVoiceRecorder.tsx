'use client'

import { useRef, useState } from 'react'
import { Mic, Square, Play, Trash2, CheckCircle, PauseCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { useVoiceRecorder } from '@/features/profile/hooks/useVoiceRecorder'
import { WaveformVisualizer } from './WaveformVisualizer'

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
  const {
    isRecording,
    recordedAudio,
    audioURL,
    recordingTime,
    mimeType,
    startRecording,
    stopRecording,
    resetRecording
  } = useVoiceRecorder(initialAudioFile)

  const [isPlayback, setIsPlayback] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const togglePlayback = async () => {
    if (audioRef.current) {
      try {
        if (isPlayback) {
          audioRef.current.pause()
          setIsPlayback(false)
        } else {
          await audioRef.current.play()
          setIsPlayback(true)
        }
      } catch (err) {
        console.error('Playback failed:', err)
        setIsPlayback(false)
        alert('Could not play audio. The format might be unsupported by your browser.')
      }
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
          <Mic className="h-6 w-6" /> Record Voice Answer
        </Button>
      )}

      {isRecording && (
        <div className="space-y-4">
          <Button 
            onClick={stopRecording} 
            variant="destructive" 
            className="w-full h-14 font-bold rounded-2xl flex items-center justify-center gap-3 shadow-lg shadow-red-500/20 active:scale-95 cursor-pointer"
          >
            <Square className="h-6 w-6" /> Stop Recording
          </Button>
          
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-2 text-sm font-bold text-red-500 uppercase tracking-widest">
              <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              Recording {formatTime(recordingTime)}
            </div>
            
            <div className="w-full bg-red-50 dark:bg-red-900/20 rounded-2xl px-6">
               <WaveformVisualizer isActive={true} color="bg-red-500" />
            </div>
          </div>
        </div>
      )}

      {recordedAudio && audioURL && (
        <div className="space-y-6">
          <audio 
            key={audioURL} 
            ref={audioRef} 
            onEnded={() => setIsPlayback(false)} 
            preload="auto"
          >
            <source src={audioURL} type={mimeType} />
          </audio>
          
          <div className="bg-white dark:bg-neutral-800 rounded-3xl p-6 border-2 border-neutral-100 dark:border-neutral-700 shadow-sm">
            <div className="flex items-center gap-4">
              <motion.button
                onClick={togglePlayback}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="shrink-0 w-16 h-16 rounded-full bg-linear-to-br from-[#B33A2E] to-[#CF5144] flex items-center justify-center shadow-lg cursor-pointer"
              >
                {isPlayback ? (
                  <PauseCircle className="h-8 w-8 text-white" />
                ) : (
                  <Play className="h-8 w-8 text-white ml-1" fill="white" />
                )}
              </motion.button>

              <div className="flex-1 space-y-2">
                 <div className="bg-neutral-50 dark:bg-neutral-900 rounded-2xl px-4">
                    <WaveformVisualizer 
                      isActive={isPlayback} 
                      color={isPlayback ? 'bg-brand' : 'bg-neutral-300 dark:bg-neutral-600'} 
                    />
                 </div>
              </div>

              <Button onClick={handleDelete} variant="ghost" size="icon" className="text-red-500 hover:bg-red-50 rounded-xl cursor-pointer">
                <Trash2 className="h-6 w-6" />
              </Button>
            </div>
          </div>

          <div className="flex gap-3">
            <Button 
              onClick={() => onSave(recordedAudio)} 
              className="flex-1 h-12 bg-brand hover:bg-brand-300 text-white font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer"
            >
              <CheckCircle className="h-5 w-5" /> Done
            </Button>
            <Button 
              onClick={onCancel} 
              variant="outline" 
              className="flex-1 h-12 font-bold rounded-xl cursor-pointer"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default QuestionVoiceRecorder
