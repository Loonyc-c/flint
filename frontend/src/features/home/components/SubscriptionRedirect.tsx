'use client'

import { LoadingSpinner } from '@/components/ui/loading-spinner'

/**
 * Placeholder component for subscription page redirect.
 * Currently displays a loading spinner.
 */
const SubscriptionRedirect = () => (
  <LoadingSpinner text="Redirecting to subscription page..." fullScreen={false} />
)
export default SubscriptionRedirect
