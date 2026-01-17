import {
  LiveCallPreferences,
  LiveCallQueueUser,
  LiveCallMatchPayload,
  LOOKING_FOR,
  USER_GENDER,
} from '@shared/types'
import { profileService } from '@/features/profile/services/profile.service'
import { agoraService } from '@/features/agora/services/agora.service'
import { randomUUID } from 'crypto'

// In-memory queue for matching
const queue = new Map<string, LiveCallQueueUser>()

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
    isPartnerAvailable?: (partnerId: string) => boolean,
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
        // Verify partner is still available (e.g. not disconnected or in another call)
        if (isPartnerAvailable && !isPartnerAvailable(otherId)) {
          console.log(`⚠️ [LiveCall] Partner ${otherId} no longer available, removing from queue`)
          queue.delete(otherId)
          continue
        }
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
      // u1's preference for u2's gender
      if (u1.preferences.lookingFor === LOOKING_FOR.ALL) return true
      return u1.preferences.lookingFor.toString() === u2.gender.toString()
    }

    const checkAge = (u1: LiveCallQueueUser, u2: LiveCallQueueUser) => {
      // u1's preference for u2's age
      return (
        u2.age >= u1.preferences.minAge && u2.age <= u1.preferences.maxAge
      )
    }

    const match = checkGender(user1, user2) &&
      checkGender(user2, user1) &&
      checkAge(user1, user2) &&
      checkAge(user2, user1)

    if (!match) {
      console.log(`📡 [LiveCall] Incompatible: ${user1.userId} vs ${user2.userId}`)
    }

    return match
  },
}
