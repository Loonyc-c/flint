import { Router } from 'express'
import createApiHandler from '@/shared/api/handler'
import getCandidates from '@/features/matches/handlers/get-candidates'
import swipe from '@/features/matches/handlers/swipe'
import getMatches from '@/features/matches/handlers/get-matches'

const router = Router()

router.get('/matches/candidates', createApiHandler(getCandidates))
router.post('/matches/swipe', createApiHandler(swipe))
router.get('/matches', createApiHandler(getMatches))

export default router
