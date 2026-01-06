import { Router } from 'express'
import createApiHandler from '@/shared/api/handler'
import updateProfile from '@/features/profile/handlers/update-profile'
import getProfile from '@/features/profile/handlers/get-profile'

const router = Router()

router.put('/profile/:id', createApiHandler(updateProfile))
router.get('/profile/:id', createApiHandler(getProfile))

export default router
