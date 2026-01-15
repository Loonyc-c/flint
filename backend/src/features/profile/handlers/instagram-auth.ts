import { Request, Response } from 'express'
import { profileService } from '../services/profile.service'

/**
 * Initiates Instagram OAuth flow
 */
export const startInstagramAuth = async (req: Request, res: Response) => {
  const { id: userId } = req.params
  const { locale = 'en' } = req.query
  
  const clientId = process.env.INSTAGRAM_CLIENT_ID
  const redirectUri = process.env.INSTAGRAM_REDIRECT_URI

  if (!clientId || !redirectUri) {
    console.error('[Instagram] Missing credentials in environment variables')
    return res.status(500).json({ error: 'Instagram integration not configured' })
  }

  // Use 'state' to pass both userId and locale through the OAuth flow
  const state = Buffer.from(JSON.stringify({ userId, locale })).toString('base64')
  
  const instagramAuthUrl = new URL('https://api.instagram.com/oauth/authorize')
  instagramAuthUrl.searchParams.set('client_id', clientId)
  instagramAuthUrl.searchParams.set('redirect_uri', redirectUri)
  instagramAuthUrl.searchParams.set('scope', 'user_profile')
  instagramAuthUrl.searchParams.set('response_type', 'code')
  instagramAuthUrl.searchParams.set('state', state)

  res.redirect(instagramAuthUrl.toString())
}

/**
 * Handles Instagram OAuth callback
 */
export const instagramCallback = async (req: Request, res: Response) => {
  const { code, state } = req.query

  const derivedClientUrl = (process.env.CLIENT_URL || '')
    .split(',')
    .map((o) => o.trim().replace(/\/$/, ''))
    .filter(Boolean)[0]
  const frontendUrl = (process.env.FRONTEND_URL || derivedClientUrl || 'http://localhost:3000').replace(/\/$/, '')

  if (!state || typeof state !== 'string') {
    return res.redirect(`${frontendUrl}/en/profile?error=invalid_state`)
  }

  // Decode state to get userId and locale
  const { userId, locale } = JSON.parse(Buffer.from(state, 'base64').toString('utf8'))

  if (!code) {
    return res.redirect(`${frontendUrl}/${locale}/profile?error=verification_failed`)
  }

  try {
    // 1. Exchange short-lived code for access token
    const tokenResponse = await fetch('https://api.instagram.com/oauth/access_token', {
      method: 'POST',
      body: new URLSearchParams({
        client_id: process.env.INSTAGRAM_CLIENT_ID!,
        client_secret: process.env.INSTAGRAM_CLIENT_SECRET!,
        grant_type: 'authorization_code',
        redirect_uri: process.env.INSTAGRAM_REDIRECT_URI!,
        code: code as string,
      }),
    })

    const tokenData = await tokenResponse.json() as { access_token: string; user_id: number; error_message?: string }

    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error('[Instagram] Token exchange failed:', tokenData)
      throw new Error(tokenData.error_message || 'Token exchange failed')
    }

    // 2. Fetch actual username from Instagram Graph API
    const profileResponse = await fetch(
      `https://graph.instagram.com/me?fields=id,username&access_token=${tokenData.access_token}`
    )
    const profileData = await profileResponse.json() as { id: string; username: string }

    if (!profileResponse.ok || !profileData.username) {
      throw new Error('Failed to fetch Instagram profile')
    }

    const fetchedUsername = `@${profileData.username}`

    // 3. Save the verified username
    await profileService.verifyPlatform(userId, 'instagram', fetchedUsername)
    
    res.redirect(`${frontendUrl}/${locale}/profile?verified=instagram`)
  } catch (error) {
    console.error('[Instagram] Verification error:', error)
    res.redirect(`${frontendUrl}/${locale}/profile?error=verification_failed`)
  }
}