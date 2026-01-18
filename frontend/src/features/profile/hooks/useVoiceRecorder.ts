import { useState, useRef, useEffect, useCallback } from "react";

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Detects the best supported MIME type for MediaRecorder.
 * Runs synchronously to avoid race conditions.
 */
const getSupportedMimeType = (): string => {
  const types = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
    "audio/wav",
  ];

  if (typeof MediaRecorder === "undefined") {
    return "audio/webm"; // Fallback for SSR
  }

  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }

  return "audio/webm"; // Last resort fallback
};

// =============================================================================
// Hook
// =============================================================================

export const useVoiceRecorder = (initialAudio?: Blob | string) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState<Blob | string | undefined>(
    initialAudio,
  );
  const [audioURL, setAudioURL] = useState<string | undefined>(
    typeof initialAudio === "string" ? initialAudio : undefined,
  );
  const [recordingTime, setRecordingTime] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null,
  );
  const [mimeType, setMimeType] = useState<string>("audio/webm");

  const audioChunks = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (recordedAudio && typeof recordedAudio !== "string") {
      const url = URL.createObjectURL(recordedAudio);
      setAudioURL(url);
      return () => URL.revokeObjectURL(url);
    } else if (typeof recordedAudio === "string") {
      setAudioURL(recordedAudio);
    }
  }, [recordedAudio]);

  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime((prevTime) => prevTime + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setRecordingTime(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  const startRecording = useCallback(async () => {
    try {
      // Get microphone stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Detect supported MIME type synchronously (no race condition)
      const detectedMimeType = getSupportedMimeType();
      setMimeType(detectedMimeType);

      // Create MediaRecorder with detected MIME type
      const recorder = new MediaRecorder(stream, {
        mimeType: detectedMimeType,
      });

      // Handle data available event
      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunks.current.push(event.data);
        }
      };

      // Handle recording stop event
      recorder.onstop = () => {
        // Validate that we captured audio data
        if (audioChunks.current.length === 0) {
          console.error("[useVoiceRecorder] No audio chunks captured");
          alert(
            "Recording failed: No audio data was captured. Please try again.",
          );
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        // Create blob from chunks
        const audioBlob = new Blob(audioChunks.current, {
          type: recorder.mimeType || detectedMimeType,
        });

        // Validate blob size
        if (audioBlob.size === 0) {
          console.error("[useVoiceRecorder] Empty audio blob created");
          alert("Recording failed: Audio file is empty. Please try again.");
          stream.getTracks().forEach((track) => track.stop());
          audioChunks.current = [];
          return;
        }

        // Success - set the recorded audio
        setRecordedAudio(audioBlob);
        audioChunks.current = [];
        stream.getTracks().forEach((track) => track.stop());
      };

      // Handle recording errors
      recorder.onerror = (event) => {
        console.error("[useVoiceRecorder] MediaRecorder error:", event);
        alert("Recording error occurred. Please try again.");
        stream.getTracks().forEach((track) => track.stop());
        setIsRecording(false);
      };

      // Start recording with 100ms timeslice for reliable data capture
      recorder.start(100);
      setIsRecording(true);
      setMediaRecorder(recorder);
      setRecordedAudio(undefined);
    } catch (err) {
      console.error("[useVoiceRecorder] Error accessing microphone:", err);
      alert(
        "Could not access microphone. Please ensure permissions are granted.",
      );
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  }, [mediaRecorder, isRecording]);

  const resetRecording = useCallback(() => {
    setRecordedAudio(undefined);
    setAudioURL(undefined);
  }, []);

  return {
    isRecording,
    recordedAudio,
    audioURL,
    recordingTime,
    mimeType,
    startRecording,
    stopRecording,
    resetRecording,
  };
};
