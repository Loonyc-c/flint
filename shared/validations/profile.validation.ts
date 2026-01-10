import { z } from "zod";
import { USER_GENDER, INTERESTS } from "../types/enums";
import { nameSchema } from "../validations/auth.validation";
import { QUESTION_POOL } from "../types/questions"; // Import QUESTION_POOL

export const GenderEnum = z.nativeEnum(USER_GENDER);
export const InterestEnum = z.nativeEnum(INTERESTS);

export const questionAnswerSchema = z.object({
  questionId: z.string().min(1, "Question ID is required").refine(
    (id) => QUESTION_POOL.some(q => q.id === id),
    { message: "Question ID not found in the QUESTION_POOL" }
  ),
  audioUrl: z.string(),
  uploadId: z.string(),
  audioFile: z.union([z.instanceof(Blob), z.string()]).optional(),
});

export const profileUpdateSchema = z.object({
  nickName: nameSchema,
  age: z
    .number()
    .min(18, "You must be at least 18 years old")
    .max(100, "Invalid age"),
  gender: GenderEnum,
  bio: z.string().max(500, "Bio must be under 500 characters"),
  interests: z.array(InterestEnum).min(3, "Select at least three interest"),
  photo: z.string(),
  voiceIntro: z.string(),
  questions: z
    .array(questionAnswerSchema)
    .length(3, "Please answer exactly 3 questions"),
});

export type ProfileCreationFormData = z.infer<typeof profileUpdateSchema>;
