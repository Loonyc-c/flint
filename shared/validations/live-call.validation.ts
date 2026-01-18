import { z } from 'zod'
import { USER_GENDER } from '../types/enums'

export const liveCallPreferencesSchema = z
  .object({
    age: z.number().min(18).max(100),
    gender: z.nativeEnum(USER_GENDER),
    minAge: z.number().min(18).max(100),
    maxAge: z.number().min(18).max(100)
  })
  .refine(data => data.minAge <= data.maxAge, {
    message: 'Minimum age cannot be greater than maximum age',
    path: ['minAge']
  })

export const liveCallActionSchema = z.object({
  matchId: z.string(),
  action: z.enum(['like', 'pass'])
})

export type LiveCallPreferencesInput = z.infer<typeof liveCallPreferencesSchema>
export type LiveCallActionInput = z.infer<typeof liveCallActionSchema>
