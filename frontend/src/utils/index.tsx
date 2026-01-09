import { cn } from '@/lib/utils'

// =============================================================================
// Types
// =============================================================================

interface LabelInputContainerProps {
  children: React.ReactNode
  className?: string
}

// =============================================================================
// Form Components
// =============================================================================

/**
 * Container component for form labels and inputs.
 * Provides consistent spacing and layout.
 */
export const LabelInputContainer = ({ children, className }: LabelInputContainerProps) => (
  <div className={cn('flex w-full flex-col space-y-2', className)}>{children}</div>
)

/**
 * Decorative gradient element for buttons.
 * Creates a hover effect with brand colors.
 */
export const BottomGradient = () => (
  <>
    <span className="absolute inset-x-0 -bottom-px block h-px w-full bg-linear-to-r from-transparent via-brand to-transparent opacity-0 transition duration-500 group-hover/btn:opacity-100" />
    <span className="absolute inset-x-10 -bottom-px mx-auto block h-px w-1/2 bg-linear-to-r from-transparent via-brand-300 to-transparent opacity-0 blur-sm transition duration-500 group-hover/btn:opacity-100" />
  </>
)
