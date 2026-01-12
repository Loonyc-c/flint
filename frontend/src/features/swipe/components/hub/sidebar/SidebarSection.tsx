'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'

interface SidebarSectionProps {
  title: string
  count?: number
  open: boolean
  onToggle: () => void
  children: React.ReactNode 
}

export const SidebarSection = ({ 
  title, 
  count,
  open, 
  onToggle, 
  children 
}: SidebarSectionProps) => (
  <div className="flex flex-col">
    <motion.button
      whileTap={{ scale: 0.98 }}
      type="button"
      onClick={onToggle}
      className="flex items-center justify-between py-3 px-1 group"
      aria-expanded={open}
    >
      <span className="flex items-center gap-2">
        <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">{title}</span>
        {count !== undefined && count > 0 && (
          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300">
            {count}
          </span>
        )}
      </span>
      <motion.div
        animate={{ rotate: open ? 180 : 0 }}
        transition={{ duration: 0.2 }}
      >
        <ChevronDown className="h-4 w-4 text-neutral-400 group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors" />
      </motion.div>
    </motion.button>
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden"
        >
          <div className="flex flex-col gap-1 pb-2">{children}</div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
)
