'use client'

import { useState, useEffect } from 'react'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'react-toastify'
import { calculateProfileCompleteness } from '@shared/lib'
import { uploadImageToCloudinary, uploadAudioToCloudinary } from '@/lib/cloudinary'
import {
  profileUpdateSchema,
  type ProfileCreationFormData,
  contactInfoSchema
} from '@/shared-types/validations'
import { z } from 'zod'
import { useProfileSync } from './useProfileSync'

// Combine schemas for the form
const formSchema = profileUpdateSchema
  .extend({
    voiceIntro: z.string().optional(), // Make optional in form because it might be in voiceIntroFile
    instagram: contactInfoSchema.shape.instagram,
    voiceIntroFile: z.union([z.instanceof(Blob), z.string()]).optional()
  })
  .refine(data => data.voiceIntro || data.voiceIntroFile, {
    message: 'Please record a voice introduction',
    path: ['voiceIntro']
  })
export type ProfileAndContactFormData = z.infer<typeof formSchema>

export const useProfileForm = (
  userId: string,
  pendingPhotoFile: File | null,
  clearPendingPhoto: () => void
) => {
  const [completeness, setCompleteness] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  const { fetchProfileData, saveProfileData } = useProfileSync(userId)

  const form = useForm<ProfileAndContactFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      nickName: '',
      age: 18,
      bio: '',
      interests: [],
      photo: '',
      voiceIntro: '',
      voiceIntroFile: undefined,
      questions: Array(3)
        .fill(null)
        .map(() => ({ questionId: '', audioUrl: '', uploadId: '', audioFile: undefined })),
      instagram: ''
    }
  })

  const { reset, watch, setValue, handleSubmit } = form
  const formData = watch()

  // Fetch profile and contact info on mount
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

  // Update completeness score
  useEffect(() => {
    const timer = setTimeout(() => {
      const dataForCalculation = pendingPhotoFile ? { ...formData, photo: 'pending' } : formData
      const { instagram, ...profileData } = dataForCalculation
      const { score } = calculateProfileCompleteness(profileData, {
        instagram: instagram || undefined
      })
      setCompleteness(score)
    }, 500)
    return () => clearTimeout(timer)
  }, [formData, pendingPhotoFile])

  const onManualSave: SubmitHandler<ProfileAndContactFormData> = async data => {
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
        const result = await uploadAudioToCloudinary(data.voiceIntroFile, {
          folder: 'flint/voice-intros'
        })
        finalVoiceIntroUrl = result.url
        setValue('voiceIntro', finalVoiceIntroUrl, { shouldValidate: true })
        setValue('voiceIntroFile', undefined)
      }

      const questionsToSave = await Promise.all(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data.questions.map(async (qa, index: number) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const question = qa as any
          if (question.audioFile instanceof Blob) {
            const result = await uploadAudioToCloudinary(question.audioFile, {
              folder: 'flint/profile-questions'
            })
            const updated = {
              questionId: question.questionId,
              audioUrl: result.url,
              uploadId: result.publicId
            }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setValue(`questions.${index}.audioUrl` as any, updated.audioUrl)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setValue(`questions.${index}.uploadId` as any, updated.uploadId)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setValue(`questions.${index}.audioFile` as any, undefined)
            return updated
          }
          return {
            questionId: question.questionId,
            audioUrl: question.audioUrl || '',
            uploadId: question.uploadId || ''
          }
        })
      )

      const { instagram, voiceIntroFile: _voiceIntroFile, ...profilePayload } = data
      const profileToUpdate: ProfileCreationFormData = {
        ...profilePayload,
        photo: finalPhotoUrl || data.photo,
        questions: questionsToSave,
        voiceIntro: finalVoiceIntroUrl || data.voiceIntro || ''
      } as ProfileCreationFormData

      await saveProfileData(profileToUpdate, instagram)
    } finally {
      setIsSaving(false)
    }
  }

  const onInvalid = (errors: unknown) => {
    console.error('=== FORM VALIDATION ERRORS ===')
    console.error(JSON.stringify(errors, null, 2))

    if (errors && typeof errors === 'object') {
      const errorMessages = Object.entries(errors)
        .map(([field, err]) => {
          const errorMsg =
            typeof err === 'object' && err !== null && 'message' in err
              ? String(err.message)
              : 'Invalid'
          return `${field}: ${errorMsg}`
        })
        .join(', ')
      toast.error(`Validation failed: ${errorMessages}`)
    } else {
      toast.error('Please fix the errors in your profile')
    }
  }

  return { form, formData, completeness, isSaving, onSave: handleSubmit(onManualSave, onInvalid) }
}
