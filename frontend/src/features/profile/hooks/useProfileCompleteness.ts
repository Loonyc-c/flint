import { useState, useEffect } from "react";
import {
  calculateProfileCompleteness,
  type ProfileCompletenessResult,
} from "@shared/lib";
import type { ProfileAndContactFormData } from "../schemas/profile-form";
import type {
  ProfileUpdateRequest,
  QuestionAnswerWithFile,
} from "@shared/types";

export const useProfileCompleteness = (
  formData: ProfileAndContactFormData,
  pendingPhotoFile: File | null,
) => {
  const [result, setResult] = useState<ProfileCompletenessResult>({
    score: 0,
    isFeatureUnlocked: false,
    missingFields: [],
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      // Map form data to ProfileUpdateRequest structure for calculation
      const calculationInput: Partial<
        ProfileUpdateRequest & { questions?: QuestionAnswerWithFile[] }
      > = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        nickName: formData.nickName,
        age: formData.age,
        gender: formData.gender,
        bio: formData.bio,
        interests: formData.interests,
        // If a new photo is selected but not uploaded, count it as present
        photo: pendingPhotoFile ? "pending" : formData.photo,
        voiceIntro: formData.voiceIntro,
        questions: formData.questions as QuestionAnswerWithFile[],
        contactInfo: formData.instagram
          ? {
              instagram: {
                userName: formData.instagram,
                isVerified: false,
              },
            }
          : undefined,
      };

      const calculation = calculateProfileCompleteness(calculationInput);
      setResult(calculation);
    }, 500);
    return () => clearTimeout(timer);
  }, [formData, pendingPhotoFile]);

  return result;
};
