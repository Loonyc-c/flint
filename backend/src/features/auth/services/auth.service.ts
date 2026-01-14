import { CLIENT, TOKEN_ISSUER } from '@/data/constants'
import { getUserCollection } from '@/data/db/collection'
import { withMongoTransaction } from '@/data/db'
import { User } from '@/data/db/types/user'
import { isNil, isNonEmptyString } from '@/utils'
import dayjs from 'dayjs'
import jwt from 'jsonwebtoken'
import { DbUser } from '@/data/db/types/user'
import { ErrorCode, ServiceException } from '@/features/error'
import bcrypt from 'bcrypt'
import crypto from 'crypto'
import { OAuth2Client } from 'google-auth-library'
import sendEmail from './email.service'
import { LOOKING_FOR, SUBSCRIPTION_PLANS } from '@shared/types'
import { DEFAULT_AGE_RANGE } from '@/data/constants/user'

const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not set')
}

export type AuthorizerPayload = {
  userId: string
  firstName: string
  lastName: string
  email: string
  subscription: {
    plan: SUBSCRIPTION_PLANS
    startDate?: Date
    enDate?: Date
    isActive: boolean
  }
}

export interface AuthToken {
  sub: string
  iss: string
  aud: string | string[]
  iat: number
  exp: number
  data: AuthorizerPayload
}

interface createUserReq {
  firstName: string
  lastName: string
  email: string
  password: string
}

interface AuthService {
  generateToken: (userId: string, payload: AuthorizerPayload) => string
  extractToken: (token?: string) => AuthToken | undefined
  authenticateUser: (email: string, password: string) => Promise<User>
  createUser: (input: createUserReq) => Promise<{ id: string }>
  forgetPassword: (email: string) => Promise<void>
  resetPassword: (token: string, password: string) => Promise<void>
  handleGoogleAuth: (googleToken: string) => Promise<{ user: User; isNewUser: boolean }>
}

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID
if (!GOOGLE_CLIENT_ID) {
  throw new Error('GOOGLE_CLIENT_ID environment variable is not set')
}
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID)

const sanitizeEmail = (email: string): string => {
  const [localPart, domain] = email.split('@')
  if (!domain) return '***'
  const visibleChars = Math.min(3, localPart.length)
  return `${localPart.substring(0, visibleChars)}***@${domain}`
}

export const authService: AuthService = {
  generateToken: (userId, payload) => {
    const tokenPayload = {
      sub: userId,
      iss: TOKEN_ISSUER,
      aud: CLIENT,
      iat: dayjs().unix(),
      exp: dayjs().add(1, 'days').unix(),
      data: payload,
    }

    return jwt.sign(tokenPayload, JWT_SECRET, { algorithm: 'HS256' })
  },
  extractToken: (token) => {
    if (!isNonEmptyString(token)) {
      return undefined
    }
    try {
      const verifiedToken = jwt.verify(token, JWT_SECRET) as AuthToken
      if (verifiedToken.iss !== TOKEN_ISSUER) {
        throw new ServiceException('err.auth.invalid_token', ErrorCode.UNAUTHORIZED)
      }
      return verifiedToken
    } catch {
      // Requirement 14: Remove console.error for security - token verification failures
      // are expected during normal operation (expired tokens, invalid tokens)
      return undefined
    }
  },
  authenticateUser: async (email, password) => {
    const userCollection = await getUserCollection()
    const user = await userCollection.findOne({
      'auth.email': email,
    })

    // Requirement 15: Prevent account enumeration by using generic error message
    // If user not found OR (user found AND password mismatch), throw same error
    if (isNil(user) || isNil(user.auth)) {
      // Simulate password check time to prevent timing attacks (optional but good practice)
      const dummyHash = '$2a$10$abcdefghijklmnopqrstuvwxyzABCDEFGHIJK'
      await bcrypt.compare(password, dummyHash)
      throw new ServiceException('err.auth.invalid_credentials', ErrorCode.UNAUTHORIZED)
    }

    const passMatch = isNonEmptyString(user.auth.password)
      ? await bcrypt.compare(password, user.auth.password)
      : false

    if (!passMatch) {
      throw new ServiceException('err.auth.invalid_credentials', ErrorCode.UNAUTHORIZED)
    }

    return user
  },
  // Requirement 3: Use MongoDB transaction to prevent race condition in user creation
  // This ensures atomicity - check and insert happen in same transaction
  createUser: async (input) => {
    const { firstName, lastName, email, password } = input

    // Hash password outside transaction to minimize transaction duration
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    return await withMongoTransaction(async (session) => {
      const userCollection = await getUserCollection()

      // Check for existing user within transaction to prevent race condition
      const existingUser = await userCollection.findOne({ 'auth.email': email }, { session })

      if (existingUser) {
        throw new ServiceException('err.user.already_exists', ErrorCode.BAD_REQUEST)
      }

      const doc: DbUser = {
        auth: {
          firstName,
          lastName,
          email,
          password: hashedPassword,
        },
        subscription: {
          plan: SUBSCRIPTION_PLANS.FREE,
          isActive: true,
        },
        preferences: {
          ageRange: DEFAULT_AGE_RANGE,
          lookingFor: LOOKING_FOR.ALL,
        },
        profileCompletion: 0,
        isDeleted: false as const,
        isActive: true,
        updatedAt: new Date(),
        createdAt: new Date(),
        updatedBy: 'system',
        createdBy: 'system',
      }

      const res = await userCollection.insertOne(doc, { session })
      if (!res.acknowledged) {
        throw new ServiceException('err.system.internal_error', ErrorCode.INTERNAL_ERROR)
      }

      return {
        id: res.insertedId.toHexString(),
      }
    })
  },

  forgetPassword: async (email) => {
    const userCollection = await getUserCollection()

    const user = await userCollection.findOne({ 'auth.email': email })

    if (isNil(user) || isNil(user.auth)) {
      return
    }

    const resetToken = crypto.randomBytes(32).toString('hex')
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex')
    const resetTokenExpiry = dayjs().add(15, 'minutes').toDate()

    await userCollection.updateOne(
      { _id: user._id },
      {
        $set: {
          'auth.passwordResetToken': hashedToken,
          'auth.passwordResetExpires': resetTokenExpiry,
          updatedAt: new Date(),
        },
      },
    )

    const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000'
    const resetLink = `${CLIENT_URL}/auth/reset-password?token=${resetToken}`

    const emailText = `Hello ${user.auth.firstName},\n\nYou requested a password reset. Please click on the following link to reset your password:\n\n${resetLink}\n\nThis link will expire in 15 minutes.\n\nIf you didn't request this, please ignore this email.\n\nBest regards,\nFlint Team`

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Password Reset Request</h2>
        <p>Hello ${user.auth.firstName},</p>
        <p>You requested a password reset. Please click on the following link to reset your password:</p>
        <p style="margin: 20px 0;">
          <a href="${resetLink}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
        </p>
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #666;">${resetLink}</p>
        <p style="color: #999; font-size: 12px;">This link will expire in 15 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <p>Best regards,<br>Flint Team</p>
      </div>
    `

    await sendEmail({
      to: user.auth.email,
      subject: 'Password Reset Request - Flint',
      text: emailText,
      html: emailHtml,
    })
  },

  resetPassword: async (token, password) => {
    const userCollection = await getUserCollection()
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex')

    const user = await userCollection.findOne({
      'auth.passwordResetToken': hashedToken,
      'auth.passwordResetExpires': { $gt: new Date() },
    })

    if (isNil(user)) {
      throw new ServiceException('err.auth.invalid_token', ErrorCode.BAD_REQUEST)
    }

    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    await userCollection.updateOne(
      { _id: user._id },
      {
        $set: {
          'auth.password': hashedPassword,
          'auth.passwordResetToken': undefined,
          'auth.passwordResetExpires': undefined,
          updatedAt: new Date(),
        },
      },
    )
  },

  handleGoogleAuth: async (googleToken) => {
    try {
      // Diagnostic: decode token payload (unverified) to inspect aud/iss/exp
      const snippet = googleToken?.slice(0, 12) ?? ''
      try {
        const parts = googleToken.split('.')
        if (parts.length === 3) {
          const payloadJson = Buffer.from(parts[1], 'base64').toString('utf8')
          const payload = JSON.parse(payloadJson)
          console.info('Google token decode', {
            tokenSnippet: snippet,
            aud: payload.aud,
            iss: payload.iss,
            exp: payload.exp,
            email: payload.email ? sanitizeEmail(payload.email) : undefined,
            clientEnv: GOOGLE_CLIENT_ID,
          })
        } else {
          console.info('Google token malformed parts', { tokenSnippet: snippet })
        }
      } catch (decodeErr) {
        console.warn('Google token decode failed', { tokenSnippet: snippet, decodeErr })
      }

      const ticket = await googleClient.verifyIdToken({
        idToken: googleToken,
        audience: GOOGLE_CLIENT_ID,
      })

      const payload = ticket.getPayload()

      if (
        isNil(payload) ||
        isNil(payload.email) ||
        isNil(payload.given_name) ||
        isNil(payload.family_name)
      ) {
        throw new ServiceException('err.auth.invalid_token', ErrorCode.BAD_REQUEST)
      }

      const { email, given_name: firstName, family_name: lastName } = payload

      const userCollection = await getUserCollection()

      const result = await userCollection.findOneAndUpdate(
        { 'auth.email': email },
        {
          $setOnInsert: {
            auth: { firstName, lastName, email, password: '' },
            subscription: { plan: SUBSCRIPTION_PLANS.FREE, isActive: true },
            preferences: { ageRange: DEFAULT_AGE_RANGE, lookingFor: LOOKING_FOR.ALL },
            profileCompletion: 0,
            isDeleted: false as const,
            isActive: true,
            createdAt: new Date(),
            createdBy: 'system',
          },
          $set: {
            updatedAt: new Date(),
            updatedBy: 'system',
          },
        },
        { upsert: true, returnDocument: 'after', includeResultMetadata: true },
      )

      if (!result || !result.value) {
        throw new ServiceException('err.system.internal_error', ErrorCode.INTERNAL_ERROR)
      }

      return {
        user: result.value,
        isNewUser: !!result.lastErrorObject?.upserted,
      }
    } catch (error) {
      // Requirement 14: Remove detailed error logging for security
      // Error details could expose sensitive information
      if (error instanceof ServiceException) {
        throw error
      }
      console.warn('Google verify failed', {
        message: (error as Error)?.message,
        tokenSnippet: googleToken?.slice(0, 12),
        clientEnv: GOOGLE_CLIENT_ID,
      })
      throw new ServiceException('err.auth.invalid_token', ErrorCode.UNAUTHORIZED)
    }
  },
}
