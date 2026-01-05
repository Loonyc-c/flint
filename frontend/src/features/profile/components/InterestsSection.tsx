'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Heart, X, Check } from 'lucide-react'
import { INTERESTS } from '@shared/types/enums'
import { cn } from '@/lib/utils'

interface InterestsSectionProps {
  selectedInterests: INTERESTS[]
  onEdit: () => void
  error?: string
}

export const InterestsSection = ({ selectedInterests, onEdit, error }: InterestsSectionProps) => {
  return (
    <section className="bg-white dark:bg-neutral-900 rounded-3xl p-6 shadow-sm border border-neutral-100 dark:border-neutral-800">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Heart className="w-4 h-4 text-brand" />
          <h2 className="font-bold text-sm uppercase tracking-widest text-neutral-500">
            Interests
          </h2>
        </div>
        <button
          type="button"
          onClick={onEdit}
          className="px-4 py-1.5 bg-brand text-white text-xs font-black rounded-full shadow-lg shadow-brand/20 active:scale-95 transition-transform"
        >
          EDIT
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {selectedInterests.length ? (
          selectedInterests.map(interest => (
            <motion.span
              key={interest}
              {...({
                initial: { scale: 0.8, opacity: 0 },
                animate: { scale: 1, opacity: 1 },
                transition: { type: 'spring', stiffness: 300, damping: 20 },
                className:
                  'px-4 py-2 bg-neutral-50 dark:bg-black border border-neutral-100 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs rounded-full font-bold'
              } as any)}
            >
              {interest}
            </motion.span>
          ))
        ) : (
          <p className="text-sm text-neutral-400 italic py-2">
            What do you love? Tap edit to add interests.
          </p>
        )}
      </div>

      {error && <p className="text-xs text-destructive mt-2 px-2">{error}</p>}
    </section>
  )
}

interface InterestsModalProps {
  isOpen: boolean
  onClose: () => void
  selectedInterests: INTERESTS[]
  onToggle: (interest: INTERESTS) => void
}

export const InterestsModal = ({
  isOpen,
  onClose,
  selectedInterests,
  onToggle
}: InterestsModalProps) => {
  const allInterests = Object.values(INTERESTS)

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <motion.div
            {...({
              initial: { opacity: 0 },
              animate: { opacity: 1 },
              exit: { opacity: 0 },
              onClick: onClose,
              className: 'absolute inset-0 bg-black/80 backdrop-blur-md'
            } as any)}
          />
          <motion.div
            {...({
              initial: { y: '100%' },
              animate: { y: 0 },
              exit: { y: '100%' },
              className:
                'relative w-full max-w-lg bg-white dark:bg-neutral-900 rounded-t-[40px] sm:rounded-3xl p-8 shadow-2xl overflow-hidden max-h-[85vh] flex flex-col'
            } as any)}
          >
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-black italic uppercase">Select Interests</h3>
                <p className="text-xs font-bold text-neutral-400">
                  {selectedInterests.length} selected
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center bg-neutral-100 dark:hover:bg-neutral-800 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex flex-wrap gap-3 overflow-y-auto pr-2 custom-scrollbar">
              {allInterests.map(interest => {
                const isSelected = selectedInterests.includes(interest)
                return (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => onToggle(interest)}
                    className={cn(
                      'px-5 py-3 rounded-full border-2 transition-all font-bold text-sm flex items-center gap-2',
                      isSelected
                        ? 'border-brand bg-brand/10 text-brand'
                        : 'border-neutral-100 dark:border-neutral-800 hover:border-brand/50 bg-neutral-50 dark:bg-black text-neutral-700 dark:text-neutral-300'
                    )}
                  >
                    {interest}
                    {isSelected && <Check className="w-4 h-4" />}
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
