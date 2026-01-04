'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { requestForgetPassword } from '@/src/lib/api/auth'
import { ForgetPasswordFormData, forgetPasswordSchema } from '@/src/lib/validations/auth'
import { ApiError } from '@/src/lib/api-client'
import { toast } from 'react-toastify'
import Link from 'next/link'
import { BottomGradient, LabelInputContainer } from '@/src/utils'

const ForgetPasswordForm = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues
  } = useForm<ForgetPasswordFormData>({
    resolver: zodResolver(forgetPasswordSchema)
  })

  const onSubmit = async (data: ForgetPasswordFormData) => {
    setIsLoading(true)

    try {
      await requestForgetPassword(data)
      setEmailSent(true)
      toast.success('Password reset email sent! Check your inbox.')
    } catch (err) {
      console.error('Password reset request error:', err)
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

  if (emailSent) {
    return (
      <div className="shadow-input mx-auto w-full max-w-md rounded-2xl bg-white border-[5px] border-brand p-4 md:rounded-2xl md:p-8 dark:bg-black">
        <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-200 mb-4">
          Check Your Email
        </h2>
        <div className="my-8 text-center">
          <p className="text-neutral-600 dark:text-neutral-400 mb-4">
            If an account exists with <strong>{getValues('email')}</strong>, you will receive a
            password reset link shortly.
          </p>
          <p className="text-sm text-neutral-500 dark:text-neutral-500 mb-6">
            Didn't receive the email? Check your spam folder or try again.
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

  return (
    <div className="shadow-input mx-auto w-full max-w-md rounded-2xl bg-white border-[5px] border-brand p-4 md:rounded-2xl md:p-8 dark:bg-black">
      <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-200">Forgot Password?</h2>
      <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-2 mb-6">
        No worries! Enter your email and we'll send you a reset link.
      </p>
      <form className="my-8" onSubmit={handleSubmit(onSubmit)}>
        <LabelInputContainer className="mb-4">
          <Label htmlFor="forget-email">Email Address</Label>
          <Input
            id="forget-email"
            placeholder="projectmayhem@fc.com"
            type="email"
            {...register('email')}
            disabled={isLoading}
            aria-invalid={errors.email ? 'true' : 'false'}
          />
          {errors.email && (
            <p className="text-sm text-destructive mt-1" role="alert">
              {errors.email.message}
            </p>
          )}
        </LabelInputContainer>

        <button
          className="group/btn relative block h-10 w-full rounded-md bg-linear-to-br from-brand-400 to-brand font-medium text-white shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] dark:bg-zinc-800 dark:from-zinc-900 dark:to-zinc-900 dark:shadow-[0px_1px_0px_0px_#27272a_inset,0px_-1px_0px_0px_#27272a_inset] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? 'Sending...' : 'Send Reset Link →'}
          <BottomGradient />
        </button>
      </form>

      <div className="text-center">
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

export default ForgetPasswordForm
