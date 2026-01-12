'use client'

import { motion } from 'framer-motion'
import { type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SidebarStatCardProps {
  icon: LucideIcon
  label: string
  value: number
  variant?: 'default' | 'brand' | 'likes'
  onClick: () => void
  disabled?: boolean
}

const variants = {
  default: {
    bg: 'bg-neutral-100/80 dark:bg-neutral-800/80',
    hover: 'hover:bg-neutral-200/80 dark:hover:bg-neutral-700/80',
    text: 'text-neutral-700 dark:text-neutral-200',
    icon: 'text-neutral-500 dark:text-neutral-400',
    value: 'text-neutral-900 dark:text-white',
  },
  brand: {
    bg: 'bg-gradient-to-br from-brand/10 to-brand-300/10 dark:from-brand/20 dark:to-brand-300/20',
    hover: 'hover:from-brand/20 hover:to-brand-300/20 dark:hover:from-brand/30 dark:hover:to-brand-300/30',
    text: 'text-brand dark:text-brand-300',
    icon: 'text-brand dark:text-brand-300',
    value: 'text-brand dark:text-brand-300',
  },
  likes: {
    bg: 'bg-gradient-to-br from-amber-500/10 to-orange-500/10 dark:from-amber-500/20 dark:to-orange-500/20',
    hover: 'hover:from-amber-500/20 hover:to-orange-500/20 dark:hover:from-amber-500/30 dark:hover:to-orange-500/30',
    text: 'text-amber-600 dark:text-amber-400',
    icon: 'text-amber-500 dark:text-amber-400',
    value: 'text-amber-600 dark:text-amber-400',
  },
} as const

export const SidebarStatCard = ({ 
  icon: Icon, 
  label, 
  value, 
  variant = 'default', 
  onClick,
  disabled = false
}: SidebarStatCardProps) => {
  const v = variants[variant]

  return (
    <motion.button
      whileHover={disabled ? {} : { scale: 1.02, y: -2 }}
      whileTap={disabled ? {} : { scale: 0.98 }}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={cn(
        "w-full min-w-0 flex flex-col gap-2 rounded-2xl px-4 py-3.5 transition-all",
        disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
        v.bg, 
        !disabled && v.hover
      )}
    >
      <div className="flex items-center gap-2 w-full">
        <Icon className={cn("h-4 w-4 shrink-0", v.icon)} />
        <span className={cn("font-medium text-sm", v.text)}>{label}</span>
        {disabled && (
          <span className="ml-auto text-[10px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
            Soon
          </span>
        )}
      </div>
      <div className={cn("text-2xl font-bold leading-none", v.value)}>
        {value}
      </div>
    </motion.button>
  )
}
