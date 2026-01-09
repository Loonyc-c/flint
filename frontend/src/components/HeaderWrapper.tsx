'use client'

import { usePathname } from 'next/navigation'
import MainHeader from './header'

/**
 * Conditionally renders the main header based on the current route.
 * Hides the header on authentication pages.
 */
export const HeaderWrapper = () => {
  const pathname = usePathname()

  // Extract locale-independent path for comparison
  const isAuthPage = pathname.includes('/auth')

  if (isAuthPage) {
    return null
  }

  return <MainHeader />
}
