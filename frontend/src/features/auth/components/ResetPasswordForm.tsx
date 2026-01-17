'use client'

import { useState } from 'react'
import { Link, useSearchParams } from '@/i18n/routing'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'react-toastify'
import { resetPassword } from '@/features/auth/api/auth'
import { type ResetPasswordFormData, resetPasswordSchema } from '@shared/validations'
import { ApiError } from '@/lib/api-client'
import { AuthFormWrapper } from './AuthFormWrapper'
import { FormInput } from '@/components/ui/form-input'
import { AuthButton } from './AuthButton'

// =============================================================================
// Sub-Components
// =============================================================================

const SuccessView = () => (
  <AuthFormWrapper title="Password Reset Successful!">
    <div className="my-8 text-center">
      <p className="text-neutral-600 dark:text-neutral-400 mb-4">
        Your password has been updated. You can now log in with your new password.
      </p>
      <Link
        href="/auth"
        className="text-sm text-brand hover:text-brand-200 font-medium cursor-pointer inline-block"
      >
        ← Back to Login
      </Link>
    </div>
  </AuthFormWrapper>
)

const InvalidTokenView = () => (
  <AuthFormWrapper title="Invalid or Missing Token">
    <div className="my-8 text-center">
      <p className="text-neutral-600 dark:text-neutral-400 mb-4">
        The password reset link is invalid or has expired. Please request a new one.
      </p>
      <Link
        href="/auth/forget-password"
        className="text-sm text-brand hover:text-brand-200 font-medium cursor-pointer inline-block"
      >
        Request New Reset Link
      </Link>
      <Link
        href="/auth"
        className="text-sm text-brand hover:text-brand-200 font-medium cursor-pointer inline-block mt-4 ml-4"
      >
        ← Back to Login
      </Link>
    </div>
  </AuthFormWrapper>
)

// =============================================================================
// Main Component
// =============================================================================

const ResetPasswordForm = () => {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [isLoading, setIsLoading] = useState(false)
  const [passwordResetSuccess, setPasswordResetSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema)
  })

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) {
      toast.error('Password reset token is missing.')
      return
    }

    setIsLoading(true)

    try {
      await resetPassword(token, {
        password: data.password,
        confirmPassword: data.confirmPassword
      })
      setPasswordResetSuccess(true)
      toast.success('Your password has been reset successfully!')
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message)
      } else if (err instanceof Error) {
        toast.error(err.message)
      } else {
        toast.error('An unexpected error occurred. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (passwordResetSuccess) {
    return <SuccessView />
  }

  if (!token) {
    return <InvalidTokenView />
  }

  return (
    <AuthFormWrapper title="Reset Your Password" subtitle="Enter your new password below.">
      <form className="my-8" onSubmit={handleSubmit(onSubmit)}>
        <FormInput
          id="password"
          label="New Password"
          placeholder="••••••••"
          type="password"
          error={errors.password}
          disabled={isLoading}
          {...register('password')}
          containerClassName="mb-4"
        />
        <FormInput
          id="confirmPassword"
          label="Confirm New Password"
          placeholder="••••••••"
          type="password"
          error={errors.confirmPassword}
          disabled={isLoading}
          {...register('confirmPassword')}
          containerClassName="mb-8"
        />

        <AuthButton type="submit" isLoading={isLoading} loadingText="Resetting...">
          Reset Password →
        </AuthButton>
      </form>

      <div className="text-center mt-4">
        <Link
          href="/auth"
          className="text-sm text-brand hover:text-brand-200 font-medium cursor-pointer"
        >
          ← Back to Login
        </Link>
      </div>
    </AuthFormWrapper>
  )
}

export default ResetPasswordForm
