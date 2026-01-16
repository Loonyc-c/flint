'use client'

import * as React from 'react'
import { type FieldError } from 'react-hook-form'
import { Label } from './label'
import { Input } from './input'
import { LabelInputContainer } from '@/utils'
import { cn } from '@/lib/utils'

// =============================================================================
// Types
// =============================================================================

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: React.ReactNode
  error?: FieldError
  containerClassName?: string
}

// =============================================================================
// Component
// =============================================================================

/**
 * Form input component with label, error handling, and consistent styling.
 * Integrates with react-hook-form for validation.
 */
export const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, error, containerClassName, id, ...props }, ref) => (
    <LabelInputContainer className={containerClassName}>
      <Label htmlFor={id} className={cn(error && 'text-destructive')}>
        {label}
      </Label>
      <Input
        id={id}
        ref={ref}
        className={cn(error && 'border-destructive focus-visible:ring-destructive/20')}
        {...props}
      />
      {error && (
        <p className="text-sm text-destructive mt-1" role="alert">
          {error.message}
        </p>
      )}
    </LabelInputContainer>
  )
)

FormInput.displayName = 'FormInput'
