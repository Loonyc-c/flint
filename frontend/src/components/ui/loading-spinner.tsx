import { Loader2 } from 'lucide-react'

// =============================================================================
// Types
// =============================================================================

interface LoadingSpinnerProps {
  /**
   * The text to display below the spinner
   * @default "Loading..."
   */
  text?: string
  /**
   * Size variant for the spinner
   * @default "md"
   */
  size?: 'sm' | 'md' | 'lg'
  /**
   * Whether to display as full-screen centered or inline
   * @default true
   */
  fullScreen?: boolean
  /**
   * Minimum height when not full screen
   * @default "h-[400px]"
   */
  minHeight?: string
}

// =============================================================================
// Component
// =============================================================================

/**
 * Generic loading spinner component for consistent loading states across the app.
 * Supports customizable text, sizes, and layout options.
 *
 * @example
 * ```tsx
 * // Full-screen loading
 * <LoadingSpinner text="Loading profile..." />
 *
 * // Inline loading with custom size
 * <LoadingSpinner text="Fetching data..." size="sm" fullScreen={false} />
 * ```
 */
export const LoadingSpinner = ({
  text = 'Loading...',
  size = 'md',
  fullScreen = true,
  minHeight = 'min-h-[400px]'
}: LoadingSpinnerProps) => {
  // Size configurations
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16'
  }

  const containerClasses = fullScreen
    ? 'min-h-[calc(100vh-5rem)] flex items-center justify-center bg-background'
    : `flex items-center justify-center ${minHeight}`

  return (
    <div className={containerClasses}>
      <div className="flex flex-col items-center gap-4">
        <Loader2 className={`${sizeClasses[size]} text-brand animate-spin`} />
        {text && <p className="text-sm font-medium text-muted-foreground animate-pulse">{text}</p>}
      </div>
    </div>
  )
}

export default LoadingSpinner
