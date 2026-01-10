import { z } from 'zod'

// =============================================================================
// Schemas
// =============================================================================

export const sendMessageSchema = z.object({
  text: z.string().min(1, 'Message cannot be empty').max(2000, 'Message too long'),
})

export const getMessagesQuerySchema = z.object({
  limit: z.number().positive().max(100).optional(),
  before: z.string().optional(), // cursor for pagination (message ID)
})

// =============================================================================
// Types
// =============================================================================

export type SendMessageRequest = z.infer<typeof sendMessageSchema>
export type GetMessagesQuery = z.infer<typeof getMessagesQuerySchema>
