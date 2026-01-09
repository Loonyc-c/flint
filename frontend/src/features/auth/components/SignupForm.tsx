'use client'

import { useState } from 'react'
import { useRouter } from '@/i18n/routing'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'react-toastify'
import { signup } from '@/features/auth/api/auth'
import { type SignupFormData, signupSchema } from '@shared/validations'
import { ApiError } from '@/lib/api-client'
import GoogleAuthButton from './GoogleAuthButton'
import { AuthFormWrapper } from './AuthFormWrapper'
import { FormInput } from '@/components/ui/form-input'
import { BottomGradient } from '@/utils'

// =============================================================================
// Types
// =============================================================================

interface SignupFormProps {
  onSuccess?: () => void
}

// =============================================================================
// Component
// =============================================================================

const SignupForm = ({ onSuccess }: SignupFormProps) => {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema)
  })

  const onSubmit = async (data: SignupFormData) => {
    setIsLoading(true)

    try {
      await signup(data)
      toast.success('Account created successfully!')
      if (onSuccess) {
        onSuccess()
      } else {
        router.push('/auth')
      }
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

  return (
    <AuthFormWrapper title="Welcome to Flint">
      <form className="my-8" onSubmit={handleSubmit(onSubmit)}>
        <div className="mb-4 flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-2">
          <FormInput
            id="signup-firstname"
            label="First name"
            placeholder="Tyler"
            type="text"
            error={errors.firstName}
            disabled={isLoading}
            {...register('firstName')}
          />
          <FormInput
            id="signup-lastname"
            label="Last name"
            placeholder="Durden"
            type="text"
            error={errors.lastName}
            disabled={isLoading}
            {...register('lastName')}
          />
        </div>
        <FormInput
          id="signup-email"
          label="Email Address"
          placeholder="projectmayhem@fc.com"
          type="email"
          error={errors.email}
          disabled={isLoading}
          {...register('email')}
          containerClassName="mb-4"
        />
        <FormInput
          id="signup-password"
          label="Password"
          placeholder="••••••••"
          type="password"
          error={errors.password}
          disabled={isLoading}
          {...register('password')}
          containerClassName="mb-4"
        />
        <button
          className="group/btn relative block h-10 w-full rounded-md bg-linear-to-br from-brand-400 to-brand font-medium text-white shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] dark:bg-zinc-800 dark:from-zinc-900 dark:to-zinc-900 dark:shadow-[0px_1px_0px_0px_#27272a_inset,0px_-1px_0px_0px_#27272a_inset] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? 'Signing up...' : 'Sign up →'}
          <BottomGradient />
        </button>
        <div className="bg-linear-to-r from-transparent via-neutral-300 dark:via-neutral-700 to-transparent my-8 h-px w-full" />

        <GoogleAuthButton />
      </form>
    </AuthFormWrapper>
  )
}

export default SignupForm
