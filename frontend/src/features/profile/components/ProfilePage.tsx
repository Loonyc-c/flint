"use client";

import { useState } from "react";

import { useAuthenticatedUser } from "@/features/auth/context/UserContext";

import { ProfileAvatar } from "./avatar/ProfileAvatar";

import { BasicInfoSection, BioSection } from "./info/BasicInfoSections";

import { InterestsSection, InterestsModal } from "./interests/InterestsSection";

import { QuestionsSection } from "./questions/QuestionsSection";

import { VoiceIntroWidget } from "./voice/VoiceIntroWidget";

import { useProfilePhoto } from "../hooks/useProfilePhoto";

import { useProfileForm } from "../hooks/useProfileForm";

import { type INTERESTS } from "@shared/types/enums";

import { useTranslations } from "next-intl";

// =============================================================================

// Sub-Components

// =============================================================================

interface SaveButtonProps {
  onClick: () => void;

  isSaving: boolean;

  hasPendingPhoto: boolean;

  className?: string;
}

const MobileSaveButton = ({
  onClick,
  isSaving,
  hasPendingPhoto,
}: SaveButtonProps) => {
  const t = useTranslations("profile.page");

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-xs px-4 z-40 lg:hidden">
      <button
        onClick={onClick}
        disabled={isSaving}
        className="w-full bg-brand hover:bg-brand-300 text-white font-black py-5 rounded-2xl shadow-2xl shadow-brand/40 transition-all active:scale-95 disabled:opacity-50 tracking-widest text-sm cursor-pointer"
      >
        {isSaving
          ? hasPendingPhoto
            ? t("uploading")
            : t("saving")
          : t("saveProfile")}
      </button>
    </div>
  );
};

const DesktopSaveButton = ({
  onClick,
  isSaving,
  hasPendingPhoto,
  className,
}: SaveButtonProps) => {
  const t = useTranslations("profile.page");

  return (
    <button
      onClick={onClick}
      disabled={isSaving}
      className={`w-full bg-brand hover:bg-brand-300 text-white font-black py-4 rounded-xl shadow-xl shadow-brand/20 transition-all active:scale-95 disabled:opacity-50 tracking-widest text-sm cursor-pointer ${className}`}
    >
      {isSaving
        ? hasPendingPhoto
          ? t("uploading")
          : t("saving")
        : t("saveChanges")}
    </button>
  );
};

// =============================================================================

// Main Component

// =============================================================================

export const ProfilePage = () => {
  const { user } = useAuthenticatedUser();

  const [showInterestsModal, setShowInterestsModal] = useState(false);

  const {
    fileInputRef,

    pendingPhotoFile,

    photoPreviewUrl,

    handlePhotoSelect,

    clearPendingPhoto,

    triggerFileInput,
  } = useProfilePhoto();

  const { form, formData, completeness, isSaving, onSave } = useProfileForm(
    user.id,

    pendingPhotoFile,

    clearPendingPhoto
  );

  const {
    register,

    setValue,

    formState: { errors },
  } = form;

  const toggleInterest = (interest: INTERESTS) => {
    const current = formData.interests || [];

    const updated = current.includes(interest)
      ? current.filter((i) => i !== interest)
      : [...current, interest];

    setValue("interests", updated, { shouldValidate: true });
  };

  return (
    <div className="bg-neutral-50 dark:bg-black pb-32 lg:pb-12">
      <main className="max-w-7xl mx-auto p-4 lg:p-8">
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/jpeg,image/png,image/webp"
          onChange={handlePhotoSelect}
        />

        <div className="lg:grid lg:grid-cols-12 lg:gap-12 lg:items-start">
          {/* Sidebar (Avatar & Actions) */}

          <div className="lg:col-span-4 space-y-6">
            <div className="lg:sticky lg:top-8 space-y-8">
              <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 shadow-sm border border-neutral-100 dark:border-neutral-800">
                <ProfileAvatar
                  photo={photoPreviewUrl || formData.photo || ""}
                  completeness={completeness}
                  onEdit={triggerFileInput}
                  isUploading={isSaving && !!pendingPhotoFile}
                />
              </div>

              {/* Desktop Voice Intro */}

              <div className="hidden lg:block">
                <VoiceIntroWidget
                  initialVoiceIntro={formData.voiceIntroFile || formData.voiceIntro}
                  onVoiceChange={(audio) =>
                    setValue("voiceIntroFile", audio, { shouldValidate: true })
                  }
                />
              </div>

              {/* Desktop Save Button */}

              <div className="hidden lg:block">
                <DesktopSaveButton
                  onClick={onSave}
                  isSaving={isSaving}
                  hasPendingPhoto={!!pendingPhotoFile}
                />
              </div>
            </div>
          </div>

          {/* Main Content (Forms) */}

          <div className="lg:col-span-8 space-y-6 mt-6 lg:mt-0">
            <BasicInfoSection register={register} errors={errors} />

            <BioSection register={register} errors={errors} />

            <InterestsSection
              selectedInterests={formData.interests || []}
              onEdit={() => setShowInterestsModal(true)}
              error={errors.interests?.message}
            />

            <QuestionsSection
              questions={formData.questions || []}
              onUpdateQuestions={(updatedQuestions) =>
                setValue("questions", updatedQuestions, {
                  shouldValidate: true,
                })
              }
              error={errors.questions?.message}
            />

            {/* Mobile Voice Intro */}

            <div className="lg:hidden">
              <VoiceIntroWidget
                initialVoiceIntro={formData.voiceIntroFile || formData.voiceIntro}
                onVoiceChange={(audio) =>
                  setValue("voiceIntroFile", audio, { shouldValidate: true })
                }
              />
            </div>
          </div>
        </div>

        <MobileSaveButton
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
  );
};
