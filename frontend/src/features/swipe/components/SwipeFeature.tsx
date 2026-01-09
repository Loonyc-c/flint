'use client'

import { InteractionType } from '@shared/types'
import { Loader2 } from 'lucide-react'
import { useSwipe } from '../hooks/useSwipe'
import { SwipeCard } from './SwipeCard'

// =============================================================================
// Sub-Components
// =============================================================================

const LoadingState = () => (
  <div className="flex items-center justify-center min-h-[600px]">
    <Loader2 className="w-12 h-12 animate-spin text-brand" />
  </div>
)

interface EmptyStateProps {
  onRefresh: () => void
}

const EmptyState = ({ onRefresh }: EmptyStateProps) => (
  <div className="flex flex-col items-center justify-center min-h-[600px] text-center p-8">
    <h2 className="text-2xl font-bold mb-4">No more candidates!</h2>
    <p className="text-gray-600 mb-8">Try adjusting your preferences or come back later.</p>
    <button
      onClick={onRefresh}
      className="px-6 py-2 bg-brand text-white rounded-full hover:bg-brand-400 transition-colors cursor-pointer"
    >
      Refresh
    </button>
  </div>
)

// =============================================================================
// Main Component
// =============================================================================

/**
 * Main swipe feature component that orchestrates the swiping experience.
 * Handles loading states, empty states, and renders swipe cards.
 */
export const SwipeFeature = () => {
  const { nextCandidate, isLoading, handleSwipe, hasMore, fetchCandidates } = useSwipe()

  const handleSwipeWrapper = async (targetId: string, type: InteractionType): Promise<void> => {
    await handleSwipe(targetId, type)
  }

  if (isLoading && !nextCandidate) {
    return <LoadingState />
  }

  if (!hasMore && !isLoading) {
    return <EmptyState onRefresh={fetchCandidates} />
  }

  return (
    <div className="flex justify-center p-4">
      {nextCandidate && (
        <SwipeCard key={nextCandidate.id} candidate={nextCandidate} onSwipe={handleSwipeWrapper} />
      )}
    </div>
  )
}
