'use client'

import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useTranslations } from 'next-intl'

/**
 * Placeholder component for subscription page redirect.
 * Currently displays a loading spinner.
 */
const SubscriptionRedirect = () => {
  const t = useTranslations('home.subscription')
  return <LoadingSpinner text={t('redirecting')} fullScreen={false} />
}
export default SubscriptionRedirect
