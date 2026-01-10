import { useState, useCallback, useEffect } from 'react'
import { getMatches } from '@/features/swipe/api/swipe'
import { useUser } from '@/features/auth/context/UserContext'
import { type ChatConversation } from '@shared/types'
import { toast } from 'react-toastify'

// =============================================================================
// Hook
// =============================================================================

export const useMatches = () => {
  const { user } = useUser()
  const [matches, setMatches] = useState<ChatConversation[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchMatches = useCallback(async () => {
    if (!user?.id) return

    setIsLoading(true)
    try {
      const data = await getMatches(user.id)
      
      // Transform MatchWithUser to ChatConversation
      const conversations: ChatConversation[] = data.map(match => ({
        id: match.id,
        matchId: match.id,
        otherUser: {
          id: match.otherUser.id,
          name: `${match.otherUser.firstName} ${match.otherUser.lastName}`,
          avatar: match.otherUser.avatar,
        },
        unreadCount: match.unreadCount,
        isTheirTurn: match.isTheirTurn,
        stage: match.stage || 'fresh',
        lastMessage: match.lastMessage 
          ? {
              id: `${match.id}-last`,
              matchId: match.id,
              senderId: match.lastMessage.senderId,
              text: match.lastMessage.text,
              createdAt: match.lastMessage.createdAt,
            }
          : undefined,
      }))

      setMatches(conversations)
    } catch (error) {
      console.error('Failed to fetch matches:', error)
      toast.error('Could not load matches')
    } finally {
      setIsLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    fetchMatches()
  }, [fetchMatches])

  return {
    matches,
    isLoading,
    refreshMatches: fetchMatches
  }
}
