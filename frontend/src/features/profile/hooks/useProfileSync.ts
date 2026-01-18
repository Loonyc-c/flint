import { getProfile, updateProfile } from '@/features/profile/api/profile'
import { toast } from 'react-toastify'
import type { ProfileCreationFormData } from '@/shared-types/validations'

export const useProfileSync = (userId: string) => {
  const fetchProfileData = async () => {
    try {
      const [profileRes] = await Promise.all([
        getProfile(userId),
      ])
      return { profileRes }
    } catch (error) {
      console.error(error)
      return null
    }
  }

  const saveProfileData = async (
    profileToUpdate: ProfileCreationFormData,
    _instagram: string
  ) => {
    try {
      await updateProfile(userId, profileToUpdate)
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
