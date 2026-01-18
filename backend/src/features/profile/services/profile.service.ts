import { getUserCollection } from '@/data/db/collection'
import { DbUser } from '@/data/db/types/user'
import { ProfileUpdateRequest, ProfileResponse, UserContactInfo } from '@shared/types'
import { calculateProfileCompleteness } from '@shared/lib'
import { ObjectId } from 'mongodb'
import { ErrorCode, ServiceException } from '@/features/error'
import { isNil, isNonEmptyValue } from '@/utils'

export const profileService = {
  updateProfile: async (userId: string, data: ProfileUpdateRequest): Promise<ProfileResponse> => {
    const userCollection = await getUserCollection()
    const userObjectId = new ObjectId(userId)

    const { score } = calculateProfileCompleteness(data)

    const updates: Partial<DbUser> = {
      profile: {
        firstName: data.firstName,
        lastName: data.lastName,
        nickName: data.nickName,
        age: data.age,
        gender: data.gender,
        bio: data.bio,
        interests: data.interests,
        photo: data.photo,
        voiceIntro: data.voiceIntro,
        questions: data.questions,
        contactInfo: data.contactInfo,
      },
      profileCompletion: score,
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

    return {
      isComplete: true,
      profile: data,
    }
  },

  getProfile: async (userId: string): Promise<ProfileResponse> => {
    const userCollection = await getUserCollection()
    const user = await userCollection.findOne(
      { _id: new ObjectId(userId) },
      { projection: { profile: 1, preferences: 1, contactInfo: 1 } },
    )

    if (isNil(user)) {
      throw new ServiceException('err.user.not_found', ErrorCode.NOT_FOUND)
    }

    const isComplete = isNonEmptyValue(user.profile) && isNonEmptyValue(user.preferences)

    if (!isComplete || isNil(user.profile)) {
      return { isComplete: false }
    }

    const profileData: ProfileUpdateRequest = {
      firstName: user.profile.firstName,
      lastName: user.profile.lastName,
      nickName: user.profile.nickName,
      age: user.profile.age,
      gender: user.profile.gender,
      bio: user.profile.bio,
      interests: user.profile.interests,
      photo: user.profile.photo,
      voiceIntro: user.profile.voiceIntro,
      questions: user.profile.questions,
      contactInfo: user.profile.contactInfo,
    }

    return {
      isComplete: true,
      profile: profileData,
    }
  },

  updateContactInfo: async (userId: string, data: UserContactInfo): Promise<UserContactInfo> => {
    const userCollection = await getUserCollection()
    const userObjectId = new ObjectId(userId)

    const user = await userCollection.findOne({ _id: userObjectId })
    if (isNil(user)) {
      throw new ServiceException('err.user.not_found', ErrorCode.NOT_FOUND)
    }

    const updatedProfile = {
      ...(user.profile || {}),
      contactInfo: data,
    }

    const { score } = calculateProfileCompleteness(updatedProfile)

    const result = await userCollection.findOneAndUpdate(
      { _id: userObjectId },
      {
        $set: {
          profile: updatedProfile,
          profileCompletion: score,
          updatedAt: new Date()
        },
        $unset: {
          contactInfo: "" // Ensure root is removed if it existed
        }
      },
      { returnDocument: 'after' }
    )

    if (isNil(result)) {
      throw new ServiceException('err.user.not_found', ErrorCode.NOT_FOUND)
    }

    return result.profile?.contactInfo || data
  },

  verifyPlatform: async (userId: string, platform: string, handle: string): Promise<UserContactInfo> => {
    const userCollection = await getUserCollection()
    const userObjectId = new ObjectId(userId)

    const user = await userCollection.findOne({ _id: userObjectId })
    if (isNil(user)) {
      throw new ServiceException('err.user.not_found', ErrorCode.NOT_FOUND)
    }

    const currentProfile = user.profile || {}
    const verifiedPlatforms = [...(currentProfile.verifiedPlatforms || [])]

    if (!verifiedPlatforms.includes(platform)) {
      verifiedPlatforms.push(platform)
    }

    const updatedProfile = {
      ...currentProfile,
      contactInfo: {
        ...(currentProfile.contactInfo || { instagram: { userName: handle, isVerified: false } }),
        instagram: {
          userName: handle,
          isVerified: platform === 'instagram' // In this context platform might be 'instagram'
        }
      }
    }

    const { score } = calculateProfileCompleteness(updatedProfile)

    const result = await userCollection.findOneAndUpdate(
      { _id: userObjectId },
      { $set: { profile: updatedProfile, profileCompletion: score, updatedAt: new Date() } },
      { returnDocument: 'after' }
    )

    if (isNil(result)) {
      throw new ServiceException('err.user.not_found', ErrorCode.NOT_FOUND)
    }

    return result.profile?.contactInfo || { instagram: { userName: '', isVerified: false } }
  },

  getContactInfo: async (userId: string): Promise<UserContactInfo | null> => {
    const userCollection = await getUserCollection()
    const user = await userCollection.findOne({ _id: new ObjectId(userId) })

    if (isNil(user)) {
      throw new ServiceException('err.user.not_found', ErrorCode.NOT_FOUND)
    }

    return user.profile?.contactInfo || null
  },
}
