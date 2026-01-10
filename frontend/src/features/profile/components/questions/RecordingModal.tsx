"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import QuestionVoiceRecorder from "./QuestionVoiceRecorder";
import { QUESTION_POOL, type QuestionAnswer } from "@/shared-types/types";

export interface RecordingModalProps {
  isOpen: boolean;
  question: QuestionAnswer;
  questionIndex: number;
  onClose: () => void;
  onSave: (audioFile: Blob | string | undefined) => void;
}

export const RecordingModal = ({
  isOpen,
  question,
  questionIndex,
  onClose,
  onSave,
}: RecordingModalProps) => {
  const selectedQuestion = QUESTION_POOL.find(
    (q) => q.id === question.questionId
  );

  if (!selectedQuestion) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", damping: 25 }}
            className="relative w-full max-w-md p-6 bg-white shadow-2xl dark:bg-neutral-900 rounded-3xl"
          >
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <div className="mb-2 text-xs font-bold text-brand">
                  QUESTION {questionIndex + 1}
                </div>
                <h3 className="text-lg font-bold text-neutral-800 dark:text-neutral-200">
                  {selectedQuestion.text}
                </h3>
              </div>
              <button
                onClick={onClose}
                className="flex items-center justify-center ml-2 transition-colors rounded-full w-9 h-9 hover:bg-neutral-100 dark:hover:bg-neutral-800 shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <QuestionVoiceRecorder
              questionText={selectedQuestion.text}
              initialAudioFile={question.audioFile || question.audioUrl}
              onSave={(audioFile) => {
                onSave(audioFile);
                onClose();
              }}
              onCancel={onClose}
            />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
