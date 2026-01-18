import { z } from 'zod'
import { InteractionType } from '../types/match'

export const swipeSchema = z.object({
  targetId: z.string().min(1, 'Target ID is required'),
  type: z.nativeEnum(InteractionType)
})

export const listSchema = z.object({
  limit: z.number().positive().lte(100).optional(),
  ageRange: z.number().min(18).max(100).optional()
})

export type SwipeFormData = z.infer<typeof swipeSchema>
export type ListCandidatesRequest = z.infer<typeof listSchema>
