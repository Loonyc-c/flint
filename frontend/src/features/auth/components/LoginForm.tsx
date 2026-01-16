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
import { BottomGradient } from '@/utils'
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

        <button
          className="group/btn relative block h-10 w-full rounded-md bg-linear-to-br from-brand-400 to-brand font-medium text-white shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] dark:bg-zinc-800 dark:from-zinc-900 dark:to-zinc-900 dark:shadow-[0px_1px_0px_0px_#27272a_inset,0px_-1px_0px_0px_#27272a_inset] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? t('loading') : t('button')}
          <BottomGradient />
        </button>

        <div className="bg-linear-to-r from-transparent via-neutral-300 dark:via-neutral-700 to-transparent my-8 h-px w-full" />

        <GoogleAuthButton />
      </form>
    </AuthFormWrapper>
  )
}

export default LoginForm
