'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'react-toastify'
import { profileUpdateSchema, type ProfileCreationFormData } from '@shared/validations'
import { getProfile, updateProfile } from '@/features/profile/api/profile'
import { calculateProfileCompleteness } from '@shared/lib'
import { uploadImageToCloudinary } from '@/lib/cloudinary'

export const useProfileForm = (userId: string, pendingPhotoFile: File | null, clearPendingPhoto: () => void) => {
  const [completeness, setCompleteness] = useState(0)
  const [isSaving, setIsSaving] = useState(false)

  const form = useForm<ProfileCreationFormData>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      nickName: '',
      age: 18,
      bio: '',
      interests: [],
      photo: '',
      voiceIntro: '',
      questions: Array(3).fill(null).map(() => ({
        questionId: '',
        audioUrl: '',
        audioFile: undefined
      }))
    }
  })

  const { reset, watch, setValue, handleSubmit } = form
  const formData = watch()

  // Fetch profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getProfile(userId)
        if (data.isComplete && data.profile) {
          const questionsWithDefaults = [...(data.profile.questions || [])]
          while (questionsWithDefaults.length < 3) {
            questionsWithDefaults.push({ questionId: '', audioUrl: '', audioFile: undefined })
          }
          if (questionsWithDefaults.length > 3) {
            questionsWithDefaults.splice(3)
          }
          reset({ ...data.profile, questions: questionsWithDefaults })
        } else {
          reset({
            ...formData,
            questions: Array(3).fill({ questionId: '', audioUrl: '', audioFile: undefined })
          })
        }
      } catch {
        reset({
          ...formData,
          questions: Array(3).fill({ questionId: '', audioUrl: '', audioFile: undefined })
        })
      }
    }
    fetchProfile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reset, userId])

  // Update completeness score
  useEffect(() => {
    const dataForCalculation = pendingPhotoFile
      ? { ...formData, photo: 'pending' }
      : formData
    const score = calculateProfileCompleteness(dataForCalculation)
    setCompleteness(score)
  }, [formData, pendingPhotoFile])

  const onManualSave = async (data: ProfileCreationFormData) => {
    setIsSaving(true)
    try {
      let finalPhotoUrl = data.photo

      if (pendingPhotoFile) {
        const result = await uploadImageToCloudinary(pendingPhotoFile, {
          folder: 'flint/profile-photos',
          maxFileSize: 5 * 1024 * 1024,
          allowedFormats: ['image/jpeg', 'image/png', 'image/webp']
        })
        finalPhotoUrl = result.url
        clearPendingPhoto()
        setValue('photo', finalPhotoUrl, { shouldValidate: true })
      }

      const questionsToSave = await Promise.all(
        data.questions.map(async qa => {
          const audioFile = (qa as { audioFile?: Blob | string }).audioFile
          if (audioFile && audioFile instanceof Blob) {
            // Audio upload logic would go here
            return { questionId: qa.questionId, audioUrl: qa.audioUrl || '' }
          }
          return { questionId: qa.questionId, audioUrl: qa.audioUrl || '' }
        })
      )

      await updateProfile(userId, {
        ...data,
        photo: finalPhotoUrl,
        questions: questionsToSave,
        voiceIntro: data.voiceIntro || ''
      })
      toast.success('Profile updated!')
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Save failed'
      toast.error(message)
    } finally {
      setIsSaving(false)
    }
  }

  return {
    form,
    formData,
    completeness,
    isSaving,
    onSave: handleSubmit(onManualSave)
  }
}