'use client'

import { useState } from 'react'
import { useAuthenticatedUser } from '@/features/auth/context/UserContext'
import { ProfileAvatar } from './avatar/ProfileAvatar'
import { BasicInfoSection, BioSection } from './info/BasicInfoSections'
import { InterestsSection, InterestsModal } from './interests/InterestsSection'
import { QuestionsSection } from './questions/QuestionsSection'
import { VoiceIntroWidget } from './voice/VoiceIntroWidget'
import { useProfilePhoto } from '../hooks/useProfilePhoto'
import { useProfileForm } from '../hooks/useProfileForm'
import { type INTERESTS } from '@shared/types/enums'

// =============================================================================
// Sub-Components
// =============================================================================

interface SaveButtonProps {
  onClick: () => void
  isSaving: boolean
  hasPendingPhoto: boolean
}

const SaveProfileButton = ({ onClick, isSaving, hasPendingPhoto }: SaveButtonProps) => (
  <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-xs px-4 z-40">
    <button
      onClick={onClick}
      disabled={isSaving}
      className="w-full bg-brand hover:bg-brand-300 text-white font-black py-5 rounded-2xl shadow-2xl shadow-brand/40 transition-all active:scale-95 disabled:opacity-50 tracking-widest text-sm cursor-pointer"
    >
      {isSaving ? (hasPendingPhoto ? 'UPLOADING PHOTO...' : 'SAVING...') : 'SAVE PROFILE'}
    </button>
  </div>
)

// =============================================================================
// Main Component
// =============================================================================

export const ProfilePage = () => {
  const { user } = useAuthenticatedUser()
  const [showInterestsModal, setShowInterestsModal] = useState(false)

  const {
    fileInputRef,
    pendingPhotoFile,
    photoPreviewUrl,
    handlePhotoSelect,
    clearPendingPhoto,
    triggerFileInput
  } = useProfilePhoto()

  const { form, formData, completeness, isSaving, onSave } = useProfileForm(
    user.id,
    pendingPhotoFile,
    clearPendingPhoto
  )

  const {
    register,
    setValue,
    formState: { errors }
  } = form

  const toggleInterest = (interest: INTERESTS) => {
    const current = formData.interests || []
    const updated = current.includes(interest)
      ? current.filter(i => i !== interest)
      : [...current, interest]
    setValue('interests', updated, { shouldValidate: true })
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-black pb-32">
      <main className="max-w-2xl mx-auto p-4 space-y-6">
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
          onEdit={triggerFileInput}
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
          onUpdateQuestions={updatedQuestions =>
            setValue('questions', updatedQuestions, { shouldValidate: true })
          }
          error={errors.questions?.message}
        />

        <VoiceIntroWidget />

        <SaveProfileButton
          onClick={onSave}
          isSaving={isSaving}
          hasPendingPhoto={!!pendingPhotoFile}
        />
      </main>

      <InterestsModal
        isOpen={showInterestsModal}
        onClose={() => setShowInterestsModal(false)}
        selectedInterests={formData.interests || []}
        onToggle={toggleInterest}
      />
    </div>
  )
}