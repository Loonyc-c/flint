'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Heart, Check, X } from 'lucide-react'
import { INTERESTS } from '@shared/types/enums'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

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
          <h2 className="font-bold text-sm uppercase tracking-widest text-neutral-500">Interests</h2>
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
        {selectedInterests?.length ? (
          selectedInterests.map(interest => (
            <motion.span
              layout
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              key={interest}
              className="px-4 py-2 bg-neutral-50 dark:bg-black border border-neutral-100 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs rounded-full font-bold"
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
  return (
    <AnimatePresence>
      {isOpen && (
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
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="relative w-full max-w-lg bg-white dark:bg-neutral-900 rounded-t-[40px] sm:rounded-3xl p-8 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
          >
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-black italic">INTERESTS</h3>
                <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">
                  Select at least 3
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center bg-neutral-100 dark:hover:bg-neutral-800 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 overflow-y-auto pr-2 custom-scrollbar">
              {Object.values(INTERESTS).map(interest => {
                const isSelected = selectedInterests?.includes(interest)
                return (
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    key={interest}
                    type="button"
                    onClick={() => onToggle(interest)}
                    className={cn(
                      'flex items-center justify-between px-5 py-4 rounded-2xl border-2 transition-all text-sm font-black uppercase tracking-tight',
                      isSelected
                        ? 'bg-brand border-brand text-white shadow-lg shadow-brand/20'
                        : 'border-neutral-100 dark:border-neutral-800 hover:border-brand/30'
                    )}
                  >
                    {interest}
                    {isSelected && <Check className="w-4 h-4" />}
                  </motion.button>
                )
              })}
            </div>
            <Button
              className="w-full bg-brand h-16 mt-8 rounded-2xl text-lg font-black tracking-widest shadow-xl shadow-brand/30"
              onClick={onClose}
            >
              DONE
            </Button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
