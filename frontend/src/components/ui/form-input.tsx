'use client'

import * as React from 'react'
import { Label } from './label'
import { Input } from './input'
import { LabelInputContainer } from '@/utils'
import { FieldError } from 'react-hook-form'
import { cn } from '@/lib/utils'

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: FieldError
  containerClassName?: string
}

export const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, error, containerClassName, id, ...props }, ref) => {
    return (
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
  }
)

FormInput.displayName = 'FormInput'
