'use client'

import { cn } from '@/lib/utils'
import { LOOKING_FOR } from '@shared/types'
import { useTranslations } from 'next-intl'

interface GenderSelectorProps {
  value?: LOOKING_FOR
  onChange: (value: LOOKING_FOR) => void
}

export const GenderSelector = ({ value, onChange }: GenderSelectorProps) => {
  const t = useTranslations('home.matchingPref')
  const options = [
    { label: t('genders.everyone'), value: LOOKING_FOR.ALL },
    { label: t('genders.men'), value: LOOKING_FOR.MALE },
    { label: t('genders.women'), value: LOOKING_FOR.FEMALE },
  ]

  return (
    <div className="flex flex-col justify-between w-full gap-4 pt-2 pb-4 border-b border-gray-200 sm:flex-row sm:items-center dark:border-neutral-700">
      <span className="text-base font-medium sm:text-lg text-neutral-800 dark:text-neutral-200">
        {t('interestedIn')}
      </span>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={cn(
              'px-4 py-1.5 rounded-full text-sm font-medium transition-colors',
              value === option.value
                ? 'bg-brand text-white'
                : 'bg-gray-100 dark:bg-neutral-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-neutral-600'
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}
