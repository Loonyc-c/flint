import { useEffect } from 'react'
import type { UseFormReset } from 'react-hook-form'
import type { ProfileAndContactFormData } from '../schemas/profile-form'
import { useProfileSync } from './useProfileSync'

export const useProfileInit = (
    userId: string,
    reset: UseFormReset<ProfileAndContactFormData>
) => {
    const { fetchProfileData } = useProfileSync(userId)

    useEffect(() => {
        const init = async () => {
            const data = await fetchProfileData()
            if (data) {
                const { profileRes, contactRes } = data
                let combinedData: Partial<ProfileAndContactFormData> = {}

                if (profileRes.isComplete && profileRes.profile) {
                    const questionsWithDefaults = (profileRes.profile.questions || []).map(q => ({
                        ...q,
                        audioFile: undefined
                    }))
                    while (questionsWithDefaults.length < 3) {
                        questionsWithDefaults.push({
                            questionId: '',
                            audioUrl: '',
                            uploadId: '',
                            audioFile: undefined
                        })
                    }
                    if (questionsWithDefaults.length > 3) questionsWithDefaults.splice(3)

                    combinedData = {
                        ...profileRes.profile,
                        photo: profileRes.profile.photo || '',
                        voiceIntro: profileRes.profile.voiceIntro || '',
                        questions: questionsWithDefaults,
                        voiceIntroFile: undefined
                    }
                }

                if (contactRes.contactInfo) {
                    combinedData.instagram = contactRes.contactInfo.instagram || ''
                }
                reset(combinedData)
            } else {
                // Reset to default if fetch failed or empty
                reset({
                    nickName: '',
                    age: 18,
                    bio: '',
                    interests: [],
                    photo: '',
                    voiceIntro: '',
                    questions: Array(3).fill({
                        questionId: '',
                        audioUrl: '',
                        uploadId: '',
                        audioFile: undefined
                    }),
                    instagram: ''
                })
            }
        }
        init()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [reset, userId])
}
