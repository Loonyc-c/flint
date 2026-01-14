'use client'

import { type QuestionAnswer } from '@/shared-types/types'
import { QuestionSlot } from './QuestionSlot'
import { useTranslations } from 'next-intl'

interface QuestionEditSectionProps {
  normalizedQuestions: QuestionAnswer[]
  selectedCount: number
  onSelectSlot: (index: number) => void
  onRecordSlot: (index: number) => void
}

export const QuestionEditSection = ({
  normalizedQuestions,
  selectedCount,
  onSelectSlot,
  onRecordSlot
}: QuestionEditSectionProps) => {
  const t = useTranslations('profile.questions')

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold tracking-widest uppercase text-neutral-400">
          {t('editingPrompts')}
        </span>
        <span className="text-xs font-medium text-neutral-400">
          {t('selectedCount', { count: selectedCount })}
        </span>
      </div>
      <div className="space-y-3">
        {normalizedQuestions.map((qa, index) => (
          <QuestionSlot
            key={index}
            index={index}
            qa={qa}
            onSelect={() => onSelectSlot(index)}
            onRecord={() => onRecordSlot(index)}
          />
        ))}
      </div>
    </div>
  )
}
