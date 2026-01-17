import { useState, useEffect } from 'react'
import { calculateProfileCompleteness } from '@shared/lib'
import type { ProfileAndContactFormData } from '../schemas/profile-form'

export const useProfileCompleteness = (
    formData: ProfileAndContactFormData,
    pendingPhotoFile: File | null
) => {
    const [completeness, setCompleteness] = useState(0)

    useEffect(() => {
        const timer = setTimeout(() => {
            const dataForCalculation = pendingPhotoFile ? { ...formData, photo: 'pending' } : formData
            const { instagram, ...profileData } = dataForCalculation

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { score } = calculateProfileCompleteness(profileData as any, {
                instagram: instagram || undefined
            })
            setCompleteness(score)
        }, 500)
        return () => clearTimeout(timer)
    }, [formData, pendingPhotoFile])

    return completeness
}
