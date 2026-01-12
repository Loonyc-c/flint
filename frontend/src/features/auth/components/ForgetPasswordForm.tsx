'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from '@/i18n/routing'
import { toast } from 'react-toastify'
import { requestForgetPassword } from '@/features/auth/api/auth'
import { type ForgetPasswordFormData, forgetPasswordSchema } from '@shared/validations'
import { ApiError } from '@/lib/api-client'
import { AuthFormWrapper } from './AuthFormWrapper'
import { FormInput } from '@/components/ui/form-input'
import { BottomGradient } from '@/utils'
import { useTranslations } from 'next-intl'

// =============================================================================
// Sub-Components
// =============================================================================

interface EmailSentViewProps {
  email: string
}

const EmailSentView = ({ email }: EmailSentViewProps) => {
  const t = useTranslations('auth.forgetPassword')
  return (
    <AuthFormWrapper title={t('sentTitle')}>
      <div className="my-8 text-center">
        <p className="text-neutral-600 dark:text-neutral-400 mb-4">
          {t.rich('sentMessage', {
            email: (chunks) => <strong>{email}</strong>
          })}
        </p>
        <p className="text-sm text-neutral-500 dark:text-neutral-500 mb-6">
          {t('sentSpam')}
        </p>
        <Link
          href="/auth"
          className="text-sm text-brand hover:text-brand-200 font-medium cursor-pointer inline-block"
        >
          {t('backToLogin')}
        </Link>
      </div>
    </AuthFormWrapper>
  )
}

// =============================================================================
// Main Component
// =============================================================================

const ForgetPasswordForm = () => {
  const t = useTranslations('auth.forgetPassword')
  const tc = useTranslations('common')
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
      toast.success(t('success'))
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

  if (emailSent) {
    return <EmailSentView email={getValues('email')} />
  }

  return (
    <AuthFormWrapper
      title={t('title')}
      subtitle={t('subtitle')}
    >
      <form className="my-8" onSubmit={handleSubmit(onSubmit)}>
        <FormInput
          id="forget-email"
          label={t('emailLabel')}
          placeholder={t('emailPlaceholder')}
          type="email"
          error={errors.email}
          disabled={isLoading}
          {...register('email')}
          containerClassName="mb-4"
        />

        <button
          className="group/btn relative block h-10 w-full rounded-md bg-linear-to-br from-brand-400 to-brand font-medium text-white shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] dark:bg-zinc-800 dark:from-zinc-900 dark:to-zinc-900 dark:shadow-[0px_1px_0px_0px_#27272a_inset,0px_-1px_0px_0px_#27272a_inset] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? t('loading') : t('button')}
          <BottomGradient />
        </button>
      </form>

      <div className="text-center">
        <Link
          href="/auth"
          className="text-sm text-brand hover:text-brand-200 font-medium cursor-pointer"
        >
          {t('backToLogin')}
        </Link>
      </div>
    </AuthFormWrapper>
  )
}

export default ForgetPasswordForm
