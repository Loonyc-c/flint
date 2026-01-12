'use client'

import { Suspense } from 'react'
import ResetPasswordForm from '@/features/auth/components/ResetPasswordForm'
import AuthHeader from '@/features/auth/components/AuthHeader'

/**
 * Loading fallback for the reset password form.
 */
const FormFallback = () => (
  <div className="flex justify-center items-center p-8">
    <div className="text-neutral-600 dark:text-neutral-400">Loading...</div>
  </div>
)

/**
 * Reset password page for completing password reset with token.
 */
const ResetPasswordPage = () => (
  <>
    <AuthHeader />
    <div className="px-4 py-8 sm:p-10 flex justify-center items-center min-h-[calc(100dvh-5rem)]">
      <div className="perspective-[1000px] relative flex flex-col max-w-5xl justify-center items-center w-full">
        <Suspense fallback={<FormFallback />}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  </>
)

export default ResetPasswordPage
