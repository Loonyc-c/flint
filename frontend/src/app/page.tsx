'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Root Page
 *
 * This page redirects authenticated users to /home.
 * Unauthenticated users will be redirected to /auth by the AuthGuard.
 */
const RootPage = () => {
  const router = useRouter()

  useEffect(() => {
    // Redirect to home page for authenticated users
    // The AuthGuard handles the redirect to /auth for unauthenticated users
    router.replace('/home')
  }, [router])

  // Show loading state while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-black">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-4 border-neutral-200 dark:border-neutral-800" />
          <div className="absolute top-0 left-0 w-12 h-12 rounded-full border-4 border-transparent border-t-brand animate-spin" />
        </div>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 animate-pulse">Loading...</p>
      </div>
    </div>
  )
}

export default RootPage
