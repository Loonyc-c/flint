import { z } from 'zod'
import { InteractionType } from '../types/match'

export const swipeSchema = z.object({
  targetId: z.string().min(1, 'Target ID is required'),
  type: z.nativeEnum(InteractionType, {
    errorMap: () => ({ message: 'Invalid swipe type. Must be "like" or "dislike"' })
  })
})

export type SwipeFormData = z.infer<typeof swipeSchema>
