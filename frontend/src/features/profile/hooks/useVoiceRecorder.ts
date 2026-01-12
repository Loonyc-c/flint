import { useState, useRef, useEffect, useCallback } from 'react'

export const useVoiceRecorder = (initialAudio?: Blob | string) => {
  const [isRecording, setIsRecording] = useState(false)
  const [recordedAudio, setRecordedAudio] = useState<Blob | string | undefined>(initialAudio)
  const [audioURL, setAudioURL] = useState<string | undefined>(
    typeof initialAudio === 'string' ? initialAudio : undefined
  )
  const [recordingTime, setRecordingTime] = useState(0)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [mimeType, setMimeType] = useState<string>('audio/webm')
  
  const audioChunks = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)

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
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
      setRecordingTime(0)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isRecording])

  const startRecording = useCallback(async () => {
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
  }, [mimeType])

  const stopRecording = useCallback(() => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop()
      setIsRecording(false)
    }
  }, [mediaRecorder, isRecording])

  const resetRecording = useCallback(() => {
    setRecordedAudio(undefined)
    setAudioURL(undefined)
  }, [])

  return {
    isRecording,
    recordedAudio,
    audioURL,
    recordingTime,
    mimeType,
    startRecording,
    stopRecording,
    resetRecording
  }
}
