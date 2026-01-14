'use client'

import { useState, useEffect } from 'react'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'react-toastify'
import { getProfile, updateProfile } from '@/features/profile/api/profile'
import { calculateProfileCompleteness } from '@shared/lib'
import { uploadImageToCloudinary, uploadAudioToCloudinary } from '@/lib/cloudinary'
import { profileUpdateSchema, type ProfileCreationFormData } from '@/shared-types/validations'

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
        uploadId: '',
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
            questionsWithDefaults.push({ 
              questionId: '', 
              audioUrl: '', 
              uploadId: '',
              audioFile: undefined 
            })
          }
          if (questionsWithDefaults.length > 3) {
            questionsWithDefaults.splice(3)
          }
          reset({ 
            ...data.profile, 
            photo: data.profile.photo || '',
            voiceIntro: data.profile.voiceIntro || '',
            questions: questionsWithDefaults 
          })
        } else {
          reset({
            ...formData,
            photo: '',
            voiceIntro: '',
            questions: Array(3).fill({ 
              questionId: '', 
              audioUrl: '', 
              uploadId: '',
              audioFile: undefined 
            })
          })
        }
      } catch {
        reset({
          ...formData,
          questions: Array(3).fill({ 
            questionId: '', 
            audioUrl: '', 
            uploadId: '',
            audioFile: undefined 
            })
        })
      }
    }
    fetchProfile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reset, userId])

  // Update completeness score
  useEffect(() => {
    const timer = setTimeout(() => {
      const dataForCalculation = pendingPhotoFile
        ? { ...formData, photo: 'pending' }
        : formData
      const score = calculateProfileCompleteness(dataForCalculation)
      setCompleteness(score)
    }, 500)

    return () => clearTimeout(timer)
  }, [formData, pendingPhotoFile])

  const onManualSave: SubmitHandler<ProfileCreationFormData> = async (data) => {
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

      let finalVoiceIntroUrl = data.voiceIntro
      if (data.voiceIntroFile instanceof Blob) {
        try {
          const result = await uploadAudioToCloudinary(data.voiceIntroFile, {
            folder: 'flint/voice-intros'
          })
          finalVoiceIntroUrl = result.url
        } catch (error) {
          console.error('Failed to upload voice intro:', error)
          throw new Error('Failed to upload voice intro')
        }
      }

      const questionsToSave = await Promise.all(
        data.questions.map(async qa => {
          const audioFile = qa.audioFile
          if (audioFile && audioFile instanceof Blob) {
            try {
              const result = await uploadAudioToCloudinary(audioFile, {
                folder: 'flint/profile-questions'
              })
              return { 
                questionId: qa.questionId, 
                audioUrl: result.url,
                uploadId: result.publicId
              }
            } catch (error) {
              console.error('Failed to upload audio for question:', qa.questionId, error)
              throw new Error(`Failed to upload audio for question: ${qa.questionId}`)
            }
          }
          return { 
            questionId: qa.questionId, 
            audioUrl: qa.audioUrl || '',
            uploadId: qa.uploadId || ''
          }
        })
      )

      await updateProfile(userId, {
        ...data,
        photo: finalPhotoUrl,
        questions: questionsToSave,
        voiceIntro: finalVoiceIntroUrl
      })
      toast.success('Profile updated!')
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Save failed'
      toast.error(message)
    } finally {
      setIsSaving(false)
    }
  }

  const onInvalid = (errors: unknown) => {
    console.error('Form Validation Errors:', errors)
    toast.error('Please fix the errors in your profile')
  }

  return {
    form,
    formData,
    completeness,
    isSaving,
    onSave: handleSubmit(onManualSave, onInvalid)
  }
}


  