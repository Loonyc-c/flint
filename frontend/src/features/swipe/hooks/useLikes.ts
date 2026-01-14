'use client'

import { useState, useCallback, useEffect } from 'react'
import { getLikes } from '@/features/swipe/api/swipe'
import { useUser } from '@/features/auth/context/UserContext'
import { type LikePreview } from '@shared/types'
import { toast } from 'react-toastify'

// =============================================================================
// Hook
// =============================================================================

export const useLikes = () => {
  const { user } = useUser()
  const [likes, setLikes] = useState<LikePreview[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchLikes = useCallback(async () => {
    if (!user?.id) return

    setIsLoading(true)
    try {
      const data = await getLikes(user.id)
      setLikes(data)
    } catch (error) {
      console.error('Failed to fetch likes:', error)
      toast.error('Could not load likes')
    } finally {
      setIsLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    fetchLikes()
  }, [fetchLikes])

  return {
    likes,
    likeCount: likes.length,
    isLoading,
    refreshLikes: fetchLikes
  }
}
