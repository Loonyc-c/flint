'use client'

import ForgetPasswordForm from '@/features/auth/components/ForgetPasswordForm'
import AuthHeader from '@/features/auth/components/AuthHeader'

const ForgetPasswordPage = () => {
  return (
    <>
      <AuthHeader />
      <div className="p-10 flex justify-center items-center h-fit">
        <div className="perspective-[1000px] relative flex flex-col max-w-5xl justify-center items-center w-full">
          <ForgetPasswordForm />
        </div>
      </div>
    </>
  )
}

export default ForgetPasswordPage;

