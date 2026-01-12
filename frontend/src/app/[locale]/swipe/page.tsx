import { DiscoveryHub } from '@/features/swipe/components/hub/DiscoveryHub'

/**
 * Swipe page for discovering and matching with other users.
 * Refactored to use the Unified Discovery Hub.
 */
const SwipePage = () => (
  <main className="bg-white dark:bg-black py-4 md:py-8 px-0 md:px-4">
    <DiscoveryHub />
  </main>
)

export default SwipePage