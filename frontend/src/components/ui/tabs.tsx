'use client'

import { useState, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

// =============================================================================
// Types
// =============================================================================

interface Tab {
  title: string
  value: string
  content: ReactNode
}

interface TabsProps {
  tabs: Tab[]
  containerClassName?: string
  activeTabClassName?: string
  tabClassName?: string
  contentClassName?: string
}

interface FadeInDivProps {
  className?: string
  active: Tab
}

// =============================================================================
// Sub-Components
// =============================================================================

const FadeInDiv = ({ className, active }: FadeInDivProps) => (
  <div className={cn('w-full', className)}>
    <motion.div
      key={active.value}
      layoutId={active.value}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ type: 'spring', bounce: 0.3, duration: 0.6 }}
      className="w-full"
    >
      {active.content}
    </motion.div>
  </div>
)

// =============================================================================
// Main Component
// =============================================================================

/**
 * Animated tabs component with smooth transitions between content.
 */
export const Tabs = ({
  tabs: propTabs,
  containerClassName,
  activeTabClassName,
  tabClassName,
  contentClassName
}: TabsProps) => {
  const [active, setActive] = useState<Tab | undefined>(propTabs[0])

  // Guard against empty tabs array
  if (!active || propTabs.length === 0) {
    return null
  }

  return (
    <>
      <div
        className={cn(
          'flex w-full items-center justify-center gap-2 sm:gap-4 md:gap-6',
          containerClassName
        )}
      >
        {propTabs.map(tab => {
          const isActive = active.value === tab.value
          return (
            <button
              key={tab.value ?? tab.title}
              onClick={() => setActive(tab)}
              data-tab={tab.value}
              className={cn(
                'relative flex-1 min-w-0 inline-flex items-center justify-center',
                'px-3 sm:px-4 py-1.5 sm:py-2 rounded-full',
                'text-center cursor-pointer',
                tabClassName
              )}
              style={{ transformStyle: 'preserve-3d' }}
            >
              {isActive && (
                <motion.div
                  layoutId="clickedbutton"
                  transition={{ type: 'spring', bounce: 0.3, duration: 0.6 }}
                  className={cn(
                    'absolute inset-0 rounded-full bg-secondary',
                    activeTabClassName
                  )}
                />
              )}

              <span
                className={cn(
                  'relative z-10 font-medium text-foreground leading-none',
                  'text-[clamp(11px,3.2vw,16px)]'
                )}
              >
                {tab.title}
              </span>
            </button>
          )
        })}
      </div>

      <FadeInDiv active={active} className={cn('pt-6 sm:pt-8 w-full', contentClassName)} />
    </>
  )
}
