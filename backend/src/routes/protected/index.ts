import { Router } from 'express'
import matchesRouter from '@/features/matches/routes'
import profileRouter from '@/features/profile/routes'
import referenceRouter from '@/features/reference/routes'
import chatRouter from '@/features/chat/routes'
import agoraRouter from '@/features/agora/routes'
import stagedCallRouter from '@/features/staged-call/routes'
import { authorizer } from '@/middleware/auth.middleware'

const router = Router()

router.use(authorizer)

router.use(matchesRouter)
router.use(profileRouter)
router.use(referenceRouter)
router.use(chatRouter)
router.use(agoraRouter)
router.use(stagedCallRouter)

export default router
