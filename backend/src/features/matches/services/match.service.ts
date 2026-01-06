import {
  getInteractionCollection,
  getMatchCollection,
  getUserCollection,
} from '@/data/db/collection'
import { withMongoTransaction } from '@/data/db'
import { DbInteraction } from '@/data/db/types/interaction'
import { DbMatch } from '@/data/db/types/match'
import {
  InteractionType,
  LOOKING_FOR,
  MatchWithUser,
  SwipeResponse,
  UserProfile,
} from '@shared/types'
import { ObjectId } from 'mongodb'
import { ApiErrorCode, ApiException } from '@/shared/api/error'
import { HttpStatus } from '@/data/constants'
import { DEFAULT_AGE_RANGE } from '@/data/constants/user'

const MIN_PROFILE_COMPLETION = 80

export const matchService = {
  getCandidates: async (userId: string, { limit = 20 }): Promise<UserProfile[]> => {
    const userObjectId = new ObjectId(userId)
    const userCollection = await getUserCollection()

    const currentUser = await userCollection.findOne({ _id: userObjectId })
    if (!currentUser?.profileCompletion || currentUser.profileCompletion < MIN_PROFILE_COMPLETION) {
      return []
    }

    const { lookingFor, ageRange } = currentUser.preferences ?? {}

    const userAge = currentUser.profile?.age ?? DEFAULT_AGE_RANGE

    const pipeline = [
      {
        $match: {
          _id: { $ne: userObjectId },
          profileCompletion: { $gte: MIN_PROFILE_COMPLETION },
          'profile.gender': lookingFor === LOOKING_FOR.ALL ? { $exists: true } : lookingFor,
          'profile.age': {
            $gte: userAge - ageRange,
            $lte: userAge + ageRange,
          },
        },
      },
      {
        $lookup: {
          from: 'interactions',
          let: { targetId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [{ $eq: ['$actorId', userObjectId] }, { $eq: ['$targetId', '$$targetId'] }],
                },
              },
            },
          ],
          as: 'existingInteractions',
        },
      },
      {
        $match: {
          existingInteractions: { $size: 0 },
        },
      },
      { $limit: limit },
    ]

    const candidates = await userCollection.aggregate(pipeline).toArray()

    return candidates.map((user) => ({
      id: user._id.toHexString(),
      firstName: user.auth.firstName,
      lastName: user.auth.lastName,
      ...user.profile,
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
          const sortedUserIds = [actorObjectId, targetObjectId].sort((a, b) =>
            a.toHexString().localeCompare(b.toHexString()),
          )

          const existingMatch = await matchCollection.findOne(
            {
              users: { $all: sortedUserIds, $size: 2 },
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
            users: sortedUserIds,
            createdAt: new Date(),
            updatedAt: new Date(),
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
    const userObjectId = new ObjectId(userId)
    const matchCollection = await getMatchCollection()
    const userCollection = await getUserCollection()

    const matches = await matchCollection.find({ users: userObjectId }).toArray()

    if (matches.length === 0) {
      return []
    }

    const otherUserIds = matches
      .map((match) => match.users.find((id) => !id.equals(userObjectId)))
      .filter((id): id is ObjectId => !!id)

    const otherUsers = await userCollection
      .find({ _id: { $in: otherUserIds } })
      .project({ _id: 1, 'auth.firstName': 1, 'auth.lastName': 1 })
      .toArray()

    const userMap = new Map(otherUsers.map((user) => [user._id.toHexString(), user]))

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
      .filter((r): r is MatchWithUser => r !== null)
  },
}
