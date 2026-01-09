import { SwipeFeature } from '@/features/swipe/components/SwipeFeature'

/**
 * Swipe page for discovering and matching with other users.
 */
const SwipePage = () => (
  <main className="min-h-screen bg-gray-50 dark:bg-black py-8">
    <div className="container mx-auto">
      <h1 className="text-3xl font-bold text-center mb-8 text-gray-900 dark:text-white">
        Discover New People
      </h1>
      <SwipeFeature />
    </div>
  </main>
)

export default SwipePage
