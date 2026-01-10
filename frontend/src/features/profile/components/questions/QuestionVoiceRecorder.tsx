'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Mic, StopCircle, Play, Trash2, CheckCircle, PauseCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

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
  const audioChunks = useRef<Blob[]>([])
  const audioRef = useRef<HTMLAudioElement>(null)
  const [recordingTime, setRecordingTime] = useState(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (recordedAudio && typeof recordedAudio !== 'string') {
      const url = URL.createObjectURL(recordedAudio)
      setAudioURL(url)
    } else if (typeof recordedAudio === 'string') {
      setAudioURL(recordedAudio) // Assume it's already a URL if a string
    }
    return () => {
      if (audioURL && typeof recordedAudio !== 'string') {
        URL.revokeObjectURL(audioURL)
      }
    }
  }, [recordedAudio, audioURL])

  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime(prevTime => prevTime + 1)
      }, 1000)
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      setRecordingTime(0)
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [isRecording])

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)

      recorder.ondataavailable = event => {
        audioChunks.current.push(event.data)
      }

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' })
        setRecordedAudio(audioBlob)
        audioChunks.current = []
        stream.getTracks().forEach(track => track.stop()) // Stop microphone access
      }

      recorder.start()
      setIsRecording(true)
      setMediaRecorder(recorder)
      setRecordedAudio(undefined) // Clear previous recording
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

  const togglePlayback = () => {
    if (audioRef.current) {
      if (isPlayback) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
      setIsPlayback(!isPlayback)
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
      <p className="text-lg font-semibold text-neutral-800 dark:text-neutral-200">{questionText}</p>

      {!recordedAudio && !isRecording && (
        <Button onClick={startRecording} className="w-full flex items-center gap-2">
          <Mic className="h-5 w-5" /> Start Recording
        </Button>
      )}

      {isRecording && (
        <div className="flex flex-col items-center gap-4">
          <Button onClick={stopRecording} variant="destructive" className="w-full flex items-center gap-2">
            <StopCircle className="h-5 w-5" /> Stop Recording
          </Button>
          <div className="text-sm font-medium text-neutral-500 flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-red-500 animate-pulse" />
            {formatTime(recordingTime)}
          </div>
        </div>
      )}

      {recordedAudio && audioURL && (
        <div className="space-y-4">
          <audio ref={audioRef} src={audioURL} onEnded={() => setIsPlayback(false)} />
          <div className="flex items-center justify-between gap-4">
            <Button onClick={togglePlayback} variant="secondary" className="flex-grow flex items-center gap-2">
              {isPlayback ? <PauseCircle className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              {isPlayback ? 'Pause Playback' : 'Play Recording'}
            </Button>
            <Button onClick={handleDelete} variant="ghost" size="icon" className="text-red-500">
              <Trash2 className="h-5 w-5" />
            </Button>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave} className="flex-grow flex items-center gap-2">
              <CheckCircle className="h-5 w-5" /> Done
            </Button>
            <Button onClick={onCancel} variant="outline" className="flex-grow">
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default QuestionVoiceRecorder