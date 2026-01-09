'use client'

/**
 * Placeholder component for subscription page redirect.
 * Currently displays a loading spinner.
 */
const SubscriptionRedirect = () => (
  <div className="flex items-center justify-center min-h-100">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-[#B33A2E] mx-auto mb-4" />
      <p className="text-gray-600">Redirecting to subscription page...</p>
    </div>
  </div>
)

export default SubscriptionRedirect
