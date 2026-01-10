import { Router } from 'express'
import createApiHandler from '@/shared/api/handler'
import updateProfile from '@/features/profile/handlers/update-profile'
import getProfile from '@/features/profile/handlers/get-profile'
import { updateContactInfoHandler, getContactInfoHandler } from './handlers/contact-info'

const router = Router()

router.put('/profile/:id', createApiHandler(updateProfile))
router.get('/profile/:id', createApiHandler(getProfile))

// Contact info routes
router.put('/profile/:id/contact', createApiHandler(updateContactInfoHandler))
router.get('/profile/:id/contact', createApiHandler(getContactInfoHandler))

export default router
