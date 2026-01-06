import { useState, useCallback, useEffect } from 'react'
import { UserProfile, InteractionType } from '@shared/types'
import { getCandidates, swipe } from '../api/swipe'
import { useUser } from '@/features/auth/context/UserContext'

export const useSwipe = () => {
  const { user} = useUser()
  console.log({user})
  const [candidates, setCandidates] = useState<UserProfile[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)

  const fetchCandidates = useCallback(async () => {
    if (!user?.id) return
    setIsLoading(true)
    try {
      const data = await getCandidates(user.id)
      setCandidates(data)
      setCurrentIndex(0)
    } catch (error) {
      console.error('Failed to fetch candidates:', error)
    } finally {
      setIsLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    fetchCandidates()
  }, [fetchCandidates])

  const handleSwipe = async (targetId: string, type: InteractionType) => {
    if (!user?.id) return
    try {
      const response = await swipe(user.id, { targetId, type })
      setCurrentIndex((prev) => prev + 1)
      return response
    } catch (error) {
      console.error('Failed to swipe:', error)
      throw error
    }
  }

  const nextCandidate = candidates[currentIndex]

  return {
    candidates,
    nextCandidate,
    isLoading,
    handleSwipe,
    fetchCandidates,
    hasMore: currentIndex < candidates.length
  }
}
