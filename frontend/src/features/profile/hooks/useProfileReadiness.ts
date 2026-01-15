'use client'

import { useState, useEffect, useCallback } from 'react'
import { getProfile, getContactInfo } from '../api/profile'
import { calculateProfileCompleteness, type ProfileCompletenessResult } from '@shared/lib/profile/calculator'
import { useUser } from '@/features/auth/context/UserContext'

export const useProfileReadiness = () => {
  const { user } = useUser()
  const [readiness, setReadiness] = useState<ProfileCompletenessResult | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const checkReadiness = useCallback(async () => {
    if (!user?.id) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      // Parallel fetch for profile and contact info
      const [profileRes, contactRes] = await Promise.all([
        getProfile(user.id),
        getContactInfo(user.id)
      ])

      const profileData = profileRes.profile || {}
      const contactData = contactRes.contactInfo || { verifiedPlatforms: [] }

      const result = calculateProfileCompleteness(profileData, contactData)
      setReadiness(result)
    } catch (err) {
      console.error('Failed to check profile readiness:', err)
      setError('Could not verify profile completeness')
    } finally {
      setIsLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    checkReadiness()
  }, [checkReadiness])

  return {
    score: readiness?.score || 0,
    missingFields: readiness?.missingFields || [],
    isReady: (readiness?.score || 0) >= 80,
    isLoading,
    error,
    refresh: checkReadiness
  }
}
