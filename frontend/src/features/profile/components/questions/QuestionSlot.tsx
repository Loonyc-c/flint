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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={cn(
        "p-5 rounded-2xl border-2 transition-all shadow-sm hover:shadow-md bg-gradient-to-br",
        isComplete
          ? "border-brand/30 from-brand/5 to-white dark:from-brand/10 dark:to-neutral-900"
          : selectedQuestion
            ? "border-orange-300 from-orange-50 to-white dark:from-orange-950/20 dark:to-neutral-900"
            : "border-neutral-100 dark:border-neutral-800 from-neutral-50 to-white dark:from-neutral-900 dark:to-black"
      )}
    >
      {/* Question Display/Selection */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex-1 min-w-0">
          <div className="mb-1 text-[10px] font-black tracking-widest uppercase text-neutral-400">
            PROMPT {index + 1}
          </div>
          {selectedQuestion ? (
            <p className="text-base font-bold leading-tight text-neutral-800 dark:text-neutral-200">
              {selectedQuestion.text}
            </p>
          ) : (
            <p className="text-sm italic font-medium text-neutral-400">
              No question selected
            </p>
          )}
        </div>

        {isComplete ? (
          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-brand/10 shrink-0">
            <Check className="w-4 h-4 text-brand" />
          </div>
        ) : selectedQuestion ? (
          <div className="flex items-center justify-center w-6 h-6 bg-orange-100 rounded-full shrink-0">
            <X className="w-4 h-4 text-orange-500" />
          </div>
        ) : (
          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-neutral-100 shrink-0">
            <Plus className="w-4 h-4 text-neutral-300" />
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={onSelect}
          className="flex-1 text-xs font-bold cursor-pointer rounded-xl h-9"
        >
          {selectedQuestion ? (
            <>
              <Edit2 className="w-3 h-3 mr-1.5" />
              Change
            </>
          ) : (
            <>
              <Plus className="w-3 h-3 mr-1.5" />
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
            className={cn(
              "flex-1 text-xs font-bold rounded-xl h-9 cursor-pointer",
              !hasRecording &&
                "bg-brand hover:bg-brand-300 shadow-lg shadow-brand/20"
            )}
          >
            <Mic className="w-3 h-3 mr-1.5" />
            {hasRecording ? "Re-record" : "Record Answer"}
          </Button>
        )}
      </div>
    </motion.div>
  );
};
