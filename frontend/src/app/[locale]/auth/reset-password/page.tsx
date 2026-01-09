'use client'

import { Suspense } from 'react'
import ResetPasswordForm from '@/features/auth/components/ResetPasswordForm'
import AuthHeader from '@/features/auth/components/AuthHeader'

const ResetPasswordPage = () => {
  return (
    <>
      <AuthHeader />
      <div className="p-10 flex justify-center items-center h-fit">
        <div className="perspective-[1000px] relative flex flex-col max-w-5xl justify-center items-center w-full">
          <Suspense
            fallback={
              <div className="flex justify-center items-center p-8">
                <div className="text-neutral-600 dark:text-neutral-400">Loading...</div>
              </div>
            }
          >
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </>
  )
}

export default ResetPasswordPage
