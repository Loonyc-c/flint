import { Request, Response } from 'express'
import { profileService } from '../services/profile.service'

/**
 * Initiates Instagram OAuth flow
 */
export const startInstagramAuth = async (req: Request, res: Response) => {
  const { id: userId } = req.params
  
  // In a real implementation, we would redirect to Instagram's OAuth URL
  // const instagramAuthUrl = `https://api.instagram.com/oauth/authorize?client_id=${process.env.INSTAGRAM_CLIENT_ID}&redirect_uri=${process.env.INSTAGRAM_REDIRECT_URI}&scope=user_profile&response_type=code&state=${userId}`;
  // res.redirect(instagramAuthUrl);

  // Mock flow: redirecting directly to our callback
  const mockCode = 'mock_auth_code'
  res.redirect(`/api/profile/${userId}/instagram/callback?code=${mockCode}`)
}

/**
 * Handles Instagram OAuth callback
 */
export const instagramCallback = async (req: Request, res: Response) => {
  const { id: userId } = req.params
  const { code } = req.query

  if (!code) {
    res.status(400).json({ success: false, error: 'Authorization code missing' })
    return
  }

  try {
    // Simulating fetching username from Instagram API
    const mockInstagramHandle = 'verified_user_ig'

    await profileService.verifyPlatform(userId, 'instagram', mockInstagramHandle)
    
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000'
    // Redirect back to frontend with success flag
    res.redirect(`${frontendUrl}/profile/contact?verified=instagram`)
  } catch (error) {
    console.error('Instagram verification failed:', error)
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000'
    res.redirect(`${frontendUrl}/profile/contact?error=verification_failed`)
  }
}