import {
  getInteractionCollection,
  getMatchCollection,
  getUserCollection,
} from '@/data/db/collection'
import { withMongoTransaction } from '@/data/db'
import { DbInteraction } from '@/data/db/types/interaction'
import { DbMatch } from '@/data/db/types/match'
import { InteractionType, LikePreview, LOOKING_FOR, MatchWithUser, SwipeResponse, User } from '@shared/types'
import { ObjectId } from 'mongodb'
import { ApiErrorCode, ApiException } from '@/shared/api/error'
import { HttpStatus } from '@/data/constants'
import { DEFAULT_AGE_RANGE } from '@/data/constants/user'
import { ListCandidatesRequest } from '@shared/validations/match.validation'



export const matchService = {
  getCandidates: async (userId: string, filters: ListCandidatesRequest): Promise<User[]> => {
    const { limit = 20, ageRange: filterAgeRange, lookingFor: filterLookingFor } = filters
    const userObjectId = new ObjectId(userId)
    const userCollection = await getUserCollection()

    const currentUser = await userCollection.findOne({ _id: userObjectId })
    if (!currentUser) {
      return []
    }

    // Use passed filters if available, otherwise fall back to user preferences
    const lookingFor = filterLookingFor ?? currentUser.preferences?.lookingFor
    const ageRange = filterAgeRange ?? currentUser.preferences?.ageRange

    // Requirement 16: Scalable candidate search using $lookup anti-pattern instead of $nin
    const pipeline = [
      {
        $match: {
          _id: { $ne: userObjectId },
          'profile.gender': lookingFor === LOOKING_FOR.ALL ? { $exists: true } : lookingFor,
          'profile.age': {
            $gte: 18,
            $lte: ageRange ?? DEFAULT_AGE_RANGE,
          },
        },
      },
      {
        $lookup: {
          from: 'interactions',
          let: { candidateId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$actorId', userObjectId] },
                    { $eq: ['$targetId', '$$candidateId'] },
                  ],
                },
              },
            },
            { $limit: 1 },
          ],
          as: 'hasInteracted',
        },
      },
      {
        $match: {
          hasInteracted: { $size: 0 },
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
      if (!actor) {
        throw new ApiException(HttpStatus.FORBIDDEN, ApiErrorCode.FORBIDDEN, {
          message: `User not found`,
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

      // Both SMASH and SUPER can create matches
      if (type === InteractionType.SMASH || type === InteractionType.SUPER) {
        // Check if target has also swiped positively (smash or super) on the actor
        const reverseInteraction = await interactionCollection.findOne(
          {
            actorId: targetObjectId,
            targetId: actorObjectId,
            type: { $in: [InteractionType.SMASH, InteractionType.SUPER] },
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
            stage: 'fresh', // New matches start at fresh stage
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

  getMatches: async (
    userId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<MatchWithUser[]> => {
    const userIdString = userId
    const matchCollection = await getMatchCollection()
    const userCollection = await getUserCollection()

    // Requirement 1: Query using string userId since users are stored as strings
    const matches = await matchCollection
      .find({ users: userIdString })
      .sort({ updatedAt: -1 })
      .skip(offset)
      .limit(limit)
      .toArray()

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
      .project({ _id: 1, 'auth.firstName': 1, 'auth.lastName': 1, 'profile.photos': 1 })
      .toArray()

    const userMap = new Map(otherUsers.map((user) => [user._id.toHexString(), user]))

    return matches
      .map((match) => {
        // users are strings, find the other user's ID
        const otherUserId = match.users.find((id) => id !== userIdString)
        if (!otherUserId) return null

        const otherUser = userMap.get(otherUserId)
        if (!otherUser) return null

        // Get unread count for current user
        const unreadCount = match.unreadCounts?.[userIdString] || 0
        
        // Determine if it's their turn (other user's turn means current user is waiting)
        const isTheirTurn = match.currentTurn === otherUserId

        // Format last message for preview
        const lastMessage = match.lastMessage
          ? {
              text: match.lastMessage.text,
              senderId: match.lastMessage.senderId,
              createdAt: match.lastMessage.createdAt.toISOString(),
            }
          : undefined

        // Get avatar from photos array (first photo)
        const avatar = otherUser.profile?.photos?.[0] || undefined

        const result: MatchWithUser = {
          id: match._id.toHexString(),
          createdAt: match.createdAt,
          otherUser: {
            id: otherUser._id.toHexString(),
            firstName: otherUser.auth.firstName as string,
            lastName: otherUser.auth.lastName as string,
            avatar,
          },
          lastMessage,
          unreadCount,
          isTheirTurn,
          stage: match.stage || 'fresh', // Default to fresh for existing matches
        }
        return result
      })
      .filter((r): r is MatchWithUser => r !== null)
  },

  /**
   * Gets users who have liked the current user but haven't been matched yet
   * (i.e., current user hasn't swiped on them yet)
   */
  getLikes: async (userId: string): Promise<LikePreview[]> => {
    const userObjectId = new ObjectId(userId)
    const interactionCollection = await getInteractionCollection()
    const userCollection = await getUserCollection()

    // Find interactions where someone swiped positively (smash or super) on the current user
    const likesReceived = await interactionCollection
      .find({
        targetId: userObjectId,
        type: { $in: [InteractionType.SMASH, InteractionType.SUPER] },
        isDeleted: false,
      })
      .toArray()

    if (likesReceived.length === 0) {
      return []
    }

    // Get the IDs of users who liked current user
    const likerIds = likesReceived.map((like) => like.actorId)

    // Find which of these the current user has already swiped on
    const currentUserSwipes = await interactionCollection
      .find({
        actorId: userObjectId,
        targetId: { $in: likerIds },
      })
      .project({ targetId: 1 })
      .toArray()

    const swipedOnIds = new Set(currentUserSwipes.map((s) => s.targetId.toHexString()))

    // Filter to only include likes from users we haven't swiped on yet
    const pendingLikes = likesReceived.filter(
      (like) => !swipedOnIds.has(like.actorId.toHexString())
    )

    if (pendingLikes.length === 0) {
      return []
    }

    // Get user details for the likers
    const pendingLikerIds = pendingLikes.map((like) => like.actorId)
    const likers = await userCollection
      .find({ _id: { $in: pendingLikerIds } })
      .project({ _id: 1, 'auth.firstName': 1, 'auth.lastName': 1, 'profile.photos': 1 })
      .toArray()

    const userMap = new Map(likers.map((user) => [user._id.toHexString(), user]))

    return pendingLikes
      .map((like) => {
        const liker = userMap.get(like.actorId.toHexString())
        if (!liker) return null

        const result: LikePreview = {
          id: like._id.toHexString(),
          user: {
            id: liker._id.toHexString(),
            firstName: liker.auth.firstName as string,
            lastName: liker.auth.lastName as string,
            avatar: liker.profile?.photos?.[0] || undefined,
          },
          createdAt: like.createdAt.toISOString(),
        }
        return result
      })
      .filter((r): r is LikePreview => r !== null)
  },
}
