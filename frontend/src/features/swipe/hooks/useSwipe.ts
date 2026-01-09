import { useState, useCallback, useEffect } from 'react'
import { type User, type InteractionType } from '@shared/types'
import { getCandidates, swipe } from '../api/swipe'
import { useUser } from '@/features/auth/context/UserContext'

// =============================================================================
// Types
// =============================================================================

interface UseSwipeReturn {
  candidates: User[]
  nextCandidate: User | undefined
  isLoading: boolean
  handleSwipe: (targetId: string, type: InteractionType) => Promise<void>
  fetchCandidates: () => Promise<void>
  hasMore: boolean
}

// =============================================================================
// Hook
// =============================================================================

/**
 * Hook for managing the swipe feature state and actions.
 * Handles fetching candidates and recording swipe interactions.
 */
export const useSwipe = (): UseSwipeReturn => {
  const { user } = useUser()
  const [candidates, setCandidates] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)

  /**
   * Fetches new candidate profiles from the API.
   */
  const fetchCandidates = useCallback(async () => {
    if (!user?.id) return

    setIsLoading(true)
    try {
      const data = await getCandidates(user.id)
      setCandidates(data)
      setCurrentIndex(0)
    } catch {
      // Error handling is done via the API client
    } finally {
      setIsLoading(false)
    }
  }, [user?.id])

  // Fetch candidates on mount and when user changes
  useEffect(() => {
    fetchCandidates()
  }, [fetchCandidates])

  /**
   * Records a swipe interaction and advances to the next candidate.
   */
  const handleSwipe = useCallback(
    async (targetId: string, type: InteractionType) => {
      if (!user?.id) return

      await swipe(user.id, { targetId, type })
      setCurrentIndex(prev => prev + 1)
    },
    [user?.id]
  )

  const nextCandidate = candidates[currentIndex]
  const hasMore = currentIndex < candidates.length

  return {
    candidates,
    nextCandidate,
    isLoading,
    handleSwipe,
    fetchCandidates,
    hasMore
  }
}
