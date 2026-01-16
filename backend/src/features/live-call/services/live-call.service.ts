import {
  LiveCallPreferences,
  LiveCallQueueUser,
  LiveCallMatchPayload,
  LOOKING_FOR,
  USER_GENDER,
} from '@shared/types'
import { profileService } from '@/features/profile/services/profile.service'
import { agoraService } from '@/features/agora/services/agora.service'
import { getMatchCollection } from '@/data/db/collection'
import { DbMatch } from '@/data/db/types/match'
import { randomUUID } from 'crypto'

// In-memory queue for matching
const queue = new Map<string, LiveCallQueueUser>()
// Track ongoing calls to handle likes
const ongoingCalls = new Map<
  string,
  { users: string[]; actions: Record<string, 'like' | 'pass' | null> }
>()

export const liveCallService = {
  /**
   * Add a user to the live call queue
   */
  addToQueue: async (
    userId: string,
    data: { gender: USER_GENDER; age: number; preferences: LiveCallPreferences },
  ): Promise<void> => {
    queue.set(userId, {
      userId,
      gender: data.gender,
      age: data.age,
      preferences: data.preferences,
      joinedAt: new Date(),
    })
    console.log(`👤 [LiveCall] User ${userId} joined queue`)
  },

  /**
   * Remove a user from the live call queue
   */
  removeFromQueue: (userId: string): void => {
    queue.delete(userId)
    console.log(`👤 [LiveCall] User ${userId} left queue`)
  },

  /**
   * Find a match for a user in the queue
   */
  findMatch: async (
    userId: string,
  ): Promise<{
    matchId: string
    payload1: LiveCallMatchPayload
    payload2: LiveCallMatchPayload
  } | null> => {
    const user = queue.get(userId)
    if (!user) return null

    for (const [otherId, otherUser] of queue.entries()) {
      if (otherId === userId) continue

      if (liveCallService.isCompatible(user, otherUser)) {
        // Remove both from queue
        queue.delete(userId)
        queue.delete(otherId)

        const matchId = randomUUID()
        const channelName = `live_call_${matchId}`

        const profile1 = await profileService.getProfile(userId)
        const profile2 = await profileService.getProfile(otherId)

        if (!profile1.profile || !profile2.profile) continue

        const token1 = agoraService.generateToken({
          channelName,
          uid: agoraService.generateNumericUid(userId),
        })

        const token2 = agoraService.generateToken({
          channelName,
          uid: agoraService.generateNumericUid(otherId),
        })

        const expiresAt = new Date(Date.now() + 90 * 1000).toISOString()

        const payload1: LiveCallMatchPayload = {
          matchId,
          channelName,
          agoraToken: token1.token,
          partner: {
            id: otherId,
            nickName: profile2.profile.nickName,
            age: profile2.profile.age,
            photo: profile2.profile.photo,
          },
          partnerName: profile2.profile.nickName,
          expiresAt,
        }

        const payload2: LiveCallMatchPayload = {
          matchId,
          channelName,
          agoraToken: token2.token,
          partner: {
            id: userId,
            nickName: profile1.profile.nickName,
            age: profile1.profile.age,
            photo: profile1.profile.photo,
          },
          partnerName: profile1.profile.nickName,
          expiresAt,
        }

        ongoingCalls.set(matchId, {
          users: [userId, otherId],
          actions: { [userId]: null, [otherId]: null },
        })

        return { matchId, payload1, payload2 }
      }
    }

    return null
  },

  /**
   * Check if two users are compatible based on their preferences
   */
  isCompatible: (user1: LiveCallQueueUser, user2: LiveCallQueueUser): boolean => {
    const checkGender = (u1: LiveCallQueueUser, u2: LiveCallQueueUser) => {
      if (u1.preferences.lookingFor === LOOKING_FOR.ALL) return true
      return u1.preferences.lookingFor.toString() === u2.preferences.gender.toString()
    }

    const checkAge = (u1: LiveCallQueueUser, u2: LiveCallQueueUser) => {
      return (
        u2.preferences.age >= u1.preferences.minAge && u2.preferences.age <= u1.preferences.maxAge
      )
    }

    return (
      checkGender(user1, user2) &&
      checkGender(user2, user1) &&
      checkAge(user1, user2) &&
      checkAge(user2, user1)
    )
  },

  /**
   * Handle Like/Pass action
   */
  handleAction: async (
    userId: string,
    matchId: string,
    action: 'like' | 'pass',
  ): Promise<{
    isComplete: boolean
    isMatch: boolean
    partnerId: string
    newMatchId?: string
  } | null> => {
    const call = ongoingCalls.get(matchId)
    if (!call) return null

    call.actions[userId] = action
    const partnerId = call.users.find((id) => id !== userId)!

    const isComplete = call.actions[userId] !== null && call.actions[partnerId] !== null
    if (isComplete) {
      const isMatch = call.actions[userId] === 'like' && call.actions[partnerId] === 'like'
      let newMatchId: string | undefined

      if (isMatch) {
        const matchCollection = await getMatchCollection()
        const sortedUsers = [userId, partnerId].sort()

        const existingMatch = await matchCollection.findOne({ users: { $all: sortedUsers } })
        if (existingMatch) {
          newMatchId = existingMatch._id.toHexString()
        } else {
          const newMatch: DbMatch = {
            users: sortedUsers,
            createdAt: new Date(),
            updatedAt: new Date(),
            isDeleted: false as const,
            createdBy: 'system:live-call',
            updatedBy: 'system:live-call',
            stage: 'fresh',
          }
          const result = await matchCollection.insertOne(newMatch)
          newMatchId = result.insertedId.toHexString()
        }
      }

      ongoingCalls.delete(matchId)
      return { isComplete, isMatch, partnerId, newMatchId }
    }

    return { isComplete: false, isMatch: false, partnerId }
  },
}
