'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { signup } from '@/src/lib/api/auth'
import { SignupFormData, signupSchema } from '@/src/lib/validations/auth'
import { ApiError } from '@/src/lib/api-client'
import { toast } from 'react-toastify'
import { cn } from '@/lib/utils'
import GoogleAuthButton from './GoogleAuthButton'

const BottomGradient = () => {
  return (
    <>
      <span className="group-hover/btn:opacity-100 transition duration-500 opacity-0 absolute h-px w-full -bottom-px inset-x-0 bg-gradient-to-r from-transparent via-cyan-500 to-transparent" />
      <span className="group-hover/btn:opacity-100 blur-sm transition duration-500 opacity-0 absolute h-px w-1/2 mx-auto -bottom-px inset-x-10 bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />
    </>
  )
}

const LabelInputContainer = ({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) => {
  return (
    <div className={cn('flex flex-col space-y-2 w-full', className)}>
      {children}
    </div>
  )
}

interface SignupFormProps {
  onSuccess?: () => void
}

export default function SignupForm({ onSuccess }: SignupFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  })

  const onSubmit = async (data: SignupFormData) => {
    setIsLoading(true)

    try {
      const response = await signup(data)
      console.log('Signup successful:', response)
      toast.success('Account created successfully!')
      if (onSuccess) {
        onSuccess()
      } else {
        router.push('/auth')
      }
    } catch (err) {
      console.error('Signup error:', err)
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
      <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-200">
        Welcome to Flint
      </h2>
      <form className="my-8" onSubmit={handleSubmit(onSubmit)}>
        <div className="mb-4 flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-2">
          <LabelInputContainer>
            <Label htmlFor="signup-firstname">First name</Label>
            <Input
              id="signup-firstname"
              placeholder="Tyler"
              type="text"
              {...register('firstName')}
              disabled={isLoading}
              aria-invalid={errors.firstName ? 'true' : 'false'}
            />
            {errors.firstName && (
              <p className="text-sm text-destructive mt-1" role="alert">
                {errors.firstName.message}
              </p>
            )}
          </LabelInputContainer>
          <LabelInputContainer>
            <Label htmlFor="signup-lastname">Last name</Label>
            <Input
              id="signup-lastname"
              placeholder="Durden"
              type="text"
              {...register('lastName')}
              disabled={isLoading}
              aria-invalid={errors.lastName ? 'true' : 'false'}
            />
            {errors.lastName && (
              <p className="text-sm text-destructive mt-1" role="alert">
                {errors.lastName.message}
              </p>
            )}
          </LabelInputContainer>
        </div>
        <LabelInputContainer className="mb-4">
          <Label htmlFor="signup-email">Email Address</Label>
          <Input
            id="signup-email"
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
          <Label htmlFor="signup-password">Password</Label>
          <Input
            id="signup-password"
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
        <button
          className="group/btn relative block h-10 w-full rounded-md bg-linear-to-br from-brand-400 to-brand font-medium text-white shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] dark:bg-zinc-800 dark:from-zinc-900 dark:to-zinc-900 dark:shadow-[0px_1px_0px_0px_#27272a_inset,0px_-1px_0px_0px_#27272a_inset] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? 'Signing up...' : 'Sign up →'}
          <BottomGradient />
        </button>
        <div className="bg-gradient-to-r from-transparent via-neutral-300 dark:via-neutral-700 to-transparent my-8 h-[1px] w-full" />

        <GoogleAuthButton />
      </form>
    </div>
  )
}
