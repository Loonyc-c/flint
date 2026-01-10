import React, { useState, useRef, useEffect } from "react";
import { Mic, Square, Send, X, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { axiosInstance } from "@/core/lib/axios";
import toast from "react-hot-toast";

const VoiceRecorder = ({ onSend, onCancel }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [waveform, setWaveform] = useState(Array(20).fill(0));

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
      }
    };
  }, [isRecording]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setAudioBlob(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

      // Animate waveform
      animateWaveform();
    } catch (error) {
      console.error("Error accessing microphone:", error);
      toast.error("Could not access microphone");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    }
  };

  const animateWaveform = () => {
    setWaveform((prev) =>
      prev.map(() => Math.random() * 100)
    );
    animationRef.current = requestAnimationFrame(animateWaveform);
  };

  const handleSend = async () => {
    if (!audioBlob) return;

    setIsUploading(true);

    try {
      // Convert blob to base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64Audio = reader.result;

        // Upload to server
        const response = await axiosInstance.post("/profile/upload-voice-message", {
          voiceData: base64Audio,
        });

        onSend({
          voiceUrl: response.data.voiceUrl,
          voiceDuration: recordingTime,
        });

        // Reset
        setAudioBlob(null);
        setRecordingTime(0);
      };
    } catch (error) {
      console.error("Error uploading voice message:", error);
      toast.error("Failed to upload voice message");
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    setAudioBlob(null);
    setRecordingTime(0);
    if (onCancel) onCancel();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="bg-white border-t border-gray-200 p-4">
      <AnimatePresence mode="wait">
        {!isRecording && !audioBlob && (
          <motion.button
            key="start"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            onClick={startRecording}
            className="w-full py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full font-medium flex items-center justify-center gap-2 hover:shadow-lg transition-all"
          >
            <Mic className="w-5 h-5" />
            Hold to Record Voice Message
          </motion.button>
        )}

        {isRecording && (
          <motion.div
            key="recording"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                <span className="text-lg font-mono font-medium text-gray-900">
                  {formatTime(recordingTime)}
                </span>
              </div>
              <button
                onClick={stopRecording}
                className="p-3 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
              >
                <Square className="w-5 h-5" fill="white" />
              </button>
            </div>

            {/* Waveform visualization */}
            <div className="flex items-center justify-center gap-1 h-16">
              {waveform.map((height, index) => (
                <motion.div
                  key={index}
                  className="w-1 bg-gradient-to-t from-rose-500 to-pink-500 rounded-full"
                  animate={{ height: `${height}%` }}
                  transition={{ duration: 0.1 }}
                />
              ))}
            </div>
          </motion.div>
        )}

        {audioBlob && !isRecording && (
          <motion.div
            key="preview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between bg-gradient-to-r from-rose-50 to-pink-50 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-pink-500 rounded-full flex items-center justify-center">
                  <Mic className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Voice Message
                  </p>
                  <p className="text-xs text-gray-600">
                    {formatTime(recordingTime)}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCancel}
                disabled={isUploading}
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-full font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <X className="w-5 h-5" />
                Cancel
              </button>
              <button
                onClick={handleSend}
                disabled={isUploading}
                className="flex-1 py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full font-medium hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Send
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VoiceRecorder;

