'use client'

import { GoogleOAuthProvider } from '@react-oauth/google'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { UserProvider } from '@/features/auth/context/UserContext'
import { AuthGuard } from '@/components/auth/AuthGuard'

export const Providers = ({ children }: { children: React.ReactNode }) => {
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
  if (!googleClientId) {
    throw new Error('NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set in environment variables')
  }

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <UserProvider>
        {/* AuthGuard wraps children to enforce route protection */}
        <AuthGuard>
          {children}
        </AuthGuard>
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
      </UserProvider>
    </GoogleOAuthProvider>
  )
}
