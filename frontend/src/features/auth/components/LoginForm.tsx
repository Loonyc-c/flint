'use client'

import { useEffect, useState } from 'react'
import { useRouter, Link } from '@/i18n/routing'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'react-toastify'
import { login } from '@/features/auth/api/auth'
import { type LoginFormData, loginSchema } from '@shared/validations'
import { ApiError } from '@/lib/api-client'
import GoogleAuthButton from './GoogleAuthButton'
import { AuthFormWrapper } from './AuthFormWrapper'
import { FormInput } from '@/components/ui/form-input'
import { AuthButton } from './AuthButton'
import { useUser } from '../context/UserContext'
import { useTranslations } from 'next-intl'

// =============================================================================
// Types
// =============================================================================

interface LoginFormProps {
  onSuccess?: () => void
}

// =============================================================================
// Component
// =============================================================================

const LoginForm = ({ onSuccess }: LoginFormProps) => {
  const t = useTranslations('auth.login')
  const tc = useTranslations('common')
  const router = useRouter()
  const { login: setAuthToken } = useUser()
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema)
  })

  // Watch for authentication state change to redirect safely
  const { isAuthenticated } = useUser()
  useEffect(() => {
    if (isAuthenticated && !onSuccess) {
      router.replace('/home')
    }
  }, [isAuthenticated, router, onSuccess])

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)

    try {
      const { accessToken } = await login(data)
      setAuthToken(accessToken)

      toast.success(t('success'))
      if (onSuccess) {
        onSuccess()
      }
      // Redirection handled by useEffect above or AuthGuard
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
        <FormInput
          id="login-email"
          label={t('emailLabel')}
          placeholder={t('emailPlaceholder')}
          type="email"
          error={errors.email}
          disabled={isLoading}
          {...register('email')}
          containerClassName="mb-4"
        />
        <FormInput
          id="login-password"
          label={t('passwordLabel')}
          placeholder={t('passwordPlaceholder')}
          type="password"
          error={errors.password}
          disabled={isLoading}
          {...register('password')}
          containerClassName="mb-4"
        />

        <div className="mb-4 text-right">
          <Link
            href="/auth/forget-password"
            className="text-sm text-brand hover:text-brand-200 font-medium cursor-pointer"
          >
            {t('forgotPassword')}
          </Link>
        </div>

        <AuthButton type="submit" isLoading={isLoading} loadingText={t('loading')}>
          {t('button')}
        </AuthButton>

        <div className="bg-linear-to-r from-transparent via-neutral-300 dark:via-neutral-700 to-transparent my-8 h-px w-full" />

        <GoogleAuthButton />
      </form>
    </AuthFormWrapper>
  )
}

export default LoginForm
