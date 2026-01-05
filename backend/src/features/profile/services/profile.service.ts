import { getUserCollection } from '@/data/db/collection'
import { DbUser } from '@/data/db/types/user'
import { LOOKING_FOR, ProfileCreationRequest, ProfileResponse } from '@shared/types'
import { calculateProfileCompleteness } from '@shared/lib'
import { ObjectId } from 'mongodb'
import { ErrorCode, ServiceException } from '@/features/error'
import { isNil } from '@/utils'

export const profileService = {
  createProfile: async (userId: string, data: ProfileCreationRequest): Promise<ProfileResponse> => {
    const userCollection = await getUserCollection()
    const userObjectId = new ObjectId(userId)

    const user = await userCollection.findOne({ _id: userObjectId })
    if (isNil(user)) {
      throw new ServiceException('err.user.not_found', ErrorCode.NOT_FOUND)
    }

    const completionScore = calculateProfileCompleteness(data)

    const preferences = user.preferences ?? {
      ageRange: 5,
      lookingFor: LOOKING_FOR.ALL,
    }

    const updates: Partial<DbUser> = {
      profile: {
        nickName: data.nickName,
        age: data.age,
        gender: data.gender,
        bio: data.bio,
        interest: data.interests,
        photos: data.photos,
        voiceIntro: data.voiceIntro,
        questions: data.questions,
      },
      preferences,
      profileCompletion: completionScore,
      updatedAt: new Date(),
    }

    await userCollection.updateOne({ _id: userObjectId }, { $set: updates })

    return {
      isComplete: true,
      profile: data,
    }
  },

  updateProfile: async (userId: string, data: ProfileCreationRequest): Promise<ProfileResponse> => {
    const userCollection = await getUserCollection()
    const userObjectId = new ObjectId(userId)

    const user = await userCollection.findOne({ _id: userObjectId })
    if (isNil(user)) {
      throw new ServiceException('err.user.not_found', ErrorCode.NOT_FOUND)
    }

    const completionScore = calculateProfileCompleteness(data)

    const updates: Partial<DbUser> = {
      profile: {
        nickName: data.nickName,
        age: data.age,
        gender: data.gender,
        bio: data.bio,
        interest: data.interests,
        photos: data.photos,
        voiceIntro: data.voiceIntro,
        questions: data.questions,
      },
      profileCompletion: completionScore,
      updatedAt: new Date(),
    }

    await userCollection.updateOne({ _id: userObjectId }, { $set: updates })

    return {
      isComplete: true,
      profile: data,
    }
  },

  getProfile: async (userId: string): Promise<ProfileResponse> => {
    const userCollection = await getUserCollection()
    const user = await userCollection.findOne({ _id: new ObjectId(userId) })

    if (isNil(user)) {
      throw new ServiceException('err.user.not_found', ErrorCode.NOT_FOUND)
    }

    const isComplete = !!user.profile && !!user.preferences

    if (!isComplete || !user.profile) {
      return { isComplete: false }
    }

    const profileData: ProfileCreationRequest = {
      nickName: user.profile.nickName,
      age: user.profile.age,
      gender: user.profile.gender,
      bio: user.profile.bio,
      interests: user.profile.interest,
      photos: user.profile.photos,
      voiceIntro: user.profile.voiceIntro,
      questions: user.profile.questions,
    }

    return {
      isComplete: true,
      profile: profileData,
    }
  },
}
