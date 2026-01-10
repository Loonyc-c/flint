"use client";

import { useState, useMemo, useEffect } from "react";
import { MessageSquare } from "lucide-react";
import { type QuestionAnswer, QUESTION_POOL } from "@/shared-types/types";
import { QuestionsModal } from "./QuestionsModal";
import { RecordingModal } from "./RecordingModal";
import { QuestionSlot } from "./QuestionSlot";
import { CustomAudioPlayer } from "@/components/ui/custom-audio-player";
import { Button } from "@/components/ui/button";

// =============================================================================
// Types
// =============================================================================

export interface QuestionsSectionProps {
  questions: QuestionAnswer[];
  onUpdateQuestions: (questions: QuestionAnswer[]) => void;
  error?: string;
}

// =============================================================================
// Sub-Components
// =============================================================================

const AnsweredQuestionPlayer = ({ qa }: { qa: QuestionAnswer }) => {
  const [url, setUrl] = useState<string | undefined>(
    typeof qa.audioFile === "string" ? qa.audioFile : qa.audioUrl
  );

  const questionText = QUESTION_POOL.find((q) => q.id === qa.questionId)?.text;

  useEffect(() => {
    let newUrl: string | undefined;

    if (qa.audioFile && typeof qa.audioFile !== "string") {
      newUrl = URL.createObjectURL(qa.audioFile);
      setUrl(newUrl);
    } else if (typeof qa.audioFile === "string") {
      setUrl(qa.audioFile);
    } else {
      setUrl(qa.audioUrl);
    }

    return () => {
      if (newUrl) {
        URL.revokeObjectURL(newUrl);
      }
    };
  }, [qa.audioFile, qa.audioUrl]);

  if (!url) return null;

  return (
    <CustomAudioPlayer
      audioUrl={url}
      question={questionText}
      showQuestion={true}
      size="medium"
    />
  );
};

// =============================================================================
// Main Component
// =============================================================================

export const QuestionsSection = ({
  questions,
  onUpdateQuestions,
  error,
}: QuestionsSectionProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [selectingSlotIndex, setSelectingSlotIndex] = useState<number | null>(
    null
  );
  const [recordingSlotIndex, setRecordingSlotIndex] = useState<number | null>(
    null
  );

  // Filter answered questions for View Mode
  const answeredQuestions = useMemo(
    () => questions.filter((q) => q.questionId && (q.audioUrl || q.audioFile)),
    [questions]
  );

  // Ensure we always have 3 slots for Edit Mode
  const normalizedQuestions: QuestionAnswer[] = [0, 1, 2].map(
    (i) =>
      questions[i] || {
        questionId: "",
        audioUrl: "",
        uploadId: "",
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
      uploadId: currentQuestion.uploadId || "",
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
      uploadId: currentQuestion.uploadId || "",
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
      <section className="p-6 bg-white border shadow-md dark:bg-neutral-900 rounded-3xl border-neutral-200 dark:border-neutral-800">
        {/* Legacy Header Style */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
            <MessageSquare className="w-5 h-5 text-brand" />
            Profile Questions
          </h2>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="text-sm font-medium cursor-pointer text-brand hover:underline"
            >
              {answeredQuestions.length > 0
                ? "Edit Questions"
                : "Add Questions"}
            </button>
          )}
          {isEditing && (
            <button
              onClick={() => setIsEditing(false)}
              className="text-sm font-medium cursor-pointer text-neutral-500 hover:underline"
            >
              Done
            </button>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold tracking-widest uppercase text-neutral-400">
                Editing Prompts
              </span>
              <span className="text-xs font-medium text-neutral-400">
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
          </div>
        ) : (
          <div className="space-y-4">
            {answeredQuestions.length > 0 ? (
              <>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  You have answered {answeredQuestions.length} question
                  {answeredQuestions.length !== 1 ? "s" : ""}
                </p>
                <div className="space-y-4">
                  {answeredQuestions.map((qa, index) => (
                    <AnsweredQuestionPlayer key={index} qa={qa} />
                  ))}
                </div>
              </>
            ) : (
              /* Legacy Empty State */
              <div className="py-8 text-center">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                <p className="mb-6 text-gray-500 dark:text-gray-400">
                  No questions answered yet
                </p>
                <Button
                  onClick={() => setIsEditing(true)}
                  className="px-8 py-2 font-bold text-white transition-all shadow-lg bg-brand hover:bg-brand-300 rounded-xl shadow-brand/20"
                >
                  Add Questions
                </Button>
              </div>
            )}
          </div>
        )}

        {error && (
          <p className="px-2 mt-4 text-xs font-medium text-destructive">
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
