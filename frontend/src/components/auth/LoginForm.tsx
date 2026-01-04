'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { login } from '@/src/lib/api/auth'
import { LoginFormData, loginSchema } from '@/src/lib/validations/auth'
import { ApiError } from '@/src/lib/api-client'
import { toast } from 'react-toastify'
import GoogleAuthButton from './GoogleAuthButton'
import { BottomGradient, LabelInputContainer } from '@/src/utils'

interface LoginFormProps {
  onSuccess?: () => void
}

export default function LoginForm({ onSuccess }: LoginFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema)
  })

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)

    try {
      const response = await login(data)
      console.log('Login successful:', response)
      toast.success('Login successful!')
      if (onSuccess) {
        onSuccess()
      } else {
        router.push('/main')
      }
    } catch (err) {
      console.error('Login error:', err)
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

  return (
    <div className="shadow-input mx-auto w-full max-w-md rounded-2xl bg-white border-[5px] border-brand p-4 md:rounded-2xl md:p-8 dark:bg-black">
      <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-200">Log into Flint</h2>
      <form className="my-8" onSubmit={handleSubmit(onSubmit)}>
        <LabelInputContainer className="mb-4">
          <Label htmlFor="login-email">Email Address</Label>
          <Input
            id="login-email"
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
        <LabelInputContainer className="mb-4">
          <Label htmlFor="login-password">Password</Label>
          <Input
            id="login-password"
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

        {/* Forgot Password Link */}
        <div className="mb-4 text-right">
          <Link
            href="/auth/forget-password"
            className="text-sm text-brand hover:text-brand-200 font-medium cursor-pointer"
          >
            Forgot Password?
          </Link>
        </div>

        <button
          className="group/btn relative block h-10 w-full rounded-md bg-linear-to-br from-brand-400 to-brand font-medium text-white shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] dark:bg-zinc-800 dark:from-zinc-900 dark:to-zinc-900 dark:shadow-[0px_1px_0px_0px_#27272a_inset,0px_-1px_0px_0px_#27272a_inset] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? 'Logging in...' : 'Login →'}
          <BottomGradient />
        </button>

        <div className="bg-linear-to-r from-transparent via-neutral-300 dark:via-neutral-700 to-transparent my-8 h-px w-full" />

        <GoogleAuthButton />
      </form>
    </div>
  )
}
