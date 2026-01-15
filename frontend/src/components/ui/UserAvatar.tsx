'use client'

import Image from 'next/image'
import { User as UserIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

// =============================================================================
// Types
// =============================================================================

interface UserAvatarProps {
  src?: string | null
  name?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  className?: string
  border?: boolean
}

// =============================================================================
// Constants
// =============================================================================

const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-xl',
  '2xl': 'h-32 w-32 text-4xl',
}

const iconSizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-7 w-7',
  xl: 'h-10 w-10',
  '2xl': 'h-20 w-20',
}

// =============================================================================
// Component
// =============================================================================

/**
 * Reusable Avatar component with fallback logic:
 * 1. Image URL (Cloudinary/S3)
 * 2. First Initial of Name
 * 3. Default User Icon
 */
export const UserAvatar = ({
  src,
  name,
  size = 'md',
  className,
  border = false,
}: UserAvatarProps) => {
  const initial = name ? name.trim().charAt(0).toUpperCase() : null

  return (
    <div
      className={cn(
        'relative rounded-full overflow-hidden flex items-center justify-center shrink-0 transition-all',
        sizeClasses[size],
        border && 'border-2 border-brand',
        !src && 'bg-brand/10',
        className
      )}
    >
      {src ? (
        <Image
          src={src}
          alt={name || 'User avatar'}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      ) : initial ? (
        <div className="w-full h-full bg-gradient-to-br from-brand to-brand-300 flex items-center justify-center">
          <span className="font-bold text-white leading-none">
            {initial}
          </span>
        </div>
      ) : (
        <UserIcon className={cn('text-brand', iconSizeClasses[size])} />
      )}
    </div>
  )
}
