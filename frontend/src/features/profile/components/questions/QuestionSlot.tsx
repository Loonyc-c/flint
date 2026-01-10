"use client";

import { motion } from "framer-motion";
import { Check, Plus, X, Mic, Edit2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { QUESTION_POOL, type QuestionAnswer } from "@/shared-types/types";

interface QuestionSlotProps {
  index: number;
  qa: QuestionAnswer;
  onSelect: () => void;
  onRecord: () => void;
}

export const QuestionSlot = ({
  index,
  qa,
  onSelect,
  onRecord,
}: QuestionSlotProps) => {
  const selectedQuestion = QUESTION_POOL.find((q) => q.id === qa.questionId);
  const hasRecording = !!(qa.audioFile || qa.audioUrl);
  const isComplete = !!(selectedQuestion && hasRecording);

  return (
    <motion.div
      className={cn(
        "p-5 rounded-2xl border-2 transition-all",
        isComplete
          ? "border-brand/30 bg-brand/5"
          : selectedQuestion
            ? "border-orange-300 bg-orange-50 dark:bg-orange-950/20"
            : "border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-black"
      )}
    >
      {/* Question Display/Selection */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="mb-1 text-xs font-bold text-neutral-400">
            Question {index + 1}
          </div>
          {selectedQuestion ? (
            <p className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
              {selectedQuestion.text}
            </p>
          ) : (
            <p className="text-sm italic font-medium text-neutral-400">
              No question selected
            </p>
          )}
        </div>

        {isComplete ? (
          <Check className="w-5 h-5 mt-1 text-brand shrink-0" />
        ) : selectedQuestion ? (
          <X className="w-5 h-5 mt-1 text-orange-500 shrink-0" />
        ) : (
          <Plus className="w-5 h-5 mt-1 text-neutral-300 shrink-0" />
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onSelect}
          className="flex-1 text-xs"
        >
          {selectedQuestion ? (
            <>
              <Edit2 className="w-3 h-3 mr-1" />
              Change Question
            </>
          ) : (
            <>
              <Plus className="w-3 h-3 mr-1" />
              Select Question
            </>
          )}
        </Button>

        {selectedQuestion && (
          <Button
            type="button"
            variant={hasRecording ? "outline" : "default"}
            size="sm"
            onClick={onRecord}
            className="flex-1 text-xs"
          >
            <Mic className="w-3 h-3 mr-1" />
            {hasRecording ? "Edit Recording" : "Record Answer"}
          </Button>
        )}
      </div>
    </motion.div>
  );
};
