'use client'

import {
  JSXElementConstructor,
  ReactElement,
  ReactNode,
  ReactPortal,
  useEffect,
  useState
} from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquareQuote, Check, Plus, X, Mic } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import QuestionVoiceRecorder from './QuestionVoiceRecorder' // Import the new component
import { QUESTION_POOL, QuestionAnswer } from '@/shared-types/types'
// =============================================================================
// Types
// =============================================================================

interface QuestionsSectionProps {
  questions: QuestionAnswer[]
  onUpdateQuestions: (questions: QuestionAnswer[]) => void
  error?: string
}

interface QuestionsModalProps {
  slotIndex: number | null
  onClose: () => void
  onSelect: (questionId: string) => void
  selectedQuestionIds: string[]
}

type Step = 'selection' | 'recording'

// =============================================================================
// Components
// =============================================================================

/**
 * Section displaying Q&A prompt slots with selection capability.
 */
export const QuestionsSection = ({
  questions,
  onUpdateQuestions,
  error
}: QuestionsSectionProps) => {
  const [step, setStep] = useState<Step>('selection')
  const [currentQuestions, setCurrentQuestions] = useState<QuestionAnswer[]>(questions)
  const [editingSlotIndex, setEditingSlotIndex] = useState<number | null>(null)
  const [activeRecordingIndex, setActiveRecordingIndex] = useState<number | null>(null)

  // This effect ensures that if the 'questions' prop changes externally,
  // our internal state 'currentQuestions' is updated.
  // This is crucial when the parent component (e.g., ProfilePage) loads initial data.
  // In QuestionsSection, ensure questions are properly initialized:
  useEffect(() => {
    // Ensure questions always have the required audioUrl field (even if empty)
    const normalizedQuestions = questions.map(q => ({
      questionId: q.questionId || '',
      audioUrl: q.audioUrl || '',
      audioFile: q.audioFile
    }))
    setCurrentQuestions(normalizedQuestions)
  }, [questions])

  const handleQuestionSelect = (questionId: string) => {
    const newQuestions = [...currentQuestions]
    const selectedPrompt = QUESTION_POOL.find((q: { id: string }) => q.id === questionId)

    if (editingSlotIndex !== null && selectedPrompt) {
      const existingAnswer = newQuestions[editingSlotIndex]
      // If the same question is selected again, do nothing or just close modal
      if (existingAnswer?.questionId === questionId) {
        setEditingSlotIndex(null)
        return
      }

      // Check if this questionId is already selected in another slot
      const isAlreadySelectedInAnotherSlot = newQuestions.some(
        (q, idx) => idx !== editingSlotIndex && q.questionId === questionId
      )

      if (isAlreadySelectedInAnotherSlot) {
        alert('This question is already selected in another slot. Please choose a different one.')
        return
      }

      newQuestions[editingSlotIndex] = {
        questionId: questionId,
        audioUrl: existingAnswer?.audioUrl || '',
        audioFile: existingAnswer?.audioFile || undefined
      }
      // Fill empty slots if any up to 3
      while (newQuestions.length < 3) {
        newQuestions.push({ questionId: '', audioUrl: '' })
      }
    }
    setCurrentQuestions(newQuestions)
    onUpdateQuestions(newQuestions) // Propagate changes up
    setEditingSlotIndex(null)
  }

  const handleSaveRecording = (index: number, recordedAudioFile: Blob | string | undefined) => {
    const newQuestions = [...currentQuestions]
    if (newQuestions[index]) {
      newQuestions[index].audioFile = recordedAudioFile
    }
    setCurrentQuestions(newQuestions)
    onUpdateQuestions(newQuestions) // Propagate changes up
    setActiveRecordingIndex(null) // Exit recording for this slot
  }

  const handleCancelRecording = () => {
    setActiveRecordingIndex(null)
  }

  const selectedQuestionIds = currentQuestions.map(q => q.questionId).filter(Boolean)
  const uniqueSelectedQuestionIds = new Set(selectedQuestionIds)
  const isContinueEnabled = uniqueSelectedQuestionIds.size === 3
  const allRecordingsComplete = currentQuestions.every(qa => qa.audioFile || qa.audioUrl)

  const handleContinue = () => {
    if (isContinueEnabled) {
      setStep('recording')
      setActiveRecordingIndex(0) // Start with the first question for recording
    }
  }

  const handleFinishRecordings = () => {
    setStep('selection') // Go back to selection after finishing all recordings
    setActiveRecordingIndex(null)
  }

  return (
    <section className="bg-white dark:bg-neutral-900 rounded-3xl p-6 shadow-sm border border-neutral-100 dark:border-neutral-800">
      <div className="flex items-center gap-2 mb-6">
        <MessageSquareQuote className="w-4 h-4 text-brand" />
        <h2 className="font-bold text-sm uppercase tracking-widest text-neutral-500">
          Q&A Prompts
        </h2>
      </div>

      {step === 'selection' && (
        <>
          <div className="space-y-3">
            {[0, 1, 2].map(i => {
              const questionAnswer = currentQuestions[i]
              const selectedQ = QUESTION_POOL.find(
                (q: { id: string | undefined }) => q.id === questionAnswer?.questionId
              )
              const hasRecording = questionAnswer?.audioFile || questionAnswer?.audioUrl

              return (
                <motion.div
                  key={i}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setEditingSlotIndex(i)}
                  className={cn(
                    'p-5 rounded-2xl border transition-all cursor-pointer group',
                    selectedQ
                      ? 'border-brand/20 bg-brand/5'
                      : 'border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-black hover:border-brand/30'
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    {selectedQ ? (
                      <p className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
                        {selectedQ.text}
                      </p>
                    ) : (
                      <span className="text-sm font-bold text-neutral-400">Select a prompt...</span>
                    )}
                    {hasRecording ? (
                      <Check className="w-4 h-4 text-brand shrink-0" />
                    ) : selectedQ ? (
                      <X className="w-4 h-4 text-red-500 shrink-0" />
                    ) : (
                      <Plus className="w-4 h-4 text-neutral-300 group-hover:text-brand transition-colors" />
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
          {error && <p className="text-xs text-destructive mt-2 px-2">{error}</p>}

          <Button
            onClick={handleContinue}
            disabled={!isContinueEnabled || !allRecordingsComplete}
            className="mt-6 w-full"
          >
            {allRecordingsComplete
              ? 'Edit Recordings'
              : `Continue with ${uniqueSelectedQuestionIds.size} questions`}
          </Button>

          <QuestionsModal
            slotIndex={editingSlotIndex}
            onClose={() => setEditingSlotIndex(null)}
            onSelect={handleQuestionSelect}
            selectedQuestionIds={selectedQuestionIds}
          />
        </>
      )}

      {step === 'recording' && (
        <div className="space-y-6">
          {currentQuestions.map((qa, index) => {
            const questionPrompt = QUESTION_POOL.find((q: { id: string }) => q.id === qa.questionId)
            if (!questionPrompt) return null

            return (
              <div key={qa.questionId} className="border-b pb-4 last:border-b-0">
                <h3 className="text-md font-bold mb-4">
                  Question {index + 1}: {questionPrompt.text}
                </h3>
                {activeRecordingIndex === index ? (
                  <QuestionVoiceRecorder
                    questionText={questionPrompt.text}
                    initialAudioFile={qa.audioFile || qa.audioUrl}
                    onSave={recordedAudioFile => handleSaveRecording(index, recordedAudioFile)}
                    onCancel={handleCancelRecording}
                  />
                ) : (
                  <Button
                    onClick={() => setActiveRecordingIndex(index)}
                    variant="outline"
                    className="w-full flex items-center gap-2"
                  >
                    {qa.audioFile || qa.audioUrl ? 'Edit Recording' : 'Record Answer'}
                    <Mic className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )
          })}
          <Button
            onClick={handleFinishRecordings}
            disabled={!allRecordingsComplete}
            className="mt-6 w-full"
          >
            Finish Recordings
          </Button>
        </div>
      )}
    </section>
  )
}

/**
 * Modal for selecting a Q&A prompt from the question pool.
 */
export const QuestionsModal = ({
  slotIndex,
  onClose,
  onSelect,
  selectedQuestionIds
}: QuestionsModalProps) => (
  <AnimatePresence>
    {slotIndex !== null && (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
        />
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          className="relative w-full max-w-lg bg-white dark:bg-neutral-900 rounded-t-[40px] sm:rounded-3xl p-8 shadow-2xl overflow-hidden max-h-[85vh] flex flex-col"
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-2xl font-black italic uppercase">Pick a Prompt</h3>
              <p className="text-xs font-bold text-neutral-400">Slot {slotIndex + 1} of 3</p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center bg-neutral-100 dark:hover:bg-neutral-800 rounded-full cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar">
            {QUESTION_POOL.map(
              (q: {
                id: string
                text:
                  | string
                  | number
                  | bigint
                  | boolean
                  | ReactElement<unknown, string | JSXElementConstructor<any>>
                  | Iterable<ReactNode>
                  | ReactPortal
                  | Promise<
                      | string
                      | number
                      | bigint
                      | boolean
                      | ReactPortal
                      | ReactElement<unknown, string | JSXElementConstructor<any>>
                      | Iterable<ReactNode>
                      | null
                      | undefined
                    >
                  | null
                  | undefined
              }) => {
                const isAlreadySelected = selectedQuestionIds.includes(q.id)
                return (
                  <button
                    key={q.id}
                    type="button"
                    disabled={isAlreadySelected}
                    onClick={() => onSelect(q.id)}
                    className={cn(
                      'w-full text-left p-5 rounded-2xl border-2 transition-all font-bold text-sm cursor-pointer',
                      isAlreadySelected
                        ? 'opacity-30 border-neutral-100 grayscale'
                        : 'border-neutral-100 dark:border-neutral-800 hover:border-brand/50 bg-neutral-50 dark:bg-black'
                    )}
                  >
                    {q.text}
                  </button>
                )
              }
            )}
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
)
