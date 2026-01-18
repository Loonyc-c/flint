import { useState } from "react";
import { toast } from "react-toastify";
import type { UseFormSetValue } from "react-hook-form";
import {
  uploadImageToCloudinary,
  uploadAudioToCloudinary,
} from "@/lib/cloudinary";
import type { ProfileCreationFormData } from "@/shared-types/validations";
import type { ProfileAndContactFormData } from "../schemas/profile-form";
import { useProfileSync } from "./useProfileSync";

export const useProfileSave = (
  userId: string,
  setValue: UseFormSetValue<ProfileAndContactFormData>,
  pendingPhotoFile: File | null,
  clearPendingPhoto: () => void,
) => {
  const [isSaving, setIsSaving] = useState(false);
  const { saveProfileData } = useProfileSync(userId);

  const onManualSave = async (data: ProfileAndContactFormData) => {
    setIsSaving(true);
    try {
      // PRE-SAVE VALIDATION: Ensure all 3 questions have valid audio
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const questionsWithAudio = data.questions.filter((q: any) => {
        const hasAudioFile = q.audioFile instanceof Blob;
        const hasExistingAudio = q.audioUrl && q.uploadId;
        return q.questionId && (hasAudioFile || hasExistingAudio);
      });

      if (questionsWithAudio.length !== 3) {
        const missingQuestions: number[] = [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data.questions.forEach((q: any, index: number) => {
          const hasAudioFile = q.audioFile instanceof Blob;
          const hasExistingAudio = q.audioUrl && q.uploadId;
          if (!q.questionId || (!hasAudioFile && !hasExistingAudio)) {
            missingQuestions.push(index + 1);
          }
        });
        toast.error(
          `Please complete all 3 questions with audio recordings. Missing or incomplete: Question ${missingQuestions.join(", ")}`,
        );
        return;
      }

      let finalPhotoUrl = data.photo;
      if (pendingPhotoFile) {
        const result = await uploadImageToCloudinary(pendingPhotoFile, {
          folder: "flint/profile-photos",
          maxFileSize: 5 * 1024 * 1024,
          allowedFormats: ["image/jpeg", "image/png", "image/webp"],
        });
        finalPhotoUrl = result.url;
        clearPendingPhoto();
        setValue("photo", finalPhotoUrl, { shouldValidate: true });
      }

      let finalVoiceIntroUrl = data.voiceIntro;
      if (data.voiceIntroFile instanceof Blob) {
        const result = await uploadAudioToCloudinary(data.voiceIntroFile, {
          folder: "flint/voice-intros",
        });
        finalVoiceIntroUrl = result.url;
        setValue("voiceIntro", finalVoiceIntroUrl, { shouldValidate: true });
        setValue("voiceIntroFile", undefined);
      }

      const questionsToSave = await Promise.all(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data.questions.map(async (qa, index: number) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const question = qa as any;
          if (question.audioFile instanceof Blob) {
            const result = await uploadAudioToCloudinary(question.audioFile, {
              folder: "flint/profile-questions",
            });
            const updated = {
              questionId: question.questionId,
              audioUrl: result.url,
              uploadId: result.publicId,
            };
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setValue(`questions.${index}.audioUrl` as any, updated.audioUrl);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setValue(`questions.${index}.uploadId` as any, updated.uploadId);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setValue(`questions.${index}.audioFile` as any, undefined);
            return updated;
          }
          return {
            questionId: question.questionId,
            audioUrl: question.audioUrl,
            uploadId: question.uploadId,
          };
        }),
      );

      const {
        voiceIntroFile: _voiceIntroFile,
        instagram,
        ...profilePayload
      } = data;
      const profileToUpdate: ProfileCreationFormData = {
        ...profilePayload,
        photo: finalPhotoUrl || data.photo,
        questions: questionsToSave,
        voiceIntro: finalVoiceIntroUrl || data.voiceIntro || "",
        contactInfo: {
          instagram: {
            userName: instagram,
            isVerified: false,
          },
        },
      } as ProfileCreationFormData;

      await saveProfileData(profileToUpdate);
    } finally {
      setIsSaving(false);
    }
  };

  return { isSaving, onManualSave };
};
