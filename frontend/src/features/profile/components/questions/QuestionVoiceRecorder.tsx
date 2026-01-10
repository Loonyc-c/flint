'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Mic, Square, Play, Trash2, CheckCircle, PauseCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { motion, AnimatePresence } from 'framer-motion'

interface QuestionVoiceRecorderProps {
  questionText: string
  initialAudioFile?: Blob | string
  onSave: (audioBlob: Blob | string | undefined) => void
  onCancel: () => void
}

const QuestionVoiceRecorder: React.FC<QuestionVoiceRecorderProps> = ({
  questionText,
  initialAudioFile,
  onSave,
  onCancel
}) => {
  const [isRecording, setIsRecording] = useState(false)
  const [recordedAudio, setRecordedAudio] = useState<Blob | string | undefined>(initialAudioFile)
  const [audioURL, setAudioURL] = useState<string | undefined>(
    typeof initialAudioFile === 'string' ? initialAudioFile : undefined
  )
  const [isPlayback, setIsPlayback] = useState(false)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [mimeType, setMimeType] = useState<string>('audio/webm')
  const audioChunks = useRef<Blob[]>([])
  const audioRef = useRef<HTMLAudioElement>(null)
  const [recordingTime, setRecordingTime] = useState(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const [waveformBars, setWaveformBars] = useState([40, 60, 80, 60, 40, 70, 50, 90, 60, 40])
  const waveformIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Determine supported mime type with codec hints for better browser compatibility
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4;codecs=mp4a',
      'audio/mp4',
      'audio/ogg;codecs=opus',
      'audio/wav'
    ]
    for (const type of types) {
      if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(type)) {
        setMimeType(type)
        break
      }
    }
  }, [])

  useEffect(() => {
    if (recordedAudio && typeof recordedAudio !== 'string') {
      const url = URL.createObjectURL(recordedAudio)
      setAudioURL(url)
      return () => URL.revokeObjectURL(url)
    } else if (typeof recordedAudio === 'string') {
      setAudioURL(recordedAudio)
    }
  }, [recordedAudio])

  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime(prevTime => prevTime + 1)
      }, 1000)
      
      waveformIntervalRef.current = setInterval(() => {
        setWaveformBars(prev => prev.map(() => Math.random() * 100 + 20))
      }, 150)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
      if (waveformIntervalRef.current) clearInterval(waveformIntervalRef.current)
      setRecordingTime(0)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (waveformIntervalRef.current) clearInterval(waveformIntervalRef.current)
    }
  }, [isRecording])

  // Playback waveform animation
  useEffect(() => {
    if (isPlayback) {
      waveformIntervalRef.current = setInterval(() => {
        setWaveformBars(prev => prev.map(() => Math.random() * 100 + 20))
      }, 150)
    } else if (!isRecording) {
      if (waveformIntervalRef.current) clearInterval(waveformIntervalRef.current)
      setWaveformBars([40, 60, 80, 60, 40, 70, 50, 90, 60, 40])
    }
  }, [isPlayback, isRecording])

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream, { mimeType })

      recorder.ondataavailable = event => {
        if (event.data.size > 0) {
          audioChunks.current.push(event.data)
        }
      }

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunks.current, { type: mimeType })
        setRecordedAudio(audioBlob)
        audioChunks.current = []
        stream.getTracks().forEach(track => track.stop())
      }

      recorder.start()
      setIsRecording(true)
      setMediaRecorder(recorder)
      setRecordedAudio(undefined)
    } catch (err) {
      console.error('Error accessing microphone:', err)
      alert('Could not access microphone. Please ensure permissions are granted.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop()
      setIsRecording(false)
    }
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
    setRecordedAudio(undefined)
    setAudioURL(undefined)
    setIsPlayback(false)
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
  }

  const handleSave = () => {
    onSave(recordedAudio)
  }

  return (
    <div className="space-y-6">
      <p className="text-xl font-bold text-neutral-800 dark:text-neutral-200 leading-tight">
        {questionText}
      </p>

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
            
            <div className="flex items-center justify-center gap-1 h-16 w-full bg-red-50 dark:bg-red-900/20 rounded-2xl px-6">
              {waveformBars.map((height, i) => (
                <motion.div
                  key={i}
                  className="w-1.5 bg-red-500 rounded-full"
                  animate={{ height: `${height}%` }}
                  transition={{ duration: 0.15, ease: 'easeInOut' }}
                />
              ))}
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
                <div className="flex items-center justify-center gap-1 h-16 bg-neutral-50 dark:bg-neutral-900 rounded-2xl px-4">
                  {waveformBars.map((height, i) => (
                    <motion.div
                      key={i}
                      className={`w-1.5 rounded-full transition-colors ${
                        isPlayback ? 'bg-brand' : 'bg-neutral-300 dark:bg-neutral-600'
                      }`}
                      animate={{ height: isPlayback ? `${height}%` : `${height * 0.6}%` }}
                      transition={{ duration: 0.15, ease: 'easeInOut' }}
                    />
                  ))}
                </div>
              </div>

              <Button onClick={handleDelete} variant="ghost" size="icon" className="text-red-500 hover:bg-red-50 rounded-xl cursor-pointer">
                <Trash2 className="h-6 w-6" />
              </Button>
            </div>
          </div>

          <div className="flex gap-3">
            <Button 
              onClick={handleSave} 
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