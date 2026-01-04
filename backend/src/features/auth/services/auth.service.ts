import { CLIENT, TOKEN_ISSUER } from '@/data/constants'
import { getUserCollection } from '@/data/db/collection'
import { User } from '@/data/db/types/user'
import { isNil, isNonEmptyString } from '@/utils'
import dayjs from 'dayjs'
import jwt from 'jsonwebtoken'
import bcryptjs from 'bcryptjs'
import { DbUser } from '@/data/db/types/user'
import { ErrorCode, ServiceException } from '@/features/auth/services/error'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { OAuth2Client } from 'google-auth-library'
import sendEmail from './email.service'

const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not set')
}

export type AuthorizerPayload = {
  principalId: string
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

    return jwt.sign(tokenPayload, JWT_SECRET)
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
    } catch (e: unknown) {
      console.error(e)
      return undefined
    }
  },
  authenticateUser: async (email, password) => {
    const userCollection = await getUserCollection()
    const user = await userCollection.findOne({
      'auth.email': email,
    })

    if (isNil(user) || isNil(user.auth)) {
      throw new ServiceException('err.user.not_found', ErrorCode.NOT_FOUND)
    }

    const passMatch = isNonEmptyString(user.auth.password)
      ? await bcryptjs.compare(password, user.auth.password)
      : false

    if (!passMatch) {
      throw new ServiceException('err.auth.invalid_credentials', ErrorCode.UNAUTHORIZED)
    }

    return user
  },
  createUser: async (input) => {
    const { firstName, lastName, email, password } = input

    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    const doc: DbUser = {
      auth: {
        firstName,
        lastName,
        email,
        password: hashedPassword,
      },
      isDeleted: false as const,
      isActive: true,
      updatedAt: new Date(),
      createdAt: new Date(),
      updatedBy: 'system',
      createdBy: 'system',
    }

    const userCollection = await getUserCollection()

    const res = await userCollection.insertOne(doc)
    if (!res.acknowledged) {
      throw new ServiceException('err.system.internal_error', ErrorCode.INTERNAL_ERROR)
    }

    return {
      id: res.insertedId.toHexString(),
    }
  },

  forgetPassword: async (email) => {
    const userCollection = await getUserCollection()

    const user = await userCollection.findOne({ 'auth.email': email })

    if (isNil(user) || isNil(user.auth)) {
      return
    }

    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetTokenExpiry = dayjs().add(15, 'minutes').toDate()

    await userCollection.updateOne(
      { _id: user._id },
      {
        $set: {
          'auth.passwordResetToken': resetToken,
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

    const user = await userCollection.findOne({
      'auth.passwordResetToken': token,
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
      let user = await userCollection.findOne({ 'auth.email': email })
      let isNewUser = false

      if (isNil(user)) {
        isNewUser = true
        const doc: DbUser = {
          auth: {
            firstName,
            lastName,
            email,
            password: '',
          },
          isDeleted: false as const,
          isActive: true,
          updatedAt: new Date(),
          createdAt: new Date(),
          updatedBy: 'system',
          createdBy: 'system',
        }

        const res = await userCollection.insertOne(doc)
        if (!res.acknowledged) {
          throw new ServiceException('err.system.internal_error', ErrorCode.INTERNAL_ERROR)
        }
        user = await userCollection.findOne({ _id: res.insertedId })
        if (isNil(user)) {
          throw new ServiceException('err.system.internal_error', ErrorCode.INTERNAL_ERROR)
        }
      }

      return { user, isNewUser }
    } catch (error) {
      console.error('Google auth error:', error)
      throw new ServiceException('err.auth.invalid_token', ErrorCode.UNAUTHORIZED)
    }
  },
}
