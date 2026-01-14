'use client'

import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'

interface SidebarEmptyStateProps {
  title: string
  subtitle: string
}

export const SidebarEmptyState = ({ title, subtitle }: SidebarEmptyStateProps) => (
  <motion.div 
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="px-4 py-8 text-center"
  >
    <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
      <Sparkles className="w-5 h-5 text-neutral-400" />
    </div>
    <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">{title}</p>
    <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">{subtitle}</p>
  </motion.div>
)
