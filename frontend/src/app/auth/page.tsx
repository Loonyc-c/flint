'use client'

import LoginForm from '@/src/components/auth/LoginForm'
import SignupForm from '@/src/components/auth/SignupForm'
import { Tabs } from '@/src/components/ui/tabs'
import AuthHeader from '@/src/components/auth/AuthHeader'

export default function AuthPage() {
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
  // Todo Google authentication

  return (
    <>
      <AuthHeader />
      <div className="p-10 flex justify-center items-center h-fit">
        <div className="perspective-[1000px] relative flex flex-col max-w-5xl justify-center items-center w-full">
          <Tabs tabs={tabs} />
        </div>
      </div>
    </>
  )
}
