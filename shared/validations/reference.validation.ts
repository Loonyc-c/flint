import { z } from 'zod'
import { LOOKING_FOR } from '../types/enums'

export const referenceUpdateSchema = z.object({
  ageRange: z.number().min(18, "Age limit must be at least 18").max(100, "Age limit cannot exceed 100"),
  lookingFor: z.nativeEnum(LOOKING_FOR),
})

export type ReferenceUpdateFormData = z.infer<typeof referenceUpdateSchema>
