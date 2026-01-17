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
import { AuthButton } from './AuthButton'
import { useTranslations } from 'next-intl'

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
  const t = useTranslations('auth.signup')
  const tc = useTranslations('common')
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
      toast.success(t('success'))
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
        toast.error(tc('error'))
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthFormWrapper title={t('title')}>
      <form className="my-8" onSubmit={handleSubmit(onSubmit)}>
        <div className="mb-4 flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-2">
          <FormInput
            id="signup-firstname"
            label={t('firstNameLabel')}
            placeholder={t('firstNamePlaceholder')}
            type="text"
            error={errors.firstName}
            disabled={isLoading}
            {...register('firstName')}
          />
          <FormInput
            id="signup-lastname"
            label={t('lastNameLabel')}
            placeholder={t('lastNamePlaceholder')}
            type="text"
            error={errors.lastName}
            disabled={isLoading}
            {...register('lastName')}
          />
        </div>
        <FormInput
          id="signup-email"
          label={t('emailLabel')}
          placeholder={t('emailPlaceholder')}
          type="email"
          error={errors.email}
          disabled={isLoading}
          {...register('email')}
          containerClassName="mb-4"
        />
        <FormInput
          id="signup-password"
          label={t('passwordLabel')}
          placeholder={t('passwordPlaceholder')}
          type="password"
          error={errors.password}
          disabled={isLoading}
          {...register('password')}
          containerClassName="mb-4"
        />
        <AuthButton type="submit" isLoading={isLoading} loadingText={t('loading')}>
          {t('button')}
        </AuthButton>
        <div className="bg-linear-to-r from-transparent via-neutral-300 dark:via-neutral-700 to-transparent my-8 h-px w-full" />

        <GoogleAuthButton />
      </form>
    </AuthFormWrapper>
  )
}

export default SignupForm
