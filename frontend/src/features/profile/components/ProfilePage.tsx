'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { profileUpdateSchema, ProfileCreationFormData } from '@shared/validations'
import { getProfile, updateProfile } from '@/features/profile/api/profile'
import { toast } from 'react-toastify'
import { calculateProfileCompleteness } from '@shared/lib'
import { INTERESTS } from '@shared/types/enums'

import { ProfileHeader } from './ProfileHeader'
import { ProfileAvatar } from './ProfileAvatar'
import { BasicInfoSection, BioSection } from './BasicInfoSections'
import { InterestsSection, InterestsModal } from './InterestsSection'
import { QuestionsSection, QuestionsModal } from './QuestionsSection'
import { VoiceIntroWidget } from './VoiceIntroWidget'
import { useAuthenticatedUser } from '@/features/auth/context/UserContext'
import { useRef } from 'react'

export const ProfilePage = () => {
  const { user } = useAuthenticatedUser()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [completeness, setCompleteness] = useState(0)
  const [isSaving, setIsLoading] = useState(false)
  const [showInterestsModal, setShowInterestsModal] = useState(false)
  const [activeQuestionSlot, setActiveQuestionSlot] = useState<number | null>(null)

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

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getProfile(user.id)
        if (data.isComplete && data.profile) {
          reset(data.profile)
        }
      } catch {
        // Requirement 14: Removed detailed error logging
        // Profile fetch errors are handled by showing empty form
      }
    }
    fetchProfile()
  }, [reset, user.id])

  useEffect(() => {
    const score = calculateProfileCompleteness(formData)
    setCompleteness(score)
  }, [formData])

  const toggleInterest = (interest: INTERESTS) => {
    const current = formData.interests || []
    if (current.includes(interest)) {
      setValue(
        'interests',
        current.filter(i => i !== interest),
        { shouldValidate: true }
      )
    } else {
      setValue('interests', [...current, interest], { shouldValidate: true })
    }
  }

  const selectQuestion = (questionId: string) => {
    if (activeQuestionSlot === null) return
    const currentQuestions = [...(formData.questions || [])]
    currentQuestions[activeQuestionSlot] = { questionId, audioUrl: '' }
    setValue('questions', currentQuestions, { shouldValidate: true })
    setActiveQuestionSlot(null)
  }

  const onManualSave = async (data: ProfileCreationFormData) => {
    setIsLoading(true)
    try {
      await updateProfile(user.id, data)
      toast.success('Profile updated!')
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Save failed'
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Create a fake local URL for preview
      // In a real app, you'd upload to S3/Cloudinary here and get a URL back
      const objectUrl = URL.createObjectURL(file)
      setValue('photo', objectUrl, { shouldValidate: true })
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-black pb-32">
      <ProfileHeader />

      <main className="max-w-2xl mx-auto p-4 space-y-6 mt-4">
        {/* Hidden File Input */}
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*"
          onChange={handlePhotoUpload}
        />
        
        <ProfileAvatar 
          photo={formData.photo || ''} 
          completeness={completeness}
          onEdit={() => fileInputRef.current?.click()}
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
            className="w-full bg-brand hover:bg-brand-300 text-white font-black py-5 rounded-2xl shadow-2xl shadow-brand/40 transition-all active:scale-95 disabled:opacity-50 tracking-widest text-sm"
          >
            {isSaving ? 'SYNCING...' : 'SAVE PROFILE'}
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
