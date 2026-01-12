"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { QUESTION_POOL, type QuestionPrompt } from "@/shared-types/types";
import { useTranslations } from "next-intl";

export interface QuestionsModalProps {
  isOpen: boolean;
  slotIndex: number;
  onClose: () => void;
  onSelect: (questionId: string) => void;
  selectedQuestionIds: string[];
}

export const QuestionsModal = ({
  isOpen,
  slotIndex,
  onClose,
  onSelect,
  selectedQuestionIds,
}: QuestionsModalProps) => {
  const t = useTranslations("profile.questions.modal");

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25 }}
            className="relative w-full max-w-lg p-6 shadow-2xl bg-card rounded-t-[40px] sm:rounded-3xl max-h-[85vh] flex flex-col"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-black text-foreground">{t("title")}</h3>
                <p className="mt-1 text-xs font-medium text-muted-foreground">
                  {t("slotInfo", { number: slotIndex + 1 })}
                </p>
              </div>
              <button
                onClick={onClose}
                className="flex items-center justify-center transition-colors rounded-full w-9 h-9 hover:bg-accent"
              >
                <X className="w-5 h-5 text-foreground" />
              </button>
            </div>

            <div className="pr-2 space-y-6 overflow-y-auto">
              {Object.entries(
                QUESTION_POOL.reduce(
                  (acc, question) => {
                    const category = question.category || t("categories.general");
                    if (!acc[category]) acc[category] = [];
                    acc[category].push(question);
                    return acc;
                  },
                  {} as Record<string, QuestionPrompt[]>
                )
              ).map(([category, questions]) => (
                <div key={category} className="space-y-2">
                  <h4 className="px-1 text-xs font-bold tracking-widest uppercase text-muted-foreground">
                    {category}
                  </h4>
                  <div className="space-y-2">
                    {questions.map((question) => {
                      const isSelected = selectedQuestionIds.includes(question.id);
                      return (
                        <button
                          key={question.id}
                          type="button"
                          disabled={isSelected}
                          onClick={() => onSelect(question.id)}
                          className={cn(
                            "w-full text-left p-4 rounded-xl border-2 transition-all text-sm font-medium",
                            isSelected
                              ? "opacity-40 border-border bg-muted cursor-not-allowed"
                              : "border-border hover:border-brand bg-background hover:bg-brand/5 text-foreground"
                          )}
                        >
                          {question.text}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
