import { useState, useCallback, useEffect, useRef } from 'react'
import { type User, type SwipeResponse, InteractionType } from '@shared/types'
import { getCandidates, swipe } from '../api/swipe'
import { useUser } from '@/features/auth/context/UserContext'
import { toast } from 'react-toastify'
import { type SwipeAction } from '@shared/types'

// =============================================================================
// Types
// =============================================================================

interface SwipeResult extends SwipeResponse {
  limitReached?: boolean
  limit?: number
  used?: number
}

interface UseSwipeReturn {
  candidates: User[]
  currentCandidate: User | undefined
  isLoading: boolean
  isSwiping: boolean
  handleSwipe: (type: SwipeAction) => Promise<SwipeResult | undefined>
  handleUndo: () => void
  canUndo: boolean
  fetchCandidates: () => Promise<void>
  hasMore: boolean
}

// =============================================================================
// Hook
// =============================================================================

/**
 * Hook for managing the swipe feature state and actions.
 * Handles fetching candidates, recording swipe interactions, and undo history.
 */
export const useSwipe = (): UseSwipeReturn => {
  const { user } = useUser()
  const [candidates, setCandidates] = useState<User[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [isSwiping, setIsSwiping] = useState(false)
  
  // History stack for undo functionality (stores indices)
  const [history, setHistory] = useState<number[]>([])
  
  // Track if initial fetch has been attempted to prevent infinite loops
  const hasFetchedRef = useRef(false)
  // Track loading state in ref to avoid stale closures
  const isLoadingRef = useRef(false)

  /**
   * Fetches new candidate profiles from the API.
   */
  const fetchCandidates = useCallback(async () => {
    if (!user?.id || isLoadingRef.current) return

    isLoadingRef.current = true
    setIsLoading(true)
    try {
      const data = await getCandidates(user.id)
      // Filter out duplicates if any (though backend should handle this)
      setCandidates(prev => {
        const existingIds = new Set(prev.map(c => c.id))
        const newCandidates = data.filter(c => !existingIds.has(c.id))
        return [...prev, ...newCandidates]
      })
    } catch (error) {
      console.error('Failed to fetch candidates:', error)
      toast.error('Could not load new profiles')
    } finally {
      isLoadingRef.current = false
      setIsLoading(false)
    }
  }, [user?.id])

  // Initial fetch - only runs once when user is available
  useEffect(() => {
    if (user?.id && !hasFetchedRef.current) {
      hasFetchedRef.current = true
      fetchCandidates()
    }
  }, [user?.id, fetchCandidates])

  /**
   * Records a swipe interaction and advances to the next candidate.
   * Pass actions are not stored in the database - only smash and super.
   */
  const handleSwipe = useCallback(
    async (type: SwipeAction): Promise<SwipeResult | undefined> => {
      if (!user?.id || isSwiping || !candidates[currentIndex]) return

      const targetId = candidates[currentIndex].id
      setIsSwiping(true)

      try {
        // Pass actions don't need to be recorded - just move to next candidate
        if (type === 'pass') {
          setHistory(prev => [...prev, currentIndex])
          setCurrentIndex(prev => prev + 1)

          if (candidates.length - currentIndex < 5) {
            fetchCandidates()
          }

          return { isMatch: false }
        }

        // Map UI action to InteractionType enum
        const interactionType = type === 'super' ? InteractionType.SUPER : InteractionType.SMASH
        
        const response = await swipe(user.id, { targetId, type: interactionType })
        
        setHistory(prev => [...prev, currentIndex])
        setCurrentIndex(prev => prev + 1)

        if (candidates.length - currentIndex < 5) {
          fetchCandidates()
        }

        return response as SwipeResult
      } catch (error: unknown) {
        toast.error('Swipe failed. Please try again.')
        console.error(error)
      } finally {
        setIsSwiping(false)
      }
    },
    [user?.id, candidates, currentIndex, isSwiping, fetchCandidates]
  )

  /**
   * Undoes the last swipe action.
   * Note: This currently only reverts the UI state. 
   * A real undo would need an API call to delete the interaction.
   */
  const handleUndo = useCallback(() => {
    if (history.length === 0 || isSwiping) return

    const prevIndex = history[history.length - 1]
    
    // Guard against undefined (should never happen due to length check, but TypeScript needs this)
    if (prevIndex === undefined) return
    
    // Check if the previous swipe was a match (if we tracked it). 
    // Legacy forbids undoing matches. For now, we allow undoing movement.
    // Ideally we track 'wasMatch' in history.

    setHistory(prev => prev.slice(0, -1))
    setCurrentIndex(prevIndex)
    toast.info('Swipe undone')
  }, [history, isSwiping])

  const currentCandidate = candidates[currentIndex]
  const hasMore = currentIndex < candidates.length

  return {
    candidates,
    currentCandidate,
    isLoading,
    isSwiping,
    handleSwipe,
    handleUndo,
    canUndo: history.length > 0,
    fetchCandidates,
    hasMore
  }
}
