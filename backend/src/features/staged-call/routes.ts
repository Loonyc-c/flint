import { Router } from 'express'
import createApiHandler from '@/shared/api/handler'
import getMatchStageHandler from './handlers/get-match-stage'

const router = Router()

// GET /staged-call/match/:matchId/stage - Get current stage of a match
router.get('/staged-call/match/:matchId/stage', createApiHandler(getMatchStageHandler))

export default router
