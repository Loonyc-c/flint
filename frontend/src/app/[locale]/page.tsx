'use client'

import { useEffect } from 'react'
import { useRouter } from '@/i18n/routing'
import { useTranslations } from 'next-intl'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

/**
 * Root page that redirects users appropriately.
 * Authenticated users go to /home, unauthenticated users are handled by AuthGuard.
 */
const RootPage = () => {
  const router = useRouter()
  const t = useTranslations('HomePage')

  useEffect(() => {
    router.replace('/home')
  }, [router])

  return <LoadingSpinner text={t('loading')} />
}

export default RootPage
