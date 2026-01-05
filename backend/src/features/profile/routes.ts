import { Router } from 'express'
import createApiHandler from '@/shared/api/handler'
import createProfile from '@/features/profile/handlers/create-profile'
import updateProfile from '@/features/profile/handlers/update-profile'
import getProfile from '@/features/profile/handlers/get-profile'

const router = Router()

router.post('/profile', createApiHandler(createProfile))
router.put('/profile', createApiHandler(updateProfile))
router.get('/profile', createApiHandler(getProfile))

export default router
