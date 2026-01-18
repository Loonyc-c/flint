import { z } from 'zod'

export const referenceUpdateSchema = z.object({
  ageRange: z
    .number()
    .min(18, 'Age limit must be at least 18')
    .max(100, 'Age limit cannot exceed 100')
})

export type ReferenceUpdateFormData = z.infer<typeof referenceUpdateSchema>
