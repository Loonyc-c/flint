import {
  getMatchCollection,
  getUserCollection,
} from '@/data/db/collection'
import { MatchWithUser } from '@shared/types'
import { ObjectId } from 'mongodb'

export const matchService = {
  /**
   * Retrieves all active matches for a user
   * Optimized for discovery hub sidebar rendering
   */
  getMatches: async (
    userId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<MatchWithUser[]> => {
    const userIdString = userId
    const matchCollection = await getMatchCollection()
    const userCollection = await getUserCollection()

    const matches = await matchCollection
      .find({ users: userIdString })
      .sort({ updatedAt: -1 })
      .skip(offset)
      .limit(limit)
      .toArray()

    if (matches.length === 0) return []

    const otherUserIdStrings = matches
      .map((match) => match.users.find((id) => id !== userIdString))
      .filter((id): id is string => !!id)

    const otherUserObjectIds = otherUserIdStrings.map((id) => new ObjectId(id))
    const otherUsers = await userCollection
      .find({ _id: { $in: otherUserObjectIds } })
      .project({ _id: 1, 'auth.firstName': 1, 'auth.lastName': 1, 'profile.photo': 1 })
      .toArray()

    const userMap = new Map(otherUsers.map((user) => [user._id.toHexString(), user]))

    return matches
      .map((match): MatchWithUser | null => {
        const otherUserId = match.users.find((id) => id !== userIdString)
        if (!otherUserId) return null

        const otherUser = userMap.get(otherUserId)
        if (!otherUser) return null

        const unreadCount = match.unreadCounts?.[userIdString] || 0
        const isTheirTurn = match.currentTurn === otherUserId
        const lastMessage = match.lastMessage
          ? {
              text: match.lastMessage.text,
              senderId: match.lastMessage.senderId,
              createdAt: match.lastMessage.createdAt.toISOString(),
            }
          : undefined

        return {
          id: match._id.toHexString(),
          createdAt: match.createdAt,
          otherUser: {
            id: otherUser._id.toHexString(),
            firstName: otherUser.auth.firstName as string,
            lastName: otherUser.auth.lastName as string,
            avatar: otherUser.profile?.photo || undefined,
          },
          lastMessage,
          unreadCount,
          isTheirTurn,
          stage: match.stage || 'fresh',
        }
      })
      .filter((r): r is MatchWithUser => r !== null)
  },
}