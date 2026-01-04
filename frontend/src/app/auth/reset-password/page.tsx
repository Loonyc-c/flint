'use client'

import ResetPasswordForm from '@/src/components/auth/ResetPasswordForm'
import AuthHeader from '@/src/components/auth/AuthHeader'

export default function ResetPasswordPage() {
  return (
    <>
      <AuthHeader />
      <div className="p-10 flex justify-center items-center h-fit">
        <div className="perspective-[1000px] relative flex flex-col max-w-5xl justify-center items-center w-full">
          <ResetPasswordForm />
        </div>
      </div>
    </>
  )
}
