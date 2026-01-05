'use client'

import { motion } from 'framer-motion'
import { Heart } from 'lucide-react'
import { INTERESTS } from '@shared/types/enums'

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
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
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
