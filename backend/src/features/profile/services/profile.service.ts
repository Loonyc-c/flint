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

    const user = await userCollection.findOne({ _id: userObjectId })
    const contactInfo = user?.contactInfo

    const { score } = calculateProfileCompleteness(data, contactInfo)

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
        instagram: data.instagram,
        verifiedPlatforms: data.verifiedPlatforms,
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
      instagram: user.profile.instagram,
      verifiedPlatforms: user.profile.verifiedPlatforms,
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
      instagram: data.instagram,
      verifiedPlatforms: data.verifiedPlatforms || user.profile?.verifiedPlatforms || [],
    }

    const { score } = calculateProfileCompleteness(updatedProfile, data)

    const result = await userCollection.findOneAndUpdate(
      { _id: userObjectId },
      {
        $set: {
          contactInfo: data,
          profile: updatedProfile,
          profileCompletion: score,
          updatedAt: new Date()
        }
      },
      { returnDocument: 'after' }
    )

    if (isNil(result)) {
      throw new ServiceException('err.user.not_found', ErrorCode.NOT_FOUND)
    }

    return result.contactInfo || data
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
      [platform]: handle,
      verifiedPlatforms,
    }

    const { score } = calculateProfileCompleteness(updatedProfile, user.contactInfo || {})

    const result = await userCollection.findOneAndUpdate(
      { _id: userObjectId },
      { $set: { profile: updatedProfile, profileCompletion: score, updatedAt: new Date() } },
      { returnDocument: 'after' }
    )

    if (isNil(result)) {
      throw new ServiceException('err.user.not_found', ErrorCode.NOT_FOUND)
    }

    return result.contactInfo || { verifiedPlatforms: [] }
  },

  getContactInfo: async (userId: string): Promise<UserContactInfo | null> => {
    const userCollection = await getUserCollection()
    const user = await userCollection.findOne({ _id: new ObjectId(userId) })

    if (isNil(user)) {
      throw new ServiceException('err.user.not_found', ErrorCode.NOT_FOUND)
    }

    // Prioritize instagram from profile but fallback to contactInfo
    const instagram = user.profile?.instagram || user.contactInfo?.instagram
    const verifiedPlatforms = user.profile?.verifiedPlatforms || user.contactInfo?.verifiedPlatforms || []

    return {
      instagram,
      verifiedPlatforms,
    }
  },
}
