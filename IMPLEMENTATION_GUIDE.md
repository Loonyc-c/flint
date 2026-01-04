# Implementation Guide: Folder Structure & Type Standardization

This guide provides concrete code examples to implement the recommendations.

---

## PART 1: Create Shared Types Structure

### Step 1: Create Shared Types Directory (in project root)

```bash
mkdir -p shared-types/types
mkdir -p shared-types/validations
```

### Step 2: Define Core Type Files

#### File: `shared-types/types/errors.types.ts`

```typescript
/**
 * Error codes must be synchronized across frontend and backend
 * This is the single source of truth
 */
export enum ApiErrorCode {
  // Client errors
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  UNPROCESSABLE_ENTITY = 422,

  // Custom API errors
  NOT_IMPLEMENTED = 994,
  INTERNAL_ERROR = 999
}

export interface ApiErrorResponse<T = unknown> {
  success: false
  error: {
    code: ApiErrorCode
    message: string
    isReadableMessage: boolean
    validationIssues?: T
    data?: unknown
  }
}

export interface ApiSuccessResponse<T> {
  success: true
  data: T
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse

export class ApiException extends Error {
  constructor(
    public status: number,
    public code: ApiErrorCode,
    public isReadableMessage: boolean,
    message: string,
    public data?: unknown
  ) {
    super(message)
    this.name = 'ApiException'
  }
}
```

#### File: `shared-types/types/auth.types.ts`

```typescript
/**
 * AUTH TYPE DEFINITIONS
 * Single source of truth for auth-related types
 * Used by both backend and frontend
 */

// ===== Request Types =====
export interface LoginRequest {
  email: string
  password: string
}

export interface SignupRequest {
  firstName: string
  lastName: string
  email: string
  password: string
}

export interface ForgetPasswordRequest {
  email: string
}

export interface ResetPasswordRequest {
  token: string
  password: string
  passwordConfirm: string
}

// ===== Response Types =====
export interface AuthTokenResponse {
  accessToken: string
  expiresIn: number // seconds
  tokenType: 'Bearer'
}

export interface LoginResponse extends AuthTokenResponse {
  user: UserProfile
}

export interface SignupResponse {
  id: string
  email: string
  message: string
}

export interface ForgetPasswordResponse {
  message: string
  email: string
}

export interface ResetPasswordResponse {
  message: string
}

// ===== User Type (shared across app) =====
export interface UserProfile {
  id: string
  email: string
  firstName: string
  lastName: string
  name?: string // Convenience field
  isEmailVerified: boolean
  createdAt: string
  updatedAt: string
}

export interface AuthToken {
  sub: string
  iss: string
  aud: string | string[]
  iat: number
  exp: number
  data: {
    principalId: string
  }
}

// ===== Error Codes =====
export enum AuthErrorCode {
  INVALID_CREDENTIALS = 'AUTH_INVALID_CREDENTIALS',
  USER_NOT_FOUND = 'AUTH_USER_NOT_FOUND',
  EMAIL_ALREADY_EXISTS = 'AUTH_EMAIL_EXISTS',
  INVALID_TOKEN = 'AUTH_INVALID_TOKEN',
  TOKEN_EXPIRED = 'AUTH_TOKEN_EXPIRED',
  EMAIL_NOT_VERIFIED = 'AUTH_EMAIL_NOT_VERIFIED',
  PASSWORD_MISMATCH = 'AUTH_PASSWORD_MISMATCH'
}
```

#### File: `shared-types/types/common.types.ts`

```typescript
/**
 * Common types used across the application
 */

export interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: Pagination
}

export interface SortOptions {
  field: string
  order: 'asc' | 'desc'
}

export interface FilterOptions {
  [key: string]: unknown
}

export type Locale = 'en' | 'mn'

export interface LocalizedMessage {
  [key in Locale]: string
}
```

### Step 3: Create Validation Schemas (Shared)

#### File: `shared-types/validations/auth.validation.ts`

```typescript
import { z } from 'zod'

/**
 * SHARED VALIDATION SCHEMAS
 * Used by both backend and frontend
 * This is the single source of truth for validation rules
 */

export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Invalid email format')
  .transform(email => email.trim().toLowerCase())

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(
    /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/,
    'Password must contain at least one special character'
  )

export const nameSchema = z
  .string()
  .min(2, 'Name must be at least 2 characters')
  .max(50, 'Name must be less than 50 characters')
  .transform(name =>
    name
      .trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
  )

// Login
export const loginValidation = z.object({
  email: emailSchema,
  password: passwordSchema
})
export type LoginValidationType = z.infer<typeof loginValidation>

// Sign Up
export const signupValidation = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
  email: emailSchema,
  password: passwordSchema
})
export type SignupValidationType = z.infer<typeof signupValidation>

// Forget Password
export const forgetPasswordValidation = z.object({
  email: emailSchema
})
export type ForgetPasswordValidationType = z.infer<typeof forgetPasswordValidation>

// Reset Password
export const resetPasswordValidation = z
  .object({
    password: passwordSchema,
    passwordConfirm: passwordSchema
  })
  .refine(data => data.password === data.passwordConfirm, {
    message: 'Passwords do not match',
    path: ['passwordConfirm']
  })
export type ResetPasswordValidationType = z.infer<typeof resetPasswordValidation>
```

#### File: `shared-types/package.json`

```json
{
  "name": "@flint/shared-types",
  "version": "1.0.0",
  "description": "Shared types and validations for Flint application",
  "main": "index.ts",
  "types": "index.ts",
  "exports": {
    "./types": "./types/index.ts",
    "./validations": "./validations/index.ts"
  },
  "files": ["types", "validations"]
}
```

#### File: `shared-types/types/index.ts`

```typescript
export * from './errors.types'
export * from './auth.types'
export * from './common.types'
```

#### File: `shared-types/validations/index.ts`

```typescript
export * from './auth.validation'
```

---

## PART 2: Refactor Backend to Feature-Based Structure

### Current Backend Structure Issues:

- ❌ `handlers/rest-api/public/login.ts` - Mixed concerns
- ❌ `services/auth.ts` - 275 lines, mixed concerns
- ❌ `validations/public/login.ts` - Separated from logic
- ❌ `models/user.model.js` - Mongoose (you don't want this)

### New Backend Structure:

```bash
backend/src/features/auth/
├── auth.handler.ts
├── auth.service.ts
├── token.service.ts
├── email.service.ts
├── auth.types.ts
└── index.ts
```

### Implementation:

#### File: `backend/src/features/auth/auth.types.ts`

```typescript
/**
 * Auth feature types - extends shared types with backend-specific ones
 */
import type { ObjectId } from 'mongodb'
import type { UserProfile } from '@shared-types/types'

export interface DbUser {
  _id: ObjectId
  email: string
  firstName: string
  lastName: string
  password: string // hashed
  isEmailVerified: boolean
  emailVerificationToken?: string
  emailVerificationExpires?: Date
  passwordResetToken?: string
  passwordResetExpires?: Date
  createdAt: Date
  updatedAt: Date
}

export interface CreateUserDto {
  email: string
  firstName: string
  lastName: string
  password: string
}

export interface AuthServiceResult {
  user: UserProfile
  token: string
  expiresIn: number
}

export type AuthorizerPayload = {
  principalId: string
  email: string
}
```

#### File: `backend/src/features/auth/auth.validation.ts`

```typescript
/**
 * Use shared validations instead of duplicating
 */
import {
  loginValidation,
  signupValidation,
  forgetPasswordValidation,
  resetPasswordValidation
} from '@shared-types/validations'

export { loginValidation, signupValidation, forgetPasswordValidation, resetPasswordValidation }
```

#### File: `backend/src/features/auth/token.service.ts`

```typescript
/**
 * Token Service
 * Responsible for JWT token generation and validation
 */
import jwt from 'jsonwebtoken'
import dayjs from 'dayjs'
import type { AuthToken, AuthorizerPayload } from './auth.types'
import { ErrorCode, ServiceException } from '@/services/error'
import { TOKEN_ISSUER, CLIENT } from '@/data/constants'

const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not set')
}

interface TokenServiceInterface {
  generateToken: (userId: string, payload: AuthorizerPayload) => string
  extractToken: (token?: string) => AuthToken | undefined
  verifyToken: (token: string) => AuthToken
}

export const tokenService: TokenServiceInterface = {
  generateToken: (userId: string, payload: AuthorizerPayload): string => {
    const tokenPayload: AuthToken = {
      sub: userId,
      iss: TOKEN_ISSUER,
      aud: CLIENT,
      iat: dayjs().unix(),
      exp: dayjs().add(1, 'day').unix(),
      data: payload
    }
    return jwt.sign(tokenPayload, JWT_SECRET)
  },

  extractToken: (token?: string): AuthToken | undefined => {
    if (!token || typeof token !== 'string') {
      return undefined
    }
    try {
      const verifiedToken = jwt.verify(token, JWT_SECRET) as AuthToken
      if (verifiedToken.iss !== TOKEN_ISSUER) {
        throw new ServiceException('Invalid token issuer', ErrorCode.UNAUTHORIZED)
      }
      return verifiedToken
    } catch (error: unknown) {
      console.error('Token verification failed:', error)
      return undefined
    }
  },

  verifyToken: (token: string): AuthToken => {
    try {
      const verifiedToken = jwt.verify(token, JWT_SECRET) as AuthToken
      if (verifiedToken.iss !== TOKEN_ISSUER) {
        throw new ServiceException('Invalid token issuer', ErrorCode.UNAUTHORIZED)
      }
      return verifiedToken
    } catch (error: unknown) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new ServiceException('Token expired', ErrorCode.UNAUTHORIZED)
      }
      throw new ServiceException('Invalid token', ErrorCode.UNAUTHORIZED)
    }
  }
}
```

#### File: `backend/src/features/auth/auth.service.ts`

```typescript
/**
 * Auth Service
 * Responsible for authentication business logic
 * Handles user registration, login, password reset
 */
import bcryptjs from 'bcryptjs'
import crypto from 'crypto'
import { getUserCollection } from '@/data/db'
import { ErrorCode, ServiceException } from '@/services/error'
import { tokenService } from './token.service'
import { emailService } from './email.service'
import type { DbUser, CreateUserDto, AuthServiceResult, AuthorizerPayload } from './auth.types'
import type { UserProfile } from '@shared-types/types'
import { ObjectId } from 'mongodb'

interface AuthServiceInterface {
  authenticateUser: (email: string, password: string) => Promise<DbUser>
  createUser: (input: CreateUserDto) => Promise<UserProfile>
  forgetPassword: (email: string) => Promise<void>
  resetPassword: (token: string, password: string) => Promise<void>
  findUserById: (userId: string) => Promise<DbUser | null>
}

const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcryptjs.genSalt(10)
  return bcryptjs.hash(password, salt)
}

const comparePasswords = async (password: string, hash: string): Promise<boolean> => {
  return bcryptjs.compare(password, hash)
}

const mapDbUserToProfile = (user: DbUser): UserProfile => ({
  id: user._id.toHexString(),
  email: user.email,
  firstName: user.firstName,
  lastName: user.lastName,
  name: `${user.firstName} ${user.lastName}`,
  isEmailVerified: user.isEmailVerified,
  createdAt: user.createdAt.toISOString(),
  updatedAt: user.updatedAt.toISOString()
})

export const authService: AuthServiceInterface = {
  authenticateUser: async (email: string, password: string): Promise<DbUser> => {
    const usersCollection = await getUserCollection()
    const user = await usersCollection.findOne({ email })

    if (!user) {
      throw new ServiceException('Invalid email or password', ErrorCode.UNAUTHORIZED)
    }

    const passwordMatch = await comparePasswords(password, user.password)
    if (!passwordMatch) {
      throw new ServiceException('Invalid email or password', ErrorCode.UNAUTHORIZED)
    }

    return user
  },

  createUser: async (input: CreateUserDto): Promise<UserProfile> => {
    const usersCollection = await getUserCollection()

    // Check if user exists
    const existingUser = await usersCollection.findOne({ email: input.email })
    if (existingUser) {
      throw new ServiceException('Email already in use', ErrorCode.CONFLICT)
    }

    const hashedPassword = await hashPassword(input.password)
    const now = new Date()

    const newUser: DbUser = {
      _id: new ObjectId(),
      email: input.email,
      firstName: input.firstName,
      lastName: input.lastName,
      password: hashedPassword,
      isEmailVerified: false,
      createdAt: now,
      updatedAt: now
    }

    const result = await usersCollection.insertOne(newUser)
    newUser._id = result.insertedId

    return mapDbUserToProfile(newUser)
  },

  forgetPassword: async (email: string): Promise<void> => {
    const usersCollection = await getUserCollection()
    const user = await usersCollection.findOne({ email })

    if (!user) {
      // Don't reveal if email exists
      return
    }

    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex')

    await usersCollection.updateOne(
      { _id: user._id },
      {
        $set: {
          passwordResetToken: resetTokenHash,
          passwordResetExpires: new Date(Date.now() + 10 * 60 * 1000) // 10 min
        }
      }
    )

    // Send email with token
    await emailService.sendPasswordResetEmail(email, resetToken)
  },

  resetPassword: async (token: string, password: string): Promise<void> => {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')

    const usersCollection = await getUserCollection()
    const user = await usersCollection.findOne({
      passwordResetToken: tokenHash,
      passwordResetExpires: { $gt: new Date() }
    })

    if (!user) {
      throw new ServiceException('Invalid or expired reset token', ErrorCode.UNAUTHORIZED)
    }

    const hashedPassword = await hashPassword(password)

    await usersCollection.updateOne(
      { _id: user._id },
      {
        $set: { password: hashedPassword },
        $unset: {
          passwordResetToken: '',
          passwordResetExpires: ''
        }
      }
    )
  },

  findUserById: async (userId: string): Promise<DbUser | null> => {
    try {
      const usersCollection = await getUserCollection()
      return await usersCollection.findOne({
        _id: new ObjectId(userId)
      })
    } catch (error) {
      return null
    }
  }
}
```

#### File: `backend/src/features/auth/auth.handler.ts`

```typescript
/**
 * Auth Handler
 * Entry point for auth API endpoints
 * Handles HTTP request/response
 */
import type { NormalizedEvent } from '@/handlers/rest-api/types'
import type { LoginResponse } from '@shared-types/types'
import { loginValidation } from './auth.validation'
import { authService } from './auth.service'
import { tokenService } from './token.service'
import { ApiException } from '@/handlers/rest-api/error'
import { ApiErrorCode } from '@shared-types/types'
import { HttpStatus } from '@/data/constants'
import { ServiceException } from '@/services/error'

export const loginHandler = async (event: NormalizedEvent): Promise<LoginResponse> => {
  try {
    const validatedData = loginValidation.parse(event.body)
    const user = await authService.authenticateUser(validatedData.email, validatedData.password)

    const accessToken = tokenService.generateToken(user._id.toHexString(), {
      principalId: user._id.toHexString(),
      email: user.email
    })

    return {
      accessToken,
      expiresIn: 86400, // 24 hours in seconds
      tokenType: 'Bearer',
      user: {
        id: user._id.toHexString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        name: `${user.firstName} ${user.lastName}`,
        isEmailVerified: user.isEmailVerified,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString()
      }
    }
  } catch (error: unknown) {
    if (error instanceof ServiceException) {
      throw new ApiException(HttpStatus.BAD_REQUEST, ApiErrorCode.BAD_REQUEST, true, error.message)
    }
    throw error
  }
}

export const signupHandler = async (
  event: NormalizedEvent
): Promise<{ id: string; message: string }> => {
  try {
    const { signupValidation } = await import('./auth.validation')
    const validatedData = signupValidation.parse(event.body)

    const user = await authService.createUser(validatedData)

    return {
      id: user.id,
      message: 'Signup successful. Please verify your email.'
    }
  } catch (error: unknown) {
    if (error instanceof ServiceException) {
      throw new ApiException(HttpStatus.BAD_REQUEST, ApiErrorCode.BAD_REQUEST, true, error.message)
    }
    throw error
  }
}

export const forgetPasswordHandler = async (
  event: NormalizedEvent
): Promise<{ message: string }> => {
  try {
    const { forgetPasswordValidation } = await import('./auth.validation')
    const validatedData = forgetPasswordValidation.parse(event.body)

    await authService.forgetPassword(validatedData.email)

    return {
      message: 'If an account with that email exists, a reset link has been sent.'
    }
  } catch (error: unknown) {
    if (error instanceof ServiceException) {
      throw new ApiException(HttpStatus.BAD_REQUEST, ApiErrorCode.BAD_REQUEST, true, error.message)
    }
    throw error
  }
}

export const resetPasswordHandler = async (
  event: NormalizedEvent
): Promise<{ message: string }> => {
  try {
    const { resetPasswordValidation } = await import('./auth.validation')
    const { token } = event.pathParams

    const validatedData = resetPasswordValidation.parse(event.body)

    await authService.resetPassword(token, validatedData.password)

    return {
      message: 'Password reset successfully. You can now login with your new password.'
    }
  } catch (error: unknown) {
    if (error instanceof ServiceException) {
      throw new ApiException(HttpStatus.BAD_REQUEST, ApiErrorCode.BAD_REQUEST, true, error.message)
    }
    throw error
  }
}
```

#### File: `backend/src/features/auth/email.service.ts`

```typescript
/**
 * Email Service for Auth
 */
import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
})

interface EmailServiceInterface {
  sendPasswordResetEmail: (email: string, token: string) => Promise<void>
  sendVerificationEmail: (email: string, token: string) => Promise<void>
}

export const emailService: EmailServiceInterface = {
  sendPasswordResetEmail: async (email: string, token: string) => {
    const resetUrl = `${process.env.FRONTEND_URL}/auth/reset-password/${token}`

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset Request',
      html: `
        <h2>Password Reset</h2>
        <p>You requested a password reset.</p>
        <p><a href="${resetUrl}">Click here to reset your password</a></p>
        <p>This link expires in 10 minutes.</p>
      `
    }

    return new Promise((resolve, reject) => {
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error('Email send error:', error)
          reject(error)
        } else {
          console.log('Email sent:', info.response)
          resolve()
        }
      })
    })
  },

  sendVerificationEmail: async (email: string, token: string) => {
    const verifyUrl = `${process.env.FRONTEND_URL}/auth/verify/${token}`

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Verify Your Email',
      html: `
        <h2>Welcome to Flint!</h2>
        <p>Please verify your email address.</p>
        <p><a href="${verifyUrl}">Click here to verify</a></p>
        <p>This link expires in 24 hours.</p>
      `
    }

    return new Promise((resolve, reject) => {
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error('Email send error:', error)
          reject(error)
        } else {
          console.log('Email sent:', info.response)
          resolve()
        }
      })
    })
  }
}
```

#### File: `backend/src/features/auth/index.ts`

```typescript
export { authService } from './auth.service'
export { tokenService } from './token.service'
export { emailService } from './email.service'
export {
  loginHandler,
  signupHandler,
  forgetPasswordHandler,
  resetPasswordHandler
} from './auth.handler'
export type { DbUser, CreateUserDto, AuthServiceResult } from './auth.types'
```

---

## PART 3: Refactor Frontend to Feature-Based Structure

### New Frontend Structure:

```bash
frontend/src/features/auth/
├── components/
│   ├── LoginForm.tsx
│   ├── SignupForm.tsx
│   ├── ForgetPasswordForm.tsx
│   └── ResetPasswordForm.tsx
├── hooks/
│   ├── useAuth.ts
│   └── useLogin.ts
├── services/
│   └── auth.service.ts
├── types/
│   └── auth.types.ts
├── validations/
│   └── auth.validation.ts
└── index.ts
```

### Implementation:

#### File: `frontend/src/features/auth/types/auth.types.ts`

```typescript
/**
 * Auth types - import from shared-types
 */
export type {
  LoginRequest,
  SignupRequest,
  ForgetPasswordRequest,
  ResetPasswordRequest,
  LoginResponse,
  SignupResponse,
  ForgetPasswordResponse,
  ResetPasswordResponse,
  UserProfile
} from '@shared-types/types'
```

#### File: `frontend/src/features/auth/validations/auth.validation.ts`

```typescript
/**
 * Auth validations - import from shared-types
 */
export {
  loginValidation,
  signupValidation,
  forgetPasswordValidation,
  resetPasswordValidation,
  emailSchema,
  passwordSchema,
  nameSchema,
  type LoginValidationType,
  type SignupValidationType,
  type ForgetPasswordValidationType,
  type ResetPasswordValidationType
} from '@shared-types/validations'
```

#### File: `frontend/src/features/auth/services/auth.service.ts`

```typescript
/**
 * Auth API Service
 * Handles all authentication API calls
 */
import { apiRequest } from '@/shared/api/client'
import type {
  LoginRequest,
  LoginResponse,
  SignupRequest,
  SignupResponse,
  ForgetPasswordRequest,
  ForgetPasswordResponse,
  ResetPasswordRequest,
  ResetPasswordResponse
} from '@shared-types/types'

export const authService = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    return apiRequest<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  },

  signup: async (data: SignupRequest): Promise<SignupResponse> => {
    return apiRequest<SignupResponse>('/auth/sign-up', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  },

  forgetPassword: async (data: ForgetPasswordRequest): Promise<ForgetPasswordResponse> => {
    return apiRequest<ForgetPasswordResponse>('/auth/forget-password', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  },

  resetPassword: async (
    token: string,
    data: ResetPasswordRequest
  ): Promise<ResetPasswordResponse> => {
    return apiRequest<ResetPasswordResponse>(`/auth/reset-password/${token}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    })
  }
}
```

#### File: `frontend/src/features/auth/hooks/useAuth.ts`

```typescript
/**
 * useAuth Hook
 * Manages authentication state and logic
 */
'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { UserProfile } from '@shared-types/types'
import { ApiError } from '@/shared/api/client'

export interface UseAuthReturn {
  user: UserProfile | null
  isLoading: boolean
  isAuthenticated: boolean
  error: string | null
  setUser: (user: UserProfile | null) => void
  setError: (error: string | null) => void
  logout: () => void
}

export const useAuth = (): UseAuthReturn => {
  const router = useRouter()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const logout = useCallback(() => {
    setUser(null)
    localStorage.removeItem('accessToken')
    localStorage.removeItem('user')
    router.push('/auth/login')
  }, [router])

  return {
    user,
    isLoading,
    isAuthenticated: user !== null,
    error,
    setUser,
    setError,
    logout
  }
}
```

#### File: `frontend/src/features/auth/hooks/useLogin.ts`

```typescript
/**
 * useLogin Hook
 * Handles login form logic
 */
'use client'

import { useState } from 'react'
import type { LoginRequest } from '@shared-types/types'
import { authService } from '../services/auth.service'
import { ApiError } from '@/shared/api/client'
import { useAuth } from './useAuth'

export const useLogin = () => {
  const { setUser, setError } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  const login = async (credentials: LoginRequest) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await authService.login(credentials)

      // Store token
      localStorage.setItem('accessToken', response.accessToken)
      localStorage.setItem('user', JSON.stringify(response.user))

      setUser(response.user)
      return response
    } catch (err: unknown) {
      const message = err instanceof ApiError ? err.message : 'Login failed'
      setError(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  return { login, isLoading }
}
```

#### File: `frontend/src/features/auth/components/LoginForm.tsx`

```typescript
/**
 * Login Form Component
 * Refactored to use shared validations and types
 */
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'react-toastify'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Button } from '@/shared/components/ui/button'
import { ApiError } from '@/shared/api/client'
import { loginValidation, type LoginValidationType } from '../validations/auth.validation'
import { authService } from '../services/auth.service'
import { useAuth } from '../hooks/useAuth'

export const LoginForm: React.FC = () => {
  const router = useRouter()
  const { setUser } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginValidationType>({
    resolver: zodResolver(loginValidation)
  })

  const onSubmit = async (data: LoginValidationType) => {
    setIsLoading(true)

    try {
      const response = await authService.login(data)
      localStorage.setItem('accessToken', response.accessToken)
      localStorage.setItem('user', JSON.stringify(response.user))
      setUser(response.user)

      toast.success('Login successful!')
      router.push('/main')
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message)
      } else if (err instanceof Error) {
        toast.error(err.message)
      } else {
        toast.error('An unexpected error occurred.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          {...register('email')}
          disabled={isLoading}
        />
        {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
      </div>

      <div>
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          {...register('password')}
          disabled={isLoading}
        />
        {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
      </div>

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? 'Logging in...' : 'Log In'}
      </Button>
    </form>
  )
}
```

#### File: `frontend/src/features/auth/index.ts`

```typescript
export { LoginForm } from './components/LoginForm'
export { authService } from './services/auth.service'
export { useAuth, useLogin } from './hooks'
export type * from './types/auth.types'
```

---

## PART 4: Update ESLint Configuration

### Backend: `backend/eslint.config.ts` (Convert from .js)

```typescript
import tseslint from 'typescript-eslint'
import prettierConfig from 'eslint-config-prettier'

export default tseslint.config(
  {
    files: ['**/*.ts'],
    ignores: ['node_modules/**', 'dist/**', 'lib/**', 'coverage/**']
  },
  tseslint.configs.recommended,
  tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: process.cwd()
      }
    }
  },
  {
    rules: {
      // Strict type checking
      '@typescript-eslint/explicit-function-return-types': [
        'error',
        {
          allowExpressions: true,
          allowTypedFunctionExpressions: true,
          allowHigherOrderFunctions: true
        }
      ],
      '@typescript-eslint/explicit-module-boundary-types': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_'
        }
      ],

      // Async/Promise safety
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/no-misused-promises': 'error',

      // Strict boolean checks
      '@typescript-eslint/strict-boolean-expressions': [
        'warn',
        {
          allowString: false,
          allowNumber: false,
          allowNullableObject: false
        }
      ],

      // Logging
      'no-console': ['warn', { allow: ['error', 'warn'] }]
    }
  },
  prettierConfig
)
```

### Frontend: `frontend/eslint.config.mjs`

```javascript
import tseslint from 'typescript-eslint'
import nextPlugin from 'eslint-plugin-next'
import prettierConfig from 'eslint-config-prettier'

export default tseslint.config(
  {
    files: ['**/*.{ts,tsx}'],
    ignores: ['.next/**', 'node_modules/**']
  },
  tseslint.configs.recommendedTypeChecked,
  nextPlugin.configs.recommended,
  {
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: process.cwd()
      }
    }
  },
  {
    rules: {
      '@typescript-eslint/explicit-function-return-types': 'error',
      '@typescript-eslint/explicit-module-boundary-types': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@next/next/no-html-link-for-pages': 'off'
    }
  },
  prettierConfig
)
```

---

## PART 5: Update package.json & tsconfig.json

### Backend: Update `package.json`

```json
{
  "name": "backend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "tsx src/index.ts",
    "dev": "tsx --watch src/index.ts",
    "lint": "eslint . --ext .ts",
    "lint:fix": "eslint . --ext .ts --fix",
    "type-check": "tsc --noEmit",
    "format": "prettier --write \"**/*.ts\""
  },
  "dependencies": {
    "@shared-types": "workspace:*",
    "zod": "^4.3.4"
  }
}
```

### Backend: Update `tsconfig.json`

```jsonc
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "node",
    "lib": ["ES2020"],
    "strict": true,
    "strictNullChecks": true,
    "noImplicitAny": true,
    "noImplicitThis": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "sourceMap": true,
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "declaration": true,
    "outDir": "dist",
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@shared-types/*": ["../shared-types/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### Frontend: Update `tsconfig.json`

```jsonc
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "strict": true,
    "noImplicitAny": true,
    "noImplicitThis": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "jsx": "react-jsx",
    "module": "esnext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"],
      "@shared-types/*": ["../shared-types/*"],
      "@/shared/*": ["src/shared/*"],
      "@/features/*": ["src/features/*"]
    },
    "plugins": [{ "name": "next" }]
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

---

## Next Steps

1. **Create shared-types folder** first
2. **Update backend imports** to use shared types
3. **Update frontend imports** to use shared types
4. **Reorganize folders** to feature-based structure
5. **Update linting** configs
6. **Test everything** - all auth flows
7. **Update documentation**

This gives you:
✅ Single source of truth for types  
✅ Single source of truth for validations  
✅ Feature-based organization  
✅ Strict type safety  
✅ Easy to scale  
✅ Less duplication  
✅ Better maintainability
