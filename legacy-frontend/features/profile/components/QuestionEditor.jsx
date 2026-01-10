import React, { useState, useRef, useEffect } from "react";
import { Mic, Square, Play, Pause, Trash2, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  QUESTION_POOL,
  MIN_QUESTIONS,
  MAX_QUESTIONS,
  getCategories,
  getQuestionsByCategory,
} from "@/core/constants/questionPool";

export default function QuestionEditor({
  initialQuestions = [],
  onSave,
  showSaveButton = true,
  autoSave = false,
}) {
  const [selectedQuestions, setSelectedQuestions] = useState(
    initialQuestions.length > 0 ? initialQuestions : []
  );
  const [isSelectingQuestions, setIsSelectingQuestions] = useState(
    initialQuestions.length === 0
  );
  const [recordingIndex, setRecordingIndex] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [waveformBars, setWaveformBars] = useState([
    40, 60, 80, 60, 40, 70, 50, 90, 60, 40,
  ]);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const waveformIntervalRef = useRef(null);
  const [playingIndex, setPlayingIndex] = useState(null);
  const audioRefs = useRef({});
  const [audioDurations, setAudioDurations] = useState({});
  const [audioCurrentTimes, setAudioCurrentTimes] = useState({});

  const categories = getCategories();

  const toggleQuestionSelection = (question) => {
    const isSelected = selectedQuestions.some((q) => q.id === question.id);

    if (isSelected) {
      setSelectedQuestions(
        selectedQuestions.filter((q) => q.id !== question.id)
      );
    } else {
      if (selectedQuestions.length >= MAX_QUESTIONS) {
        toast.error(`You can select maximum ${MAX_QUESTIONS} questions`);
        return;
      }
      setSelectedQuestions([
        ...selectedQuestions,
        {
          id: question.id,
          question: question.text,
          answer: "",
          audioUrl: null,
          audioBlob: null,
        },
      ]);
    }
  };

  const confirmQuestionSelection = () => {
    if (selectedQuestions.length < MIN_QUESTIONS) {
      toast.error(`Please select at least ${MIN_QUESTIONS} questions`);
      return;
    }
    setIsSelectingQuestions(false);
  };

  const startRecording = async (index) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        const audioUrl = URL.createObjectURL(audioBlob);

        const newQuestions = [...selectedQuestions];
        newQuestions[index].audioUrl = audioUrl;
        newQuestions[index].audioBlob = audioBlob;
        setSelectedQuestions(newQuestions);

        // Auto-save if enabled
        if (autoSave && onSave) {
          onSave(newQuestions);
        }

        stream.getTracks().forEach((track) => track.stop());

        // Stop waveform animation
        if (waveformIntervalRef.current) {
          clearInterval(waveformIntervalRef.current);
          waveformIntervalRef.current = null;
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingIndex(index);

      // Start waveform animation
      waveformIntervalRef.current = setInterval(() => {
        setWaveformBars((prev) => prev.map(() => Math.random() * 100 + 20));
      }, 150);
    } catch (error) {
      toast.error("Failed to access microphone");
      console.error("Recording error:", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setRecordingIndex(null);

      // Stop waveform animation
      if (waveformIntervalRef.current) {
        clearInterval(waveformIntervalRef.current);
        waveformIntervalRef.current = null;
      }
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (waveformIntervalRef.current) {
        clearInterval(waveformIntervalRef.current);
      }
    };
  }, []);

  // Handle audio play/pause for waveform animation
  const handleAudioPlay = (index) => {
    setPlayingIndex(index);
    // Start waveform animation for playback
    waveformIntervalRef.current = setInterval(() => {
      setWaveformBars((prev) => prev.map(() => Math.random() * 100 + 20));
    }, 150);
  };

  const handleAudioPause = () => {
    setPlayingIndex(null);
    if (waveformIntervalRef.current) {
      clearInterval(waveformIntervalRef.current);
      waveformIntervalRef.current = null;
    }
  };

  const handleAudioEnded = () => {
    setPlayingIndex(null);
    if (waveformIntervalRef.current) {
      clearInterval(waveformIntervalRef.current);
      waveformIntervalRef.current = null;
    }
  };

  // Toggle play/pause
  const togglePlayPause = (index) => {
    const audio = audioRefs.current[index];
    if (!audio) return;

    if (playingIndex === index) {
      audio.pause();
    } else {
      audio.play();
    }
  };

  // Handle time update
  const handleTimeUpdate = (index) => {
    const audio = audioRefs.current[index];
    if (!audio) return;

    setAudioCurrentTimes((prev) => ({
      ...prev,
      [index]: audio.currentTime,
    }));
  };

  // Handle loaded metadata
  const handleLoadedMetadata = (index) => {
    const audio = audioRefs.current[index];
    if (!audio) return;

    setAudioDurations((prev) => ({
      ...prev,
      [index]: audio.duration,
    }));
  };

  // Format time (seconds to MM:SS)
  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const deleteRecording = (index) => {
    const newQuestions = [...selectedQuestions];
    if (newQuestions[index].audioUrl) {
      URL.revokeObjectURL(newQuestions[index].audioUrl);
      newQuestions[index].audioUrl = null;
      newQuestions[index].audioBlob = null;
      setSelectedQuestions(newQuestions);

      // Auto-save if enabled
      if (autoSave && onSave) {
        onSave(newQuestions);
      }
    }
  };

  const handleSave = () => {
    const answeredCount = selectedQuestions.filter(
      (q) => q.audioUrl || q.answer
    ).length;

    if (answeredCount < MIN_QUESTIONS) {
      toast.error(`Please answer at least ${MIN_QUESTIONS} questions`);
      return;
    }

    onSave(selectedQuestions);
  };

  if (isSelectingQuestions) {
    return (
      <div className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            Select {MIN_QUESTIONS} to {MAX_QUESTIONS} questions to answer with
            your voice. This helps others get to know you better!
          </p>
          <p className="text-xs text-blue-600 mt-2">
            Selected: {selectedQuestions.length} / {MAX_QUESTIONS}
          </p>
        </div>

        {categories.map((category) => (
          <div key={category} className="space-y-3">
            <h3 className="font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <span className="w-2 h-2 bg-brand rounded-full"></span>
              {category}
            </h3>
            <div className="space-y-2">
              {getQuestionsByCategory(category).map((question) => {
                const isSelected = selectedQuestions.some(
                  (q) => q.id === question.id
                );
                return (
                  <button
                    key={question.id}
                    type="button"
                    onClick={() => toggleQuestionSelection(question)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      isSelected
                        ? "border-brand bg-brand/5"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm">{question.text}</span>
                      {isSelected && (
                        <Check className="w-5 h-5 text-brand flex-shrink-0" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={confirmQuestionSelection}
          disabled={selectedQuestions.length < MIN_QUESTIONS}
          className="w-full bg-brand hover:bg-brand/90 text-white py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue with {selectedQuestions.length} question
          {selectedQuestions.length !== 1 ? "s" : ""}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">Your Questions</h3>
        <button
          type="button"
          onClick={() => setIsSelectingQuestions(true)}
          className="text-sm text-brand hover:underline"
        >
          Change Questions
        </button>
      </div>

      <div className="space-y-3 sm:space-y-4">
        {selectedQuestions.map((q, index) => (
          <motion.div
            key={q.id || index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-gradient-to-br from-gray-50 to-white dark:from-neutral-800 dark:to-neutral-700 rounded-xl p-4 sm:p-5 border-2 border-gray-200 dark:border-neutral-600 shadow-sm hover:shadow-md transition-shadow"
          >
            {/* Question text - LARGER FONT */}
            <p className="text-base sm:text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3 sm:mb-4 leading-relaxed">
              {q.question}
            </p>

            {/* Voice Recording Section */}
            <div className="flex items-center gap-2 sm:gap-3">
              {!q.audioUrl ? (
                <div className="flex-1">
                  <motion.button
                    type="button"
                    onClick={() =>
                      isRecording && recordingIndex === index
                        ? stopRecording()
                        : startRecording(index)
                    }
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full flex items-center justify-center gap-2 sm:gap-3 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl text-sm sm:text-base font-medium transition-all ${
                      isRecording && recordingIndex === index
                        ? "bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30"
                        : "bg-gradient-to-r from-brand to-brand-600 hover:from-brand-600 hover:to-brand text-white shadow-lg shadow-brand/30"
                    }`}
                  >
                    {isRecording && recordingIndex === index ? (
                      <>
                        <Square className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span>Stop Recording</span>
                      </>
                    ) : (
                      <>
                        <Mic className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span>Record Voice Answer</span>
                      </>
                    )}
                  </motion.button>

                  {/* Animated Waveform - shows when recording */}
                  <AnimatePresence>
                    {isRecording && recordingIndex === index && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-3 sm:mt-4 flex items-center justify-center gap-0.5 sm:gap-1 h-12 sm:h-16 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 sm:px-4"
                      >
                        {waveformBars.map((height, i) => (
                          <motion.div
                            key={i}
                            className="w-1 sm:w-1.5 bg-red-500 rounded-full"
                            animate={{
                              height: `${height}%`,
                            }}
                            transition={{
                              duration: 0.15,
                              ease: "easeInOut",
                            }}
                          />
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex-1"
                >
                  {/* Custom Audio Player with Waveform */}
                  <div className="bg-white dark:bg-neutral-800 rounded-2xl p-4 sm:p-6 border-2 border-neutral-100 dark:border-neutral-700 shadow-sm hover:shadow-md transition-shadow">
                    {/* Audio Player Container */}
                    <div className="flex items-center gap-3 sm:gap-4">
                      {/* Play/Pause Button */}
                      <motion.button
                        type="button"
                        onClick={() => togglePlayPause(index)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-[#B33A2E] to-[#CF5144] flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow"
                      >
                        {playingIndex === index ? (
                          <Pause
                            className="w-5 h-5 sm:w-7 sm:h-7 text-white"
                            fill="white"
                          />
                        ) : (
                          <Play
                            className="w-5 h-5 sm:w-7 sm:h-7 text-white ml-0.5 sm:ml-1"
                            fill="white"
                          />
                        )}
                      </motion.button>

                      {/* Waveform and Time Container */}
                      <div className="flex-1 flex flex-col gap-1.5 sm:gap-2">
                        {/* Waveform Visualization */}
                        <div className="flex items-center justify-center gap-0.5 sm:gap-1 h-12 sm:h-16 bg-gradient-to-r from-neutral-50 to-neutral-100 dark:from-neutral-700 dark:to-neutral-600 rounded-xl px-2 sm:px-4">
                          {waveformBars.map((height, i) => {
                            const isPlaying = playingIndex === index;
                            const progress = audioCurrentTimes[index] || 0;
                            const duration = audioDurations[index] || 1;
                            const barProgress =
                              (i / waveformBars.length) * duration;
                            const isPassed = progress >= barProgress;

                            return (
                              <motion.div
                                key={i}
                                className={`w-1 sm:w-1.5 rounded-full transition-colors duration-300 ${
                                  isPassed
                                    ? "bg-gradient-to-t from-[#B33A2E] to-[#CF5144]"
                                    : "bg-neutral-300 dark:bg-neutral-500"
                                }`}
                                animate={{
                                  height: isPlaying
                                    ? `${height}%`
                                    : `${height * 0.6}%`,
                                }}
                                transition={{
                                  duration: 0.15,
                                  ease: "easeInOut",
                                }}
                              />
                            );
                          })}
                        </div>

                        {/* Time Display */}
                        <div className="flex items-center justify-between text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 px-1">
                          <span className="font-medium">
                            {formatTime(audioCurrentTimes[index] || 0)}
                          </span>
                          <span>{formatTime(audioDurations[index] || 0)}</span>
                        </div>
                      </div>

                      {/* Delete Button */}
                      <motion.button
                        type="button"
                        onClick={() => deleteRecording(index)}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="flex-shrink-0 p-2 sm:p-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                      >
                        <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                      </motion.button>
                    </div>

                    {/* Hidden Audio Element */}
                    <audio
                      ref={(el) => {
                        if (el) audioRefs.current[index] = el;
                      }}
                      src={q.audioUrl}
                      onPlay={() => handleAudioPlay(index)}
                      onPause={handleAudioPause}
                      onEnded={handleAudioEnded}
                      onTimeUpdate={() => handleTimeUpdate(index)}
                      onLoadedMetadata={() => handleLoadedMetadata(index)}
                      className="hidden"
                    />
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {showSaveButton && (
        <button
          type="button"
          onClick={handleSave}
          className="w-full bg-brand hover:bg-brand/90 text-white py-3 px-4 rounded-lg transition-colors"
        >
          Save Questions
        </button>
      )}
    </div>
  );
}
