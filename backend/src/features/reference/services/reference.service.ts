import { getUserCollection } from '@/data/db/collection'
import { ReferenceUpdateRequest } from '@shared/types'
import { ObjectId } from 'mongodb'
import { ErrorCode, ServiceException } from '@/features/error'
import { isNil } from '@/utils'
import { UserPreferences } from '@shared/types'

export const referenceService = {
  updateReference: async (
    userId: string,
    data: ReferenceUpdateRequest,
  ): Promise<UserPreferences> => {
    const userCollection = await getUserCollection()
    const userObjectId = new ObjectId(userId)

    const updates = {
      preferences: {
        ageRange: data.ageRange,
      },
      updatedAt: new Date(),
    }

    const result = await userCollection.findOneAndUpdate(
      { _id: userObjectId },
      { $set: updates },
      { returnDocument: 'after' },
    )

    if (isNil(result)) {
      throw new ServiceException('err.user.not_found', ErrorCode.NOT_FOUND)
    }

    if (isNil(result.preferences)) {
      // Should ideally not happen if user is created correctly
      throw new ServiceException('err.data.not_found', ErrorCode.INTERNAL_ERROR)
    }

    return result.preferences
  },

  getReference: async (userId: string): Promise<UserPreferences> => {
    const userCollection = await getUserCollection()
    const user = await userCollection.findOne({ _id: new ObjectId(userId) })

    if (isNil(user)) {
      throw new ServiceException('err.user.not_found', ErrorCode.NOT_FOUND)
    }

    // Return default preferences if not set (fallback)
    return user.preferences
  },
}
