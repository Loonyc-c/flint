import { Router } from 'express'
import createApiHandler from '@/shared/api/handler'
import signUp from '@/features/auth/handlers/sign-up'
import login from '@/features/auth/handlers/login'
import forgetPassword from '@/features/auth/handlers/forget-password'
import resetPassword from '@/features/auth/handlers/reset-password'

import google from '@/features/auth/handlers/google'
import profilePublicRouter from '@/features/profile/public-routes'

const router = Router()

router.post('/auth/login', createApiHandler(login))
router.post('/auth/sign-up', createApiHandler(signUp))
router.post('/auth/forget-password', createApiHandler(forgetPassword))
router.patch('/auth/reset-password/:token', createApiHandler(resetPassword))
router.post('/auth/google', createApiHandler(google))

router.use(profilePublicRouter)

export default router
