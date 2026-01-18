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
            const profileData = { ...dataForCalculation }

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const calculation = calculateProfileCompleteness({
                ...profileData,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                contactInfo: (profileData as any).instagram ? {
                    instagram: {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        userName: (profileData as any).instagram,
                        isVerified: false
                    }
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                } : (profileData as any).contactInfo
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any)
            setResult(calculation)
        }, 500)
        return () => clearTimeout(timer)
    }, [formData, pendingPhotoFile])

    return result
}
