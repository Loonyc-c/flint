import { Router } from 'express'
import matchesRouter from '@/features/matches/routes'
import profileRouter from '@/features/profile/routes'
import { authorizer } from '@/middleware/auth.middleware'

const router = Router()

router.use(authorizer)

router.use(matchesRouter)
router.use(profileRouter)

export default router
