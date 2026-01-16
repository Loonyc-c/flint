import {
  getInteractionCollection,
  getMatchCollection,
  getUserCollection,
} from '@/data/db/collection'
import { withMongoTransaction } from '@/data/db'
import { DbInteraction } from '@/data/db/types/interaction'
import { DbMatch } from '@/data/db/types/match'
import { InteractionType, LikePreview, SwipeResponse } from '@shared/types'
import { ObjectId } from 'mongodb'
import { ApiErrorCode, ApiException } from '@/shared/api/error'
import { HttpStatus } from '@/data/constants'

export const interactionService = {
  /**
   * Records a user interaction (Like/Pass) and checks for matches
   * Enforces 80% profile completeness gating for the actor
   */
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

      // 1. Verify actor exists and has sufficient profile completion
      const actor = await userCollection.findOne({ _id: actorObjectId }, { session })
      if (!actor) {
        throw new ApiException(HttpStatus.FORBIDDEN, ApiErrorCode.FORBIDDEN, {
          message: `User not found`,
        })
      }

      if ((actor.profileCompletion || 0) < 80) {
        throw new ApiException(HttpStatus.FORBIDDEN, ApiErrorCode.FORBIDDEN, {
          message: 'err.profile.incomplete_for_swipe',
          isReadableMessage: true,
        })
      }

      const existingInteraction = await interactionCollection.findOne(
        { actorId: actorObjectId, targetId: targetObjectId },
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

      // 2. Check for reciprocity (Match)
      if (type === InteractionType.SMASH || type === InteractionType.SUPER) {
        const reverseInteraction = await interactionCollection.findOne(
          {
            actorId: targetObjectId,
            targetId: actorObjectId,
            type: { $in: [InteractionType.SMASH, InteractionType.SUPER] },
          },
          { session },
        )

        if (reverseInteraction) {
          const sortedUserIdStrings = [actorObjectId, targetObjectId]
            .map((id) => id.toHexString())
            .sort((a, b) => a.localeCompare(b))

          const existingMatch = await matchCollection.findOne(
            { users: { $all: sortedUserIdStrings, $size: 2 } },
            { session },
          )

          if (existingMatch) {
            return { isMatch: true, matchId: existingMatch._id.toHexString() }
          }

          const match: DbMatch = {
            users: sortedUserIdStrings,
            createdAt: new Date(),
            updatedAt: new Date(),
            isDeleted: false as const,
            createdBy: actorId,
            updatedBy: actorId,
            stage: 'fresh',
          }

          const res = await matchCollection.insertOne(match, { session })
          return { isMatch: true, matchId: res.insertedId.toHexString() }
        }
      }

      return { isMatch: false }
    })
  },

  /**
   * Gets users who have liked the current user but haven't been matched yet
   */
  getLikes: async (userId: string): Promise<LikePreview[]> => {
    const userObjectId = new ObjectId(userId)
    const interactionCollection = await getInteractionCollection()
    const userCollection = await getUserCollection()

    const likesReceived = await interactionCollection
      .find({
        targetId: userObjectId,
        type: { $in: [InteractionType.SMASH, InteractionType.SUPER] },
        isDeleted: false,
      })
      .toArray()

    if (likesReceived.length === 0) return []

    const likerIds = likesReceived.map((like) => like.actorId)
    const currentUserSwipes = await interactionCollection
      .find({ actorId: userObjectId, targetId: { $in: likerIds } })
      .project({ targetId: 1 })
      .toArray()

    const swipedOnIds = new Set(currentUserSwipes.map((s) => s.targetId.toHexString()))
    const pendingLikes = likesReceived.filter(
      (like) => !swipedOnIds.has(like.actorId.toHexString())
    )

    if (pendingLikes.length === 0) return []

    const pendingLikerIds = pendingLikes.map((like) => like.actorId)
    const likers = await userCollection
      .find({ _id: { $in: pendingLikerIds } })
      .project({ _id: 1, 'auth.firstName': 1, 'auth.lastName': 1, 'profile.photo': 1 })
      .toArray()

    const userMap = new Map(likers.map((user) => [user._id.toHexString(), user]))

    return pendingLikes
      .map((like) => {
        const liker = userMap.get(like.actorId.toHexString())
        if (!liker) return null
        const avatar = liker.profile?.photo || undefined
        return {
          id: like._id.toHexString(),
          user: {
            id: liker._id.toHexString(),
            firstName: liker.auth.firstName as string,
            lastName: liker.auth.lastName as string,
            avatar,
          },
          createdAt: like.createdAt.toISOString(),
        }
      })
      .filter((r): r is LikePreview => r !== null)
  },
}
