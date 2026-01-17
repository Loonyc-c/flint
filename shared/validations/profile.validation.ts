import { z } from "zod";
import { USER_GENDER, INTERESTS } from "../types/enums";
import { nameSchema } from "../validations/auth.validation";
import { QUESTION_POOL } from "../types/questions"; // Import QUESTION_POOL

export const GenderEnum = z.nativeEnum(USER_GENDER);
export const InterestEnum = z.nativeEnum(INTERESTS);

export const contactInfoSchema = z.object({
  instagram: z.string().min(1, "Instagram handle is required so your matches can connect with you after Stage 2.").max(50, "Instagram handle too long"),
  verifiedPlatforms: z.array(z.string()).default([]),
});

export type ContactInfoFormData = z.infer<typeof contactInfoSchema>;

export const questionAnswerSchema = z.object({
  questionId: z.string().min(1, "Question ID is required").refine(
    (id) => QUESTION_POOL.some(q => q.id === id),
    { message: "Question ID not found in the QUESTION_POOL" }
  ),
  audioUrl: z.string().url("Invalid audio URL"),
  uploadId: z.string().min(1, "Upload ID is required"),
});

export const profileUpdateSchema = z.object({
  firstName: nameSchema.optional(),
  lastName: nameSchema.optional(),
  nickName: nameSchema.optional(),
  age: z
    .number()
    .min(18, "You must be at least 18 years old")
    .max(100, "Invalid age")
    .optional(),
  gender: GenderEnum.optional(),
  bio: z.string().max(500, "Bio must be under 500 characters").optional(),
  interests: z.array(InterestEnum).optional(),
  photo: z.string().optional(),
  voiceIntro: z.string().optional(),
  questions: z.array(questionAnswerSchema).optional(),
  contact: contactInfoSchema.optional(),
});

export type ProfileCreationFormData = z.infer<typeof profileUpdateSchema>;