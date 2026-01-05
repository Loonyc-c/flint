'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquareQuote, Check, Plus, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export const QUESTION_POOL = [
  { id: 'personality_1', text: "What's your ideal first date?" },
  { id: 'personality_2', text: 'What makes you laugh the most?' },
  { id: 'personality_3', text: "What's your biggest passion in life?" },
  { id: 'lifestyle_3', text: "What's your dream travel destination?" },
  { id: 'fun_2', text: "What's your hidden talent?" }
]

interface QuestionsSectionProps {
  questions: { questionId: string; audioUrl: string }[]
  onEditSlot: (index: number) => void
  error?: string
}

export const QuestionsSection = ({ questions, onEditSlot, error }: QuestionsSectionProps) => {
  return (
    <section className="bg-white dark:bg-neutral-900 rounded-3xl p-6 shadow-sm border border-neutral-100 dark:border-neutral-800">
      <div className="flex items-center gap-2 mb-6">
        <MessageSquareQuote className="w-4 h-4 text-brand" />
        <h2 className="font-bold text-sm uppercase tracking-widest text-neutral-500">Q&A Prompts</h2>
      </div>
      <div className="space-y-3">
        {[0, 1, 2].map(i => {
          const selectedQ = QUESTION_POOL.find(q => q.id === questions?.[i]?.questionId)
          return (
            <motion.div
              key={i}
              whileTap={{ scale: 0.98 }}
              onClick={() => onEditSlot(i)}
              className={cn(
                'p-5 rounded-2xl border transition-all cursor-pointer group',
                selectedQ
                  ? 'border-brand/20 bg-brand/5'
                  : 'border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-black hover:border-brand/30'
              )}
            >
              {selectedQ ? (
                <div className="flex items-start justify-between gap-4">
                  <p className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
                    {selectedQ.text}
                  </p>
                  <Check className="w-4 h-4 text-brand shrink-0" />
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-neutral-400">Select a prompt...</span>
                  <Plus className="w-4 h-4 text-neutral-300 group-hover:text-brand transition-colors" />
                </div>
              )}
            </motion.div>
          )
        })}
      </div>
      {error && <p className="text-xs text-destructive mt-2 px-2">{error}</p>}
    </section>
  )
}

interface QuestionsModalProps {
  slotIndex: number | null
  onClose: () => void
  onSelect: (questionId: string) => void
  selectedQuestionIds: string[]
}

export const QuestionsModal = ({
  slotIndex,
  onClose,
  onSelect,
  selectedQuestionIds
}: QuestionsModalProps) => {
  return (
    <AnimatePresence>
      {slotIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <motion.div
            {...({
              initial: { opacity: 0 },
              animate: { opacity: 1 },
              exit: { opacity: 0 },
              onClick: onClose,
              className: 'absolute inset-0 bg-black/80 backdrop-blur-md',
            } as any)}
          />
          <motion.div
            {...({
              initial: { y: '100%' },
              animate: { y: 0 },
              exit: { y: '100%' },
              className: 'relative w-full max-w-lg bg-white dark:bg-neutral-900 rounded-t-[40px] sm:rounded-3xl p-8 shadow-2xl overflow-hidden max-h-[85vh] flex flex-col',
            } as any)}
          >
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-black italic uppercase">Pick a Prompt</h3>
                <p className="text-xs font-bold text-neutral-400">Slot {slotIndex + 1} of 3</p>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center bg-neutral-100 dark:hover:bg-neutral-800 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar">
              {QUESTION_POOL.map(q => {
                const isAlreadySelected = selectedQuestionIds.includes(q.id)
                return (
                  <button
                    key={q.id}
                    type="button"
                    disabled={isAlreadySelected}
                    onClick={() => onSelect(q.id)}
                    className={cn(
                      'w-full text-left p-5 rounded-2xl border-2 transition-all font-bold text-sm',
                      isAlreadySelected
                        ? 'opacity-30 border-neutral-100 grayscale'
                        : 'border-neutral-100 dark:border-neutral-800 hover:border-brand/50 bg-neutral-50 dark:bg-black'
                    )}
                  >
                    {q.text}
                  </button>
                )
              })}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
