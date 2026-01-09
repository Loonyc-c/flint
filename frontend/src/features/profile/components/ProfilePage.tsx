'use client'

import { useState, useEffect, useRef, type ChangeEvent, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'react-toastify'
import { profileUpdateSchema, type ProfileCreationFormData } from '@shared/validations'
import { getProfile, updateProfile } from '@/features/profile/api/profile'
import { calculateProfileCompleteness } from '@shared/lib'
import { type INTERESTS } from '@shared/types/enums'
import { useAuthenticatedUser } from '@/features/auth/context/UserContext'
import { ProfileAvatar } from './ProfileAvatar'
import { BasicInfoSection, BioSection } from './BasicInfoSections'
import { InterestsSection, InterestsModal } from './InterestsSection'
import { QuestionsSection, QuestionsModal } from './QuestionsSection'
import { VoiceIntroWidget } from './VoiceIntroWidget'
import { uploadImageToCloudinary } from '@/lib/cloudinary'

// =============================================================================
// Component
// =============================================================================

/**
 * Main profile page component for viewing and editing user profiles.
 * Manages form state, profile completeness, and various edit modals.
 */
export const ProfilePage = () => {
  const { user } = useAuthenticatedUser()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [completeness, setCompleteness] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  const [showInterestsModal, setShowInterestsModal] = useState(false)
  const [activeQuestionSlot, setActiveQuestionSlot] = useState<number | null>(null)

  // Store pending photo file for upload on save (cost-efficient: only upload when user saves)
  const [pendingPhotoFile, setPendingPhotoFile] = useState<File | null>(null)
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors }
  } = useForm<ProfileCreationFormData>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      nickName: '',
      age: 18,
      bio: '',
      interests: [],
      photo: '',
      questions: []
    }
  })

  const formData = watch()

  // Fetch profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getProfile(user.id)
        if (data.isComplete && data.profile) {
          reset(data.profile)
        }
      } catch {
        // Profile fetch errors result in empty form display
      }
    }
    fetchProfile()
  }, [reset, user.id])

  // Update completeness score when form data or pending photo changes
  useEffect(() => {
    // Include pending photo in completeness calculation (even before save)
    const dataForCalculation = pendingPhotoFile
      ? { ...formData, photo: 'pending' } // Treat pending photo as having a photo
      : formData
    const score = calculateProfileCompleteness(dataForCalculation)
    setCompleteness(score)
  }, [formData, pendingPhotoFile])

  const toggleInterest = (interest: INTERESTS) => {
    const current = formData.interests || []
    const updated = current.includes(interest)
      ? current.filter(i => i !== interest)
      : [...current, interest]
    setValue('interests', updated, { shouldValidate: true })
  }

  const selectQuestion = (questionId: string) => {
    if (activeQuestionSlot === null) return
    const currentQuestions = [...(formData.questions || [])]
    currentQuestions[activeQuestionSlot] = { questionId, audioUrl: '' }
    setValue('questions', currentQuestions, { shouldValidate: true })
    setActiveQuestionSlot(null)
  }

  // Cleanup preview URL on unmount or when preview changes
  useEffect(() => {
    return () => {
      if (photoPreviewUrl) {
        URL.revokeObjectURL(photoPreviewUrl)
      }
    }
  }, [photoPreviewUrl])

  const handlePhotoSelect = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return

      // Validate file before creating preview
      const allowedFormats = ['image/jpeg', 'image/png', 'image/webp']
      const maxFileSize = 5 * 1024 * 1024 // 5MB

      if (!allowedFormats.includes(file.type)) {
        toast.error('Invalid file format. Allowed: JPG, PNG, WebP')
        return
      }

      if (file.size > maxFileSize) {
        toast.error('File size exceeds 5MB limit')
        return
      }

      // Revoke old preview URL to prevent memory leaks
      if (photoPreviewUrl) {
        URL.revokeObjectURL(photoPreviewUrl)
      }

      // Store file for later upload and create local preview (FREE - no Cloudinary cost)
      setPendingPhotoFile(file)
      const previewUrl = URL.createObjectURL(file)
      setPhotoPreviewUrl(previewUrl)

      // Reset input so same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    },
    [photoPreviewUrl]
  )

  const onManualSave = async (data: ProfileCreationFormData) => {
    setIsSaving(true)

    try {
      let finalPhotoUrl = data.photo

      // Only upload to Cloudinary if there's a pending photo file
      if (pendingPhotoFile) {
        const result = await uploadImageToCloudinary(pendingPhotoFile, {
          folder: 'flint/profile-photos',
          maxFileSize: 5 * 1024 * 1024,
          allowedFormats: ['image/jpeg', 'image/png', 'image/webp']
        })
        finalPhotoUrl = result.url

        // Clear pending file after successful upload
        setPendingPhotoFile(null)
        if (photoPreviewUrl) {
          URL.revokeObjectURL(photoPreviewUrl)
          setPhotoPreviewUrl(null)
        }

        // Update form with the Cloudinary URL
        setValue('photo', finalPhotoUrl, { shouldValidate: true })
      }

      // Save profile with the final photo URL
      await updateProfile(user.id, { ...data, photo: finalPhotoUrl })
      toast.success('Profile updated!')
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Save failed'
      toast.error(message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-black pb-32">
      <main className="max-w-2xl mx-auto p-4 space-y-6 mt-4">
        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/jpeg,image/png,image/webp"
          onChange={handlePhotoSelect}
        />

        <ProfileAvatar
          photo={photoPreviewUrl || formData.photo || ''}
          completeness={completeness}
          onEdit={() => fileInputRef.current?.click()}
          isUploading={isSaving && !!pendingPhotoFile}
        />

        <BasicInfoSection register={register} errors={errors} />

        <BioSection register={register} errors={errors} />

        <InterestsSection
          selectedInterests={formData.interests || []}
          onEdit={() => setShowInterestsModal(true)}
          error={errors.interests?.message}
        />

        <QuestionsSection
          questions={formData.questions || []}
          onEditSlot={setActiveQuestionSlot}
          error={errors.questions?.message}
        />

        <VoiceIntroWidget />

        {/* Floating Save Button */}
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-xs px-4 z-40">
          <button
            onClick={handleSubmit(onManualSave)}
            disabled={isSaving}
            className="w-full bg-brand hover:bg-brand-300 text-white font-black py-5 rounded-2xl shadow-2xl shadow-brand/40 transition-all active:scale-95 disabled:opacity-50 tracking-widest text-sm cursor-pointer"
          >
            {isSaving ? (pendingPhotoFile ? 'UPLOADING PHOTO...' : 'SAVING...') : 'SAVE PROFILE'}
          </button>
        </div>
      </main>

      <InterestsModal
        isOpen={showInterestsModal}
        onClose={() => setShowInterestsModal(false)}
        selectedInterests={formData.interests || []}
        onToggle={toggleInterest}
      />

      <QuestionsModal
        slotIndex={activeQuestionSlot}
        onClose={() => setActiveQuestionSlot(null)}
        onSelect={selectQuestion}
        selectedQuestionIds={(formData.questions || []).map(q => q.questionId)}
      />
    </div>
  )
}
