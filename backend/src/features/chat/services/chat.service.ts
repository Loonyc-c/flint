import { getMatchCollection, getMessageCollection } from '@/data/db/collection'
import { DbMessage } from '@/data/db/types/message'
import { ApiErrorCode, ApiException } from '@/shared/api/error'
import { HttpStatus } from '@/data/constants'
import { ObjectId } from 'mongodb'

// =============================================================================
// Types
// =============================================================================

interface MessageResponse {
  id: string
  matchId: string
  senderId: string
  text: string
  createdAt: string
  readAt?: string
}

// =============================================================================
// Service
// =============================================================================

export const chatService = {
  /**
   * Retrieves messages for a specific match
   * Verifies user is part of the match
   */
  getMessages: async (matchId: string, userId: string): Promise<MessageResponse[]> => {
    const matchCollection = await getMatchCollection()
    const messageCollection = await getMessageCollection()

    // Verify match exists and user is a participant
    const match = await matchCollection.findOne({
      _id: new ObjectId(matchId),
      users: userId,
    })

    if (!match) {
      throw new ApiException(HttpStatus.FORBIDDEN, ApiErrorCode.FORBIDDEN, {
        message: 'err.auth.permission_denied',
        isReadableMessage: true,
      })
    }

    // Fetch messages sorted by creation date
    const messages = await messageCollection
      .find({ matchId, isDeleted: false })
      .sort({ createdAt: 1 })
      .toArray()

    return messages.map((msg) => ({
      id: msg._id.toHexString(),
      matchId: msg.matchId,
      senderId: msg.senderId,
      text: msg.text,
      createdAt: msg.createdAt.toISOString(),
      readAt: msg.readAt?.toISOString(),
    }))
  },

  /**
   * Sends a new message to a match
   * Updates match metadata for efficient list rendering
   */
  sendMessage: async (
    matchId: string,
    userId: string,
    text: string
  ): Promise<MessageResponse> => {
    const matchCollection = await getMatchCollection()
    const messageCollection = await getMessageCollection()

    // Verify match exists and user is a participant
    const match = await matchCollection.findOne({
      _id: new ObjectId(matchId),
      users: userId,
    })

    if (!match) {
      throw new ApiException(HttpStatus.FORBIDDEN, ApiErrorCode.FORBIDDEN, {
        message: 'err.auth.permission_denied',
        isReadableMessage: true,
      })
    }

    const now = new Date()

    // Create the message
    const dbMessage: DbMessage = {
      matchId,
      senderId: userId,
      text,
      createdAt: now,
      updatedAt: now,
      isDeleted: false as const,
      createdBy: userId,
      updatedBy: userId,
    }

    const result = await messageCollection.insertOne(dbMessage)

    // Find the other user's ID
    const otherUserId = match.users.find((id) => id !== userId)

    // Update match metadata for efficient list view
    const currentUnreadCounts = match.unreadCounts || {}
    const newUnreadCounts = {
      ...currentUnreadCounts,
      [otherUserId!]: (currentUnreadCounts[otherUserId!] || 0) + 1,
    }

    await matchCollection.updateOne(
      { _id: new ObjectId(matchId) },
      {
        $set: {
          lastMessage: {
            text,
            senderId: userId,
            createdAt: now,
          },
          unreadCounts: newUnreadCounts,
          currentTurn: otherUserId, // It's now the other user's turn
          updatedAt: now,
          updatedBy: userId,
        },
      }
    )

    return {
      id: result.insertedId.toHexString(),
      matchId,
      senderId: userId,
      text,
      createdAt: now.toISOString(),
    }
  },

  /**
   * Marks all messages in a match as read by the current user
   */
  markAsRead: async (matchId: string, userId: string): Promise<void> => {
    const matchCollection = await getMatchCollection()
    const messageCollection = await getMessageCollection()

    // Verify match exists and user is a participant
    const match = await matchCollection.findOne({
      _id: new ObjectId(matchId),
      users: userId,
    })

    if (!match) {
      throw new ApiException(HttpStatus.FORBIDDEN, ApiErrorCode.FORBIDDEN, {
        message: 'err.auth.permission_denied',
        isReadableMessage: true,
      })
    }

    const now = new Date()

    // Mark all unread messages from the other user as read
    await messageCollection.updateMany(
      {
        matchId,
        senderId: { $ne: userId },
        readAt: { $exists: false },
      },
      {
        $set: {
          readAt: now,
          updatedAt: now,
          updatedBy: userId,
        },
      }
    )

    // Reset unread count for this user
    const currentUnreadCounts = match.unreadCounts || {}
    const newUnreadCounts = {
      ...currentUnreadCounts,
      [userId]: 0,
    }

    await matchCollection.updateOne(
      { _id: new ObjectId(matchId) },
      {
        $set: {
          unreadCounts: newUnreadCounts,
          updatedAt: now,
          updatedBy: userId,
        },
      }
    )
  },
}
