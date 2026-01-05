import {
  getInteractionCollection,
  getMatchCollection,
  getUserCollection,
} from '@/data/db/collection'
import { DbInteraction } from '@/data/db/types/interaction'
import { DbMatch } from '@/data/db/types/match'
import { InteractionType, SwipeResponse, UserProfile } from '@shared/types'
import { ObjectId } from 'mongodb'
import { ApiErrorCode, ApiException } from '@/shared/api/error'
import { HttpStatus } from '@/data/constants'

const MIN_PROFILE_COMPLETION = 80

export const matchService = {
  getCandidates: async (userId: string, limit: number = 20): Promise<UserProfile[]> => {
    const userObjectId = new ObjectId(userId)
    const interactionCollection = await getInteractionCollection()
    const userCollection = await getUserCollection()

    // 0. Check if current user has a complete profile
    const currentUser = await userCollection.findOne({ _id: userObjectId })
    if (!currentUser?.profileCompletion || currentUser.profileCompletion < MIN_PROFILE_COMPLETION) {
      // User is not eligible to see others because they are not eligible to be seen.
      return []
    }

    // 1. Get IDs of users already swiped on
    const interactions = await interactionCollection
      .find({ actorId: userObjectId }, { projection: { targetId: 1 } })
      .toArray()

    const swipedIds = interactions.map((i) => i.targetId)

    // 2. Find users NOT in swipedIds and NOT self AND have >= 80% completion
    const candidates = await userCollection
      .find({
        _id: { $nin: [...swipedIds, userObjectId] },
        profileCompletion: { $gte: MIN_PROFILE_COMPLETION },
        profile: { $exists: true },
      })
      .limit(limit)
      .toArray()

    // 3. Map to UserProfile
    return candidates.map((user) => ({
      id: user._id.toHexString(),
      firstName: user.auth.firstName,
      lastName: user.auth.lastName,
      // Add other profile fields here
    }))
  },

  swipe: async (
    actorId: string,
    targetId: string,
    type: InteractionType,
  ): Promise<SwipeResponse> => {
    const actorObjectId = new ObjectId(actorId)
    const targetObjectId = new ObjectId(targetId)
    const userCollection = await getUserCollection()

    // 0. Validate Profile Completeness
    const actor = await userCollection.findOne({ _id: actorObjectId })
    if (!actor?.profileCompletion || actor.profileCompletion < MIN_PROFILE_COMPLETION) {
      throw new ApiException(HttpStatus.FORBIDDEN, ApiErrorCode.FORBIDDEN, {
        message: `Complete at least ${MIN_PROFILE_COMPLETION}% of your profile to start swiping`,
      })
    }

    if (actorId === targetId) {
      throw new ApiException(HttpStatus.BAD_REQUEST, ApiErrorCode.BAD_REQUEST, {
        message: 'Cannot swipe on yourself',
      })
    }

    const interactionCollection = await getInteractionCollection()
    const matchCollection = await getMatchCollection()

    // 1. Check if already swiped
    const existingInteraction = await interactionCollection.findOne({
      actorId: actorObjectId,
      targetId: targetObjectId,
    })

    if (existingInteraction) {
      throw new ApiException(HttpStatus.BAD_REQUEST, ApiErrorCode.BAD_REQUEST, {
        message: 'Already swiped on this user',
      })
    }

    // 2. Record the swipe
    const interaction: DbInteraction = {
      actorId: actorObjectId,
      targetId: targetObjectId,
      type,
      createdAt: new Date(),
    }

    await interactionCollection.insertOne(interaction)

    // 3. If LIKE, check for match
    if (type === InteractionType.LIKE) {
      const reverseInteraction = await interactionCollection.findOne({
        actorId: targetObjectId,
        targetId: actorObjectId,
        type: InteractionType.LIKE,
      })

      if (reverseInteraction) {
        // IT'S A MATCH!
        const match: DbMatch = {
          users: [actorObjectId, targetObjectId],
          createdAt: new Date(),
          updatedAt: new Date(),
        }

        const res = await matchCollection.insertOne(match)

        return {
          isMatch: true,
          matchId: res.insertedId.toHexString(),
        }
      }
    }

    return { isMatch: false }
  },

  getMatches: async (userId: string): Promise<any[]> => {
    const userObjectId = new ObjectId(userId)
    const matchCollection = await getMatchCollection()
    const userCollection = await getUserCollection()

    // Find matches where the user is one of the participants
    const matches = await matchCollection.find({ users: userObjectId }).toArray()

    if (matches.length === 0) {
      return []
    }

    // Get all other user IDs from the matches
    const otherUserIds = matches
      .map((match) => match.users.find((id) => !id.equals(userObjectId)))
      .filter((id): id is ObjectId => !!id)

    // Fetch all other users in one query
    const otherUsers = await userCollection
      .find({ _id: { $in: otherUserIds } })
      .project({ _id: 1, 'auth.firstName': 1, 'auth.lastName': 1 })
      .toArray()

    const userMap = new Map(otherUsers.map((user) => [user._id.toHexString(), user]))

    // Map matches to results using the userMap
    return matches
      .map((match) => {
        const otherUserId = match.users.find((id) => !id.equals(userObjectId))
        if (!otherUserId) return null

        const otherUser = userMap.get(otherUserId.toHexString())
        if (!otherUser) return null

        return {
          id: match._id.toHexString(),
          createdAt: match.createdAt,
          otherUser: {
            id: otherUser._id.toHexString(),
            firstName: otherUser.auth.firstName,
            lastName: otherUser.auth.lastName,
          },
        }
      })
      .filter((r) => r !== null)
  },
}
