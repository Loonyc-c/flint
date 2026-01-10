"use client";

import { useState } from "react";
import { MessageSquareQuote } from "lucide-react";
import { type QuestionAnswer } from "@/shared-types/types";
import { QuestionsModal } from "./QuestionsModal";
import { RecordingModal } from "./RecordingModal";
import { QuestionSlot } from "./QuestionSlot";

// =============================================================================
// Types
// =============================================================================

export interface QuestionsSectionProps {
  questions: QuestionAnswer[];
  onUpdateQuestions: (questions: QuestionAnswer[]) => void;
  error?: string;
}

// =============================================================================
// Main Component
// =============================================================================

export const QuestionsSection = ({
  questions,
  onUpdateQuestions,
  error,
}: QuestionsSectionProps) => {
  const [selectingSlotIndex, setSelectingSlotIndex] = useState<number | null>(
    null
  );
  const [recordingSlotIndex, setRecordingSlotIndex] = useState<number | null>(
    null
  );

  // Ensure we always have 3 slots
  const normalizedQuestions: QuestionAnswer[] = [0, 1, 2].map(
    (i) =>
      questions[i] || {
        questionId: "",
        audioUrl: "",
        audioFile: undefined,
      }
  );

  const handleQuestionSelect = (questionId: string) => {
    if (selectingSlotIndex === null) return;

    // Check for duplicates
    const isDuplicate = normalizedQuestions.some(
      (q, idx) => idx !== selectingSlotIndex && q.questionId === questionId
    );

    if (isDuplicate) {
      alert("This question is already selected in another slot.");
      return;
    }

    // Update the question
    const updated = [...normalizedQuestions];
    const currentQuestion = updated[selectingSlotIndex];

    if (!currentQuestion) return;

    updated[selectingSlotIndex] = {
      questionId,
      audioUrl: currentQuestion.audioUrl || "",
      audioFile: currentQuestion.audioFile,
    };

    onUpdateQuestions(updated);
    setSelectingSlotIndex(null);
  };

  const handleSaveRecording = (audioFile: Blob | string | undefined) => {
    if (recordingSlotIndex === null) return;

    const updated = [...normalizedQuestions];
    const currentQuestion = updated[recordingSlotIndex];

    if (!currentQuestion) return;

    updated[recordingSlotIndex] = {
      questionId: currentQuestion.questionId,
      audioUrl: currentQuestion.audioUrl || "",
      audioFile,
    };

    onUpdateQuestions(updated);
    setRecordingSlotIndex(null);
  };

  const selectedQuestionIds = normalizedQuestions
    .map((q) => q.questionId)
    .filter(Boolean);

  return (
    <>
      <section className="p-6 bg-white border shadow-sm dark:bg-neutral-900 rounded-3xl border-neutral-100 dark:border-neutral-800">
        <div className="flex items-center gap-2 mb-6">
          <MessageSquareQuote className="w-4 h-4 text-brand" />
          <h2 className="text-sm font-bold tracking-widest uppercase text-neutral-500">
            Q&A Prompts
          </h2>
          <span className="ml-auto text-xs font-medium text-neutral-400">
            {selectedQuestionIds.length}/3 selected
          </span>
        </div>

        <div className="space-y-3">
          {normalizedQuestions.map((qa, index) => (
            <QuestionSlot
              key={index}
              index={index}
              qa={qa}
              onSelect={() => setSelectingSlotIndex(index)}
              onRecord={() => setRecordingSlotIndex(index)}
            />
          ))}
        </div>

        {error && (
          <p className="px-2 mt-3 text-xs font-medium text-destructive">
            {error}
          </p>
        )}
      </section>

      {/* Question Selection Modal */}
      <QuestionsModal
        isOpen={selectingSlotIndex !== null}
        slotIndex={selectingSlotIndex ?? 0}
        onClose={() => setSelectingSlotIndex(null)}
        onSelect={handleQuestionSelect}
        selectedQuestionIds={selectedQuestionIds}
      />

      {/* Recording Modal */}
      {recordingSlotIndex !== null &&
        normalizedQuestions[recordingSlotIndex] && (
          <RecordingModal
            isOpen={true}
            question={normalizedQuestions[recordingSlotIndex]}
            questionIndex={recordingSlotIndex}
            onClose={() => setRecordingSlotIndex(null)}
            onSave={handleSaveRecording}
          />
        )}
    </>
  );
};