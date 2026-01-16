"use client";

import { useState, useMemo } from "react";
import { MessageSquare } from "lucide-react";
import { QuestionsModal } from "./QuestionsModal";
import { RecordingModal } from "./RecordingModal";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { AnsweredQuestionPlayer } from "./AnsweredQuestionPlayer";
import { QuestionEditSection } from "./QuestionEditSection";

// Extend the strict DTO type to include the file blob for the form state
// audioUrl and uploadId are optional during form state (local recordings)
export interface QuestionAnswerFormState {
  questionId: string;
  audioUrl?: string;
  uploadId?: string;
  audioFile?: Blob | string;
}

export interface QuestionsSectionProps {
  questions: QuestionAnswerFormState[];
  onUpdateQuestions: (questions: QuestionAnswerFormState[]) => void;
  error?: string;
}

export const QuestionsSection = ({
  questions,
  onUpdateQuestions,
  error,
}: QuestionsSectionProps) => {
  const t = useTranslations("profile.questions");
  const [isEditing, setIsEditing] = useState(false);
  const [selectingSlotIndex, setSelectingSlotIndex] = useState<number | null>(null);
  const [recordingSlotIndex, setRecordingSlotIndex] = useState<number | null>(null);

  const answeredQuestions = useMemo(
    () => questions.filter((q) => q.questionId && (q.audioUrl || q.audioFile)),
    [questions]
  );

  const normalizedQuestions: QuestionAnswerFormState[] = [0, 1, 2].map(
    (i) => {
      // Preserve all properties including audioFile Blob reference
      if (questions[i]) {
        return { ...questions[i] }
      }
      return {
        questionId: "",
        audioUrl: "",
        uploadId: "",
        audioFile: undefined,
      }
    }
  );

  const handleQuestionSelect = (questionId: string) => {
    if (selectingSlotIndex === null) return;
    if (normalizedQuestions.some((q, idx) => idx !== selectingSlotIndex && q.questionId === questionId)) {
      alert(t("duplicateError"));
      return;
    }

    const updated = [...normalizedQuestions];
    const currentSlot = updated[selectingSlotIndex];
    if (!currentSlot) return;

    updated[selectingSlotIndex] = { ...currentSlot, questionId };
    onUpdateQuestions(updated);
    setSelectingSlotIndex(null);
  };

  const handleSaveRecording = (audioFile: Blob | string | undefined) => {
    if (recordingSlotIndex === null) return;
    const updated = [...normalizedQuestions];
    const currentSlot = updated[recordingSlotIndex];
    if (!currentSlot) return;

    updated[recordingSlotIndex] = { ...currentSlot, audioFile };
    onUpdateQuestions(updated);
    setRecordingSlotIndex(null);
  };

  const selectedCount = normalizedQuestions.filter((q) => q.questionId).length;

  return (
    <>
      <section className="p-6 border shadow-md bg-card rounded-3xl border-border">
        <div className="flex items-center justify-between mb-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <MessageSquare className="w-5 h-5 text-brand" />
            {t("title")}
          </h2>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="text-sm font-medium cursor-pointer text-brand hover:underline"
          >
            {isEditing ? t("done") : answeredQuestions.length > 0 ? t("edit") : t("add")}
          </button>
        </div>

        {isEditing ? (
          <QuestionEditSection
            normalizedQuestions={normalizedQuestions}
            selectedCount={selectedCount}
            onSelectSlot={setSelectingSlotIndex}
            onRecordSlot={setRecordingSlotIndex}
          />
        ) : (
          <div className="space-y-4">
            {answeredQuestions.length > 0 ? (
              <>
                <p className="text-sm text-muted-foreground">
                  {t("answeredCount", { count: answeredQuestions.length })}
                </p>
                <div className="space-y-4">
                  {answeredQuestions.map((qa, index) => (
                    <AnsweredQuestionPlayer key={index} qa={qa} />
                  ))}
                </div>
              </>
            ) : (
              <div className="py-8 text-center">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 text-muted" />
                <p className="mb-6 text-muted-foreground">{t("empty")}</p>
                <Button
                  onClick={() => setIsEditing(true)}
                  className="px-8 py-2 font-bold text-brand-foreground transition-all shadow-lg bg-brand hover:bg-brand-300 rounded-xl shadow-brand/20"
                >
                  {t("add")}
                </Button>
              </div>
            )}
          </div>
        )}
        {error && <p className="px-2 mt-4 text-xs font-medium text-destructive">{error}</p>}
      </section>

      <QuestionsModal
        isOpen={selectingSlotIndex !== null}
        slotIndex={selectingSlotIndex ?? 0}
        onClose={() => setSelectingSlotIndex(null)}
        onSelect={handleQuestionSelect}
        selectedQuestionIds={normalizedQuestions.map((q) => q.questionId).filter(Boolean)}
      />

      {recordingSlotIndex !== null && normalizedQuestions[recordingSlotIndex] && (
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