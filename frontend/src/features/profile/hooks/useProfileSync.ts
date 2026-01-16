import { getProfile, updateProfile, getContactInfo, updateContactInfo } from '@/features/profile/api/profile'
import { toast } from 'react-toastify'
import type { ProfileCreationFormData } from '@/shared-types/validations'

export const useProfileSync = (userId: string) => {
  const fetchProfileData = async () => {
    try {
      const [profileRes, contactRes] = await Promise.all([
        getProfile(userId),
        getContactInfo(userId),
      ])
      return { profileRes, contactRes }
    } catch (error) {
      console.error(error)
      return null
    }
  }

  const saveProfileData = async (
    profileToUpdate: ProfileCreationFormData,
    instagram: string
  ) => {
    try {
      await Promise.all([
        updateProfile(userId, profileToUpdate),
        updateContactInfo(userId, {
          instagram: instagram || '',
          verifiedPlatforms: [],
        }),
      ])
      toast.success('Profile updated!')
      return true
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Save failed'
      toast.error(message)
      return false
    }
  }

  return { fetchProfileData, saveProfileData }
}
