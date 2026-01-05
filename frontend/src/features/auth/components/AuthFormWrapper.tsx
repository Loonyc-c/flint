'use client'

import { cn } from '@/lib/utils'

interface AuthFormWrapperProps {
  children: React.ReactNode
  title: string
  subtitle?: string
  className?: string
}

export const AuthFormWrapper = ({ children, title, subtitle, className }: AuthFormWrapperProps) => {
  return (
    <div
      className={cn(
        'shadow-input mx-auto w-full max-w-md rounded-2xl bg-white border-[5px] border-brand p-4 md:rounded-2xl md:p-8 dark:bg-black',
        className
      )}
    >
      <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-200">{title}</h2>
      {subtitle && (
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-2 mb-6">{subtitle}</p>
      )}
      {children}
    </div>
  )
}
