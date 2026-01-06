import { z } from "zod";
import { USER_GENDER, INTERESTS } from "../types/enums";
import { nameSchema } from "../validations/auth.validation";

export const GenderEnum = z.nativeEnum(USER_GENDER);
export const InterestEnum = z.nativeEnum(INTERESTS);

export const questionAnswerSchema = z.object({
  questionId: z.string().min(1, "Question ID is required"),
  audioUrl: z.string().url("Invalid audio URL"),
});

export const profileUpdateSchema = z.object({
  nickName: nameSchema,
  age: z
    .number()
    .min(18, "You must be at least 18 years old")
    .max(100, "Invalid age"),
  gender: GenderEnum,
  bio: z.string().max(500, "Bio must be under 500 characters"),
  interests: z.array(InterestEnum).min(3, "Select at least one interest"),
  photos: z.array(z.string().url()).min(1, "Upload at least one photo"),
  voiceIntro: z.string().url("Invalid voice intro URL"),
  questions: z
    .array(questionAnswerSchema)
    .length(3, "Please answer exactly 3 questions"),
});

export type ProfileCreationFormData = z.infer<typeof profileUpdateSchema>;
