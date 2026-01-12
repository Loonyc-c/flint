'use client'

import { Target, MapPin } from 'lucide-react'
import { useEffect, useState, useRef } from 'react'
import { useUser } from '@/features/auth/context/UserContext'
import { getReference, updateReference } from '../api/reference'
import { type UserPreferences } from '@shared/types'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { RangeSlider } from '@/components/ui/range-slider'
import { GenderSelector } from './matching/GenderSelector'

const MAX_DISTANCE = 50

const MatchingPref = () => {
  const { user } = useUser()
  const [preferences, setPreferences] = useState<UserPreferences | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const preferencesRef = useRef<UserPreferences | null>(null)
  const initialPreferencesRef = useRef<UserPreferences | null>(null)
  const userIdRef = useRef<string | undefined>(undefined)

  useEffect(() => {
    preferencesRef.current = preferences
    userIdRef.current = user?.id
  }, [preferences, user?.id])

  useEffect(() => {
    const fetchPreferences = async () => {
      if (!user?.id) return
      try {
        const data = await getReference(user.id)
        setPreferences(data)
        initialPreferencesRef.current = data
        preferencesRef.current = data
      } catch (error) {
        console.error('Failed to fetch preferences:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPreferences()
  }, [user?.id])

  useEffect(() => {
    return () => {
      const currentPrefs = preferencesRef.current
      const initialPrefs = initialPreferencesRef.current
      const userId = userIdRef.current

      if (!userId || !currentPrefs || !initialPrefs) return

      const isDirty =
        currentPrefs.ageRange !== initialPrefs.ageRange ||
        currentPrefs.lookingFor !== initialPrefs.lookingFor

      if (isDirty) {
        updateReference(
          userId,
          {
            ageRange: currentPrefs.ageRange,
            lookingFor: currentPrefs.lookingFor,
          },
          { keepalive: true }
        ).catch((err) => {
          console.error('Failed to save preferences on exit:', err)
        })
      }
    }
  }, [])

  const handleUpdate = (updates: Partial<UserPreferences>) => {
    if (!preferences) return
    setPreferences({ ...preferences, ...updates })
  }

  if (isLoading) {
    return <LoadingSpinner />
  }

  return (
    <div className="flex justify-center w-full">
      <div className="flex flex-col w-full gap-8 p-6 bg-white border border-gray-200 shadow-sm max-w-160 dark:bg-neutral-800 dark:border-neutral-700 rounded-2xl sm:p-8 md:p-10">
        <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-neutral-700">
          <div className="flex items-center gap-3 text-neutral-900 dark:text-neutral-100">
            <Target className="w-6 h-6 text-brand" />
            <h2 className="text-xl font-bold sm:text-2xl">Matching Range</h2>
          </div>
        </div>

        <RangeSlider
          label="Age range"
          value={preferences?.ageRange ?? 30}
          min={18}
          max={60}
          unit="years"
          onChange={(val) => handleUpdate({ ageRange: val })}
        />

        <GenderSelector
          value={preferences?.lookingFor}
          onChange={(val) => handleUpdate({ lookingFor: val })}
        />

        <div className="flex flex-col gap-4 opacity-50 cursor-not-allowed">
          <div className="flex items-center gap-3 text-neutral-900 dark:text-neutral-100">
            <MapPin className="w-5 h-5 text-brand" />
            <span className="text-base font-medium sm:text-lg">
              Maximum Distance (Coming Soon)
            </span>
          </div>

          <RangeSlider
            label="Distance"
            value={MAX_DISTANCE}
            min={1}
            max={500}
            unit="km"
            disabled
            helperText="Location-based matching is being implemented."
          />
        </div>
      </div>
    </div>
  )
}

export default MatchingPref