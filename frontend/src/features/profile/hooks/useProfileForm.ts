'use client'

import { useState, useEffect } from 'react'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'react-toastify'
import { getProfile, updateProfile, getContactInfo, updateContactInfo } from '@/features/profile/api/profile';
import { calculateProfileCompleteness } from '@shared/lib';
import { uploadImageToCloudinary } from '@/lib/cloudinary'
import { profileUpdateSchema, type ProfileCreationFormData, contactInfoSchema } from '@/shared-types/validations'
import { z } from 'zod'

// Combine schemas for the form
const formSchema = profileUpdateSchema.extend({
  instagram: contactInfoSchema.shape.instagram.optional(),
  phone: contactInfoSchema.shape.phone.optional(),
});
type ProfileAndContactFormData = z.infer<typeof formSchema>;


export const useProfileForm = (userId: string, pendingPhotoFile: File | null, clearPendingPhoto: () => void) => {
  const [completeness, setCompleteness] = useState(0);
  const [isSaving, setIsSaving] = useState(false)

  const form = useForm<ProfileAndContactFormData>({
    resolver: zodResolver(formSchema),
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
      })),
      instagram: '',
      phone: '',
    }
  })

  const { reset, watch, setValue, handleSubmit } = form
  const formData = watch()

  // Fetch profile and contact info on mount
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const [profileRes, contactRes] = await Promise.all([
          getProfile(userId),
          getContactInfo(userId),
        ])
        
        let combinedData: Partial<ProfileAndContactFormData> = {}

        if (profileRes.isComplete && profileRes.profile) {
          const questionsWithDefaults = [...(profileRes.profile.questions || [])]
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

          combinedData = {
            ...profileRes.profile,
            photo: profileRes.profile.photo || '',
            voiceIntro: profileRes.profile.voiceIntro || '',
            questions: questionsWithDefaults
          }
        }
        
        if (contactRes.contactInfo) {
          combinedData.instagram = contactRes.contactInfo.instagram || '';
          combinedData.phone = contactRes.contactInfo.phone || '';
        }

        reset(combinedData)

      } catch {
        // Reset to default empty state on error
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
          instagram: '',
          phone: '',
        })
      }
    }
    fetchAllData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reset, userId])

  // Update completeness score
  useEffect(() => {
    const timer = setTimeout(() => {
      const dataForCalculation = pendingPhotoFile
        ? { ...formData, photo: 'pending' }
        : formData;
      const { score } = calculateProfileCompleteness(dataForCalculation);
      setCompleteness(score);
    }, 500);

    return () => clearTimeout(timer);
  }, [formData, pendingPhotoFile]);

  const onManualSave: SubmitHandler<ProfileAndContactFormData> = async (data) => {
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

      const finalVoiceIntroUrl = data.voiceIntro;

      const questionsToSave = data.questions.map(qa => ({
        questionId: qa.questionId,
        audioUrl: qa.audioUrl || '',
        uploadId: qa.uploadId || '',
      }));

      const { instagram, phone, ...profilePayload } = data;
      
      const profileToUpdate: ProfileCreationFormData = {
        ...profilePayload,
        photo: finalPhotoUrl,
        questions: questionsToSave,
        voiceIntro: finalVoiceIntroUrl,
      } as ProfileCreationFormData;
      
      await Promise.all([
        updateProfile(userId, profileToUpdate),
        updateContactInfo(userId, { instagram: instagram || "", phone: phone || "" })
      ])
      
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


  