'use client'

import LoginForm from '@/features/auth/components/LoginForm'
import SignupForm from '@/features/auth/components/SignupForm'
import { Tabs } from '@/components/ui/tabs'
import AuthHeader from '@/features/auth/components/AuthHeader'

/**
 * Authentication page with login and signup tabs.
 */
const AuthPage = () => {
  const tabs = [
    {
      title: 'Login',
      value: 'Login',
      content: <LoginForm />
    },
    {
      title: 'SignUp',
      value: 'SignUp',
      content: <SignupForm />
    }
  ]

  return (
    <>
      <AuthHeader />
      <div className="px-4 py-8 sm:p-10 flex justify-center items-center min-h-[calc(100dvh-5rem)]">
        <div className="perspective-[1000px] relative flex flex-col max-w-5xl justify-center items-center w-full">
          <Tabs tabs={tabs} />
        </div>
      </div>
    </>
  )
}

export default AuthPage
