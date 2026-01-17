'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  formSchema,
  type ProfileAndContactFormData
} from '../schemas/profile-form'
import { useProfileInit } from './useProfileInit'
import { useProfileCompleteness } from './useProfileCompleteness'
import { useProfileSave } from './useProfileSave'
import { onInvalid } from '../utils/form-errors'

export type { ProfileAndContactFormData }

export const useProfileForm = (
  userId: string,
  pendingPhotoFile: File | null,
  clearPendingPhoto: () => void
) => {
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

  // Hooks
  useProfileInit(userId, reset)
  const completeness = useProfileCompleteness(formData, pendingPhotoFile)
  const { isSaving, onManualSave } = useProfileSave(userId, setValue, pendingPhotoFile, clearPendingPhoto)

  return {
    form,
    formData,
    completeness,
    isSaving,
    onSave: handleSubmit(onManualSave, onInvalid)
  }
}
