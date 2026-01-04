'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { resetPassword } from '@/src/lib/api/auth'
import { ResetPasswordFormData, resetPasswordSchema } from '@/src/lib/validations/auth'
import { ApiError } from '@/src/lib/api-client'
import { toast } from 'react-toastify'
import Link from 'next/link'
import { BottomGradient, LabelInputContainer } from '@/src/utils'

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
      await resetPassword(token, data.password, data.confirmPassword)
      setPasswordResetSuccess(true)
      toast.success('Your password has been reset successfully!')
    } catch (err) {
      console.error('Password reset error:', err)
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
    return (
      <div className="shadow-input mx-auto w-full max-w-md rounded-2xl bg-white border-[5px] border-brand p-4 md:rounded-2xl md:p-8 dark:bg-black">
        <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-200 mb-4">
          Password Reset Successful!
        </h2>
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
      </div>
    )
  }

  if (!token) {
    return (
      <div className="shadow-input mx-auto w-full max-w-md rounded-2xl bg-white border-[5px] border-brand p-4 md:rounded-2xl md:p-8 dark:bg-black">
        <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-200 mb-4">
          Invalid or Missing Token
        </h2>
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
      </div>
    )
  }

  return (
    <div className="shadow-input mx-auto w-full max-w-md rounded-2xl bg-white border-[5px] border-brand p-4 md:rounded-2xl md:p-8 dark:bg-black">
      <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-200">
        Reset Your Password
      </h2>
      <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-2 mb-6">
        Enter your new password below.
      </p>
      <form className="my-8" onSubmit={handleSubmit(onSubmit)}>
        <LabelInputContainer className="mb-4">
          <Label htmlFor="password">New Password</Label>
          <Input
            id="password"
            placeholder="••••••••"
            type="password"
            {...register('password')}
            disabled={isLoading}
            aria-invalid={errors.password ? 'true' : 'false'}
          />
          {errors.password && (
            <p className="text-sm text-destructive mt-1" role="alert">
              {errors.password.message}
            </p>
          )}
        </LabelInputContainer>
        <LabelInputContainer className="mb-8">
          <Label htmlFor="confirmPassword">Confirm New Password</Label>
          <Input
            id="confirmPassword"
            placeholder="••••••••"
            type="password"
            {...register('confirmPassword')}
            disabled={isLoading}
            aria-invalid={errors.confirmPassword ? 'true' : 'false'}
          />
          {errors.confirmPassword && (
            <p className="text-sm text-destructive mt-1" role="alert">
              {errors.confirmPassword.message}
            </p>
          )}
        </LabelInputContainer>

        <button
          className="group/btn relative block h-10 w-full rounded-md bg-linear-to-br from-brand-400 to-brand font-medium text-white shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] dark:bg-zinc-800 dark:from-zinc-900 dark:to-zinc-900 dark:shadow-[0px_1px_0px_0px_#27272a_inset,0px_-1px_0px_0px_#27272a_inset] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? 'Resetting...' : 'Reset Password →'}
          <BottomGradient />
        </button>
      </form>

      <div className="text-center mt-4">
        <Link
          href="/auth"
          className="text-sm text-brand hover:text-brand-200 font-medium cursor-pointer"
        >
          ← Back to Login
        </Link>
      </div>
    </div>
  )
}

export default ResetPasswordForm
