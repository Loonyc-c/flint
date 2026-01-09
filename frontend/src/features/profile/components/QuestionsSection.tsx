'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquareQuote, Check, Plus, X, Mic, Edit2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import QuestionVoiceRecorder from './QuestionVoiceRecorder'
import { QUESTION_POOL, QuestionAnswer } from '@/shared-types/types'

// =============================================================================
// Types
// =============================================================================

export interface QuestionsSectionProps {
  questions: QuestionAnswer[]
  onUpdateQuestions: (questions: QuestionAnswer[]) => void
  error?: string
}

export interface QuestionsModalProps {
  isOpen: boolean
  slotIndex: number
  onClose: () => void
  onSelect: (questionId: string) => void
  selectedQuestionIds: string[]
}

interface RecordingModalProps {
  isOpen: boolean
  question: QuestionAnswer
  questionIndex: number
  onClose: () => void
  onSave: (audioFile: Blob | string | undefined) => void
}

// =============================================================================
// Main Component - Simplified with single source of truth
// =============================================================================

export const QuestionsSection = ({
  questions,
  onUpdateQuestions,
  error
}: QuestionsSectionProps) => {
  const [selectingSlotIndex, setSelectingSlotIndex] = useState<number | null>(null)
  const [recordingSlotIndex, setRecordingSlotIndex] = useState<number | null>(null)

  // Ensure we always have 3 slots
  const normalizedQuestions: QuestionAnswer[] = [0, 1, 2].map(
    i =>
      questions[i] || {
        questionId: '',
        audioUrl: '',
        audioFile: undefined
      }
  )

  const handleQuestionSelect = (questionId: string) => {
    if (selectingSlotIndex === null) return

    // Check for duplicates
    const isDuplicate = normalizedQuestions.some(
      (q, idx) => idx !== selectingSlotIndex && q.questionId === questionId
    )

    if (isDuplicate) {
      alert('This question is already selected in another slot.')
      return
    }

    // Update the question
    const updated = [...normalizedQuestions]
    const currentQuestion = updated[selectingSlotIndex]

    if (!currentQuestion) return // Guard against undefined

    updated[selectingSlotIndex] = {
      questionId,
      audioUrl: currentQuestion.audioUrl || '',
      audioFile: currentQuestion.audioFile
    }

    onUpdateQuestions(updated)
    setSelectingSlotIndex(null)
  }

  const handleSaveRecording = (audioFile: Blob | string | undefined) => {
    if (recordingSlotIndex === null) return

    const updated = [...normalizedQuestions]
    const currentQuestion = updated[recordingSlotIndex]

    if (!currentQuestion) return // Guard against undefined

    updated[recordingSlotIndex] = {
      questionId: currentQuestion.questionId,
      audioUrl: currentQuestion.audioUrl || '',
      audioFile
    }

    onUpdateQuestions(updated)
    setRecordingSlotIndex(null)
  }

  const selectedQuestionIds = normalizedQuestions.map(q => q.questionId).filter(Boolean)

  return (
    <>
      <section className="bg-white dark:bg-neutral-900 rounded-3xl p-6 shadow-sm border border-neutral-100 dark:border-neutral-800">
        <div className="flex items-center gap-2 mb-6">
          <MessageSquareQuote className="w-4 h-4 text-brand" />
          <h2 className="font-bold text-sm uppercase tracking-widest text-neutral-500">
            Q&A Prompts
          </h2>
          <span className="ml-auto text-xs text-neutral-400 font-medium">
            {selectedQuestionIds.length}/3 selected
          </span>
        </div>

        <div className="space-y-3">
          {normalizedQuestions.map((qa, index) => {
            const selectedQuestion = QUESTION_POOL.find(q => q.id === qa.questionId)
            const hasRecording = !!(qa.audioFile || qa.audioUrl)
            const isComplete = selectedQuestion && hasRecording

            return (
              <motion.div
                key={index}
                className={cn(
                  'p-5 rounded-2xl border-2 transition-all',
                  isComplete
                    ? 'border-brand/30 bg-brand/5'
                    : selectedQuestion
                      ? 'border-orange-300 bg-orange-50 dark:bg-orange-950/20'
                      : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-black'
                )}
              >
                {/* Question Display/Selection */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-neutral-400 mb-1">
                      Question {index + 1}
                    </div>
                    {selectedQuestion ? (
                      <p className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
                        {selectedQuestion.text}
                      </p>
                    ) : (
                      <p className="text-sm font-medium text-neutral-400 italic">
                        No question selected
                      </p>
                    )}
                  </div>

                  {isComplete ? (
                    <Check className="w-5 h-5 text-brand shrink-0 mt-1" />
                  ) : selectedQuestion ? (
                    <X className="w-5 h-5 text-orange-500 shrink-0 mt-1" />
                  ) : (
                    <Plus className="w-5 h-5 text-neutral-300 shrink-0 mt-1" />
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectingSlotIndex(index)}
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
                      variant={hasRecording ? 'outline' : 'default'}
                      size="sm"
                      onClick={() => setRecordingSlotIndex(index)}
                      className="flex-1 text-xs"
                    >
                      <Mic className="w-3 h-3 mr-1" />
                      {hasRecording ? 'Edit Recording' : 'Record Answer'}
                    </Button>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>

        {error && <p className="text-xs text-destructive mt-3 px-2 font-medium">{error}</p>}
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
  )
}

// =============================================================================
// Question Selection Modal
// =============================================================================

export const QuestionsModal = ({
  isOpen,
  slotIndex,
  onClose,
  onSelect,
  selectedQuestionIds
}: QuestionsModalProps) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25 }}
          className="relative w-full max-w-lg bg-white dark:bg-neutral-900 rounded-t-[40px] sm:rounded-3xl p-6 shadow-2xl max-h-[85vh] flex flex-col"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-black">Select a Question</h3>
              <p className="text-xs font-medium text-neutral-400 mt-1">
                For slot {slotIndex + 1} of 3
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 flex items-center justify-center hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-2 overflow-y-auto pr-2">
            {QUESTION_POOL.map(question => {
              const isSelected = selectedQuestionIds.includes(question.id)
              return (
                <button
                  key={question.id}
                  type="button"
                  disabled={isSelected}
                  onClick={() => onSelect(question.id)}
                  className={cn(
                    'w-full text-left p-4 rounded-xl border-2 transition-all text-sm font-medium',
                    isSelected
                      ? 'opacity-40 border-neutral-200 bg-neutral-100 cursor-not-allowed'
                      : 'border-neutral-200 dark:border-neutral-800 hover:border-brand bg-white dark:bg-black hover:bg-brand/5'
                  )}
                >
                  {question.text}
                </button>
              )
            })}
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
)

// =============================================================================
// Recording Modal
// =============================================================================

const RecordingModal = ({
  isOpen,
  question,
  questionIndex,
  onClose,
  onSave
}: RecordingModalProps) => {
  const selectedQuestion = QUESTION_POOL.find(q => q.id === question.questionId)

  if (!selectedQuestion) return null

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
            transition={{ type: 'spring', damping: 25 }}
            className="relative w-full max-w-md bg-white dark:bg-neutral-900 rounded-3xl p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <div className="text-xs font-bold text-brand mb-2">
                  QUESTION {questionIndex + 1}
                </div>
                <h3 className="text-lg font-bold text-neutral-800 dark:text-neutral-200">
                  {selectedQuestion.text}
                </h3>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 flex items-center justify-center hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors shrink-0 ml-2"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <QuestionVoiceRecorder
              questionText={selectedQuestion.text}
              initialAudioFile={question.audioFile || question.audioUrl}
              onSave={audioFile => {
                onSave(audioFile)
                onClose()
              }}
              onCancel={onClose}
            />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
