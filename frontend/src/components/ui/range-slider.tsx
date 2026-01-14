'use client'

import { cn } from '@/lib/utils'

interface RangeSliderProps {
  label: string
  value: number
  min: number
  max: number
  unit?: string
  onChange?: (value: number) => void
  disabled?: boolean
  className?: string
  helperText?: string
}

export const RangeSlider = ({
  label,
  value,
  min,
  max,
  unit = '',
  onChange,
  disabled = false,
  className,
  helperText,
}: RangeSliderProps) => {
  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <div className="flex items-center justify-between">
        <label className="text-base font-medium sm:text-lg text-neutral-800 dark:text-neutral-200">
          {label}
        </label>
        <span className={cn('font-semibold', disabled ? 'text-neutral-400' : 'text-brand')}>
          {value} {unit}
        </span>
      </div>
      <div className="w-full px-2">
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange?.(parseInt(e.target.value))}
          disabled={disabled}
          className={cn(
            'w-full h-1 rounded-lg appearance-none cursor-pointer',
            disabled ? 'bg-gray-200 cursor-not-allowed accent-gray-400' : 'bg-gray-200 dark:bg-neutral-700 accent-[#D9776D]'
          )}
        />
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span>{min}</span>
          <span>{max}</span>
        </div>
        {helperText && (
          <p className="mt-1 text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
            {helperText}
          </p>
        )}
      </div>
    </div>
  )
}
