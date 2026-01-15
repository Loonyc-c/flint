import { Router } from 'express'
import { startInstagramAuth, instagramCallback } from './handlers/instagram-auth'

const router = Router()

// Instagram OAuth - these must be public because they are browser redirects
router.get('/profile/:id/instagram/connect', startInstagramAuth)
router.get('/profile/instagram/callback', instagramCallback)

export default router
