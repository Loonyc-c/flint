'use client'

import { cn } from '@/lib/utils'
import { BottomGradient } from '@/utils'

interface AuthButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    isLoading?: boolean
    loadingText?: string
    children: React.ReactNode
}

export const AuthButton = ({
    className,
    isLoading,
    loadingText,
    children,
    ...props
}: AuthButtonProps) => {
    return (
        <button
            className={cn(
                "group/btn relative block h-10 w-full rounded-md font-medium text-white shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all",
                "bg-linear-to-br from-brand-400 to-brand",
                "dark:bg-zinc-800 dark:from-zinc-900 dark:to-zinc-900 dark:shadow-[0px_1px_0px_0px_#27272a_inset,0px_-1px_0px_0px_#27272a_inset]",
                className
            )}
            disabled={isLoading || props.disabled}
            {...props}
        >
            {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                    {/* Loader icon could be added here if desired, but text is standard */}
                    {loadingText || children}
                </span>
            ) : children}
            <BottomGradient />
        </button>
    )
}
