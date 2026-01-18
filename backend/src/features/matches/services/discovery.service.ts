import { getUserCollection } from '@/data/db/collection'
import { User } from '@shared/types'
import { ObjectId } from 'mongodb'
import { DEFAULT_AGE_RANGE } from '@/data/constants/user'
import { ListCandidatesRequest } from '@shared/validations/match.validation'

export const discoveryService = {
  /**
   * Gets a list of potential match candidates for a user
   * Enforces 80% profile completeness gating for both requester and candidates
   */
  getCandidates: async (userId: string, filters: ListCandidatesRequest): Promise<User[]> => {
    const { limit = 20, ageRange: filterAgeRange } = filters
    const userObjectId = new ObjectId(userId)
    const userCollection = await getUserCollection()

    // 1. Fetch current user to verify their own profile completeness (Security Gate)
    const currentUser = await userCollection.findOne({ _id: userObjectId })
    if (!currentUser || (currentUser.profileCompletion || 0) < 80) {
      return []
    }

    // 2. Determine discovery preferences
    const ageRange = filterAgeRange ?? currentUser.preferences?.ageRange

    // 3. Aggregate candidates
    const pipeline = [
      {
        $match: {
          _id: { $ne: userObjectId },
          profileCompletion: { $gte: 80 }, // Quality Gate: Only show complete profiles
          'profile.gender': {
            $ne: currentUser.profile?.gender,
          },
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
      name: user.profile?.nickName || 'User',
      profile: user.profile,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }))
  },
}
