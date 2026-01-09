import {
  getInteractionCollection,
  getMatchCollection,
  getUserCollection,
} from '@/data/db/collection'
import { withMongoTransaction } from '@/data/db'
import { DbInteraction } from '@/data/db/types/interaction'
import { DbMatch } from '@/data/db/types/match'
import { InteractionType, LOOKING_FOR, MatchWithUser, SwipeResponse, User } from '@shared/types'
import { ObjectId } from 'mongodb'
import { ApiErrorCode, ApiException } from '@/shared/api/error'
import { HttpStatus } from '@/data/constants'
import { DEFAULT_AGE_RANGE } from '@/data/constants/user'

const MIN_PROFILE_COMPLETION = 80

export const matchService = {
  getCandidates: async (userId: string, { limit = 20 }): Promise<User[]> => {
    const userObjectId = new ObjectId(userId)
    const userCollection = await getUserCollection()
    const interactionCollection = await getInteractionCollection()

    const currentUser = await userCollection.findOne({ _id: userObjectId })
    if (!currentUser?.profileCompletion || currentUser.profileCompletion < MIN_PROFILE_COMPLETION) {
      return []
    }

    const { lookingFor, ageRange } = currentUser.preferences ?? {}
    const userAge = currentUser.profile?.age ?? DEFAULT_AGE_RANGE

    // Pre-fetch interacted user IDs to optimize query
    const interactions = await interactionCollection
      .find({ actorId: userObjectId })
      .project({ targetId: 1 })
      .toArray()
    const interactedUserIds = interactions.map((i) => i.targetId)

    const pipeline = [
      {
        $match: {
          _id: { $ne: userObjectId, $nin: interactedUserIds },
          profileCompletion: { $gte: MIN_PROFILE_COMPLETION },
          'profile.gender': lookingFor === LOOKING_FOR.ALL ? { $exists: true } : lookingFor,
          'profile.age': {
            $gte: userAge - ageRange,
            $lte: userAge + ageRange,
          },
        },
      },
      { $limit: limit },
    ]

    const candidates = await userCollection.aggregate(pipeline).toArray()

    return candidates.map((user) => ({
      id: user._id.toHexString(),
      email: user.auth.email,
      firstName: user.auth.firstName,
      lastName: user.auth.lastName,
      name: `${user.auth.firstName} ${user.auth.lastName}`,
      profile: user.profile,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }))
  },

  swipe: async (
    actorId: string,
    targetId: string,
    type: InteractionType,
  ): Promise<SwipeResponse> => {
    const actorObjectId = new ObjectId(actorId)
    const targetObjectId = new ObjectId(targetId)

    if (actorId === targetId) {
      throw new ApiException(HttpStatus.BAD_REQUEST, ApiErrorCode.BAD_REQUEST, {
        message: 'Cannot swipe on yourself',
      })
    }

    return await withMongoTransaction(async (session) => {
      const userCollection = await getUserCollection()
      const interactionCollection = await getInteractionCollection()
      const matchCollection = await getMatchCollection()

      const actor = await userCollection.findOne({ _id: actorObjectId }, { session })
      if (!actor?.profileCompletion || actor.profileCompletion < MIN_PROFILE_COMPLETION) {
        throw new ApiException(HttpStatus.FORBIDDEN, ApiErrorCode.FORBIDDEN, {
          message: `Complete at least ${MIN_PROFILE_COMPLETION}% of your profile to start swiping`,
        })
      }

      const existingInteraction = await interactionCollection.findOne(
        {
          actorId: actorObjectId,
          targetId: targetObjectId,
        },
        { session },
      )

      if (existingInteraction) {
        throw new ApiException(HttpStatus.BAD_REQUEST, ApiErrorCode.BAD_REQUEST, {
          message: 'Already swiped on this user',
        })
      }

      const interaction: DbInteraction = {
        actorId: actorObjectId,
        targetId: targetObjectId,
        type,
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false as const,
        createdBy: actorId,
        updatedBy: actorId,
      }

      await interactionCollection.insertOne(interaction, { session })

      if (type === InteractionType.LIKE) {
        const reverseInteraction = await interactionCollection.findOne(
          {
            actorId: targetObjectId,
            targetId: actorObjectId,
            type: InteractionType.LIKE,
          },
          { session },
        )

        if (reverseInteraction) {
          // Requirement 1: Convert ObjectId[] to string[] for DbMatch.users storage
          // Sort by hex string for consistent ordering
          const sortedUserIdStrings = [actorObjectId, targetObjectId]
            .map((id) => id.toHexString())
            .sort((a, b) => a.localeCompare(b))

          const existingMatch = await matchCollection.findOne(
            {
              // Query using string IDs since users are stored as strings
              users: { $all: sortedUserIdStrings, $size: 2 },
            },
            { session },
          )

          if (existingMatch) {
            return {
              isMatch: true,
              matchId: existingMatch._id.toHexString(),
            }
          }

          const match: DbMatch = {
            // Store user IDs as strings per user preference
            users: sortedUserIdStrings,
            createdAt: new Date(),
            updatedAt: new Date(),
            isDeleted: false as const,
            createdBy: actorId,
            updatedBy: actorId,
          }

          const res = await matchCollection.insertOne(match, { session })

          return {
            isMatch: true,
            matchId: res.insertedId.toHexString(),
          }
        }
      }

      return { isMatch: false }
    })
  },

  getMatches: async (userId: string): Promise<MatchWithUser[]> => {
    const userIdString = userId
    const matchCollection = await getMatchCollection()
    const userCollection = await getUserCollection()

    // Requirement 1: Query using string userId since users are stored as strings
    const matches = await matchCollection.find({ users: userIdString }).toArray()

    if (matches.length === 0) {
      return []
    }

    // Requirement 1: users are strings, find the other user's ID string
    const otherUserIdStrings = matches
      .map((match) => match.users.find((id) => id !== userIdString))
      .filter((id): id is string => !!id)

    // Convert string IDs to ObjectId for MongoDB query
    const otherUserObjectIds = otherUserIdStrings.map((id) => new ObjectId(id))

    const otherUsers = await userCollection
      .find({ _id: { $in: otherUserObjectIds } })
      .project({ _id: 1, 'auth.firstName': 1, 'auth.lastName': 1 })
      .toArray()

    const userMap = new Map(otherUsers.map((user) => [user._id.toHexString(), user]))

    return matches
      .map((match) => {
        // users are strings, find the other user's ID
        const otherUserId = match.users.find((id) => id !== userIdString)
        if (!otherUserId) return null

        const otherUser = userMap.get(otherUserId)
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
      .filter((r): r is MatchWithUser => r !== null)
  },
}
