'use client'

import { GoogleLogin } from '@react-oauth/google'
import { loginWithGoogle } from '@/features/auth/api/auth'
import { toast } from 'react-toastify'
import { ApiError } from '@/lib/api-client'
import { useRouter } from 'next/navigation'
import { BottomGradient } from '@/utils'
import { useUser } from '../context/UserContext'

const GoogleAuthButton = () => {
  const router = useRouter()
  const { login: setAuthToken } = useUser()

  return (
    <div className="relative group/btn flex space-x-2 items-center justify-center px-4 w-full text-black rounded-md h-10 font-medium shadow-input bg-gray-50 dark:bg-zinc-900 dark:shadow-[0px_0px_1px_1px_var(--neutral-800)]">
      <GoogleLogin
        onSuccess={async credentialResponse => {
          try {
            const idToken = credentialResponse.credential
            if (!idToken) {
              toast.error('Google login failed: missing ID token.')
              return
            }
            const { accessToken } = await loginWithGoogle(idToken)
            setAuthToken(accessToken)
            toast.success('Logged in successfully!')
            router.push('/home')
          } catch (err) {
            if (err instanceof ApiError) {
              toast.error(err.message)
            } else {
              toast.error('An unexpected error occurred during Google login.')
            }
          }
        }}
        onError={() => {
          toast.error('Google login failed. Please try again.')
        }}
      />
      <BottomGradient />
    </div>
  )
}

export default GoogleAuthButton
