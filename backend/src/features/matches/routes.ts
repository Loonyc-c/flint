import { Router } from 'express'
import createApiHandler from '@/shared/api/handler'
import listCandidates from '@/features/matches/handlers/list-candidates'
import swipe from '@/features/matches/handlers/swipe'
import getMatches from '@/features/matches/handlers/get-matches'

const router = Router()

router.post('/matches/candidates/:id', createApiHandler(listCandidates))
router.post('/matches/swipe/:id', createApiHandler(swipe))
router.get('/matches/:id', createApiHandler(getMatches))

export default router
