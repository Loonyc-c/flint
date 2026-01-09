'use client'

import { usePathname } from 'next/navigation'
import MainHeader from './header'

export const HeaderWrapper = () => {
  const pathname = usePathname()
  
  // Don't show header on auth pages
  if (pathname.startsWith('/auth')) {
    return null
  }

  return <MainHeader />
}
