import { Router } from 'express'
import createApiHandler from '@/shared/api/handler'
import getMessages from '@/features/chat/handlers/get-messages'
import sendMessage from '@/features/chat/handlers/send-message'
import markAsRead from '@/features/chat/handlers/mark-as-read'

const router = Router()

// GET /matches/:matchId/messages - Get message history for a match
router.get('/matches/:matchId/messages', createApiHandler(getMessages))

// POST /matches/:matchId/messages - Send a new message
router.post('/matches/:matchId/messages', createApiHandler(sendMessage))

// POST /matches/:matchId/read - Mark messages as read
router.post('/matches/:matchId/read', createApiHandler(markAsRead))

export default router
