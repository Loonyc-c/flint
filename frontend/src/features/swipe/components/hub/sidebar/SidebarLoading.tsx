'use client'

import { motion } from 'framer-motion'

export const SidebarLoading = () => (
  <div className="space-y-3 mt-2">
    {[...Array(5)].map((_, i) => (
      <motion.div 
        key={i} 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: i * 0.1 }}
        className="flex items-center gap-3 p-3"
      >
        <div className="w-12 h-12 rounded-full bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-24 bg-neutral-200 dark:bg-neutral-800 rounded-lg animate-pulse" />
          <div className="h-3 w-32 bg-neutral-200 dark:bg-neutral-800 rounded-lg animate-pulse" />
        </div>
      </motion.div>
    ))}
  </div>
)
