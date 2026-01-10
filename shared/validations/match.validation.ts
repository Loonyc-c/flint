import { z } from "zod";
import { InteractionType } from "../types/match";
import { LOOKING_FOR } from "../types/enums";

export const swipeSchema = z.object({
  targetId: z.string().min(1, "Target ID is required"),
  type: z.nativeEnum(InteractionType),
});

export const listSchema = z.object({
  limit: z.number().positive().lte(100).optional(),
  ageRange: z.number().min(18).max(100).optional(),
  lookingFor: z.nativeEnum(LOOKING_FOR).optional(),
});

export type SwipeFormData = z.infer<typeof swipeSchema>;
export type ListCandidatesRequest = z.infer<typeof listSchema>;
