import { useState, useEffect } from 'react'
import { calculateProfileCompleteness, type ProfileCompletenessResult } from '@shared/lib'
import type { ProfileAndContactFormData } from '../schemas/profile-form'

export const useProfileCompleteness = (
    formData: ProfileAndContactFormData,
    pendingPhotoFile: File | null
) => {
    const [result, setResult] = useState<ProfileCompletenessResult>({
        score: 0,
        isFeatureUnlocked: false,
        missingFields: []
    })

    useEffect(() => {
        const timer = setTimeout(() => {
            const dataForCalculation = pendingPhotoFile ? { ...formData, photo: 'pending' } : formData
            const { instagram, ...profileData } = dataForCalculation

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const calculation = calculateProfileCompleteness(profileData as any, {
                instagram: instagram || undefined
            })
            setResult(calculation)
        }, 500)
        return () => clearTimeout(timer)
    }, [formData, pendingPhotoFile])

    return result
}
