'use client'

import { motion } from 'framer-motion'
import { Settings } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface SidebarHeaderProps {
  title: string
}

export const SidebarHeader = ({ title }: SidebarHeaderProps) => {
  const t = useTranslations('chat')

  return (
    <div className="flex items-center justify-between shrink-0">
      <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
        {title}
      </h2>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="p-2.5 rounded-xl bg-neutral-100/80 dark:bg-neutral-800/80 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200/80 dark:hover:bg-neutral-700/80 transition-colors"
        aria-label={t('settings')}
      >
        <Settings className="h-4 w-4" />
      </motion.button>
    </div>
  )
}
