/**
 * Shared Validation Schemas
 * Single source of truth for all validation schemas across frontend and backend
 * Built with Zod for runtime type safety
 */

import { z } from 'zod'


type IsNil = (value: unknown) => value is null | undefined
export const isNil: IsNil = (value): value is null | undefined => {
  return value === null || value === undefined
}
/**
 * Regex patterns for validation
 * Keep in sync with backend constants
 */
const REGEX_PATTERNS = {
  EMAIL:
    /^(([^<>()[\]\\.,;:\s@!?%"^&*]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
  PASSWORD: /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/,
  PHONE: /^\d{8}$/
} as const

/**
 * Email Schema
 * - Trims and lowercases input
 * - Handles Gmail address normalization (removes dots)
 * - Validates against email regex
 */
export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .transform((email: string) => {
    const trimmed = email.trim().toLowerCase()
    const [localPart, domain] = trimmed.split('@')
    if (domain === 'gmail.com') {
      return `${localPart.replace(/\./g, '')}@${domain}`
    }
    return trimmed
  })
  .pipe(z.string().regex(REGEX_PATTERNS.EMAIL, 'Invalid email format'))

/**
 * Password Schema
 * Requirements:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one number
 * - At least one special character
 */
export const passwordSchema = z
  .string()
  .min(1, 'Password is required')
  .regex(
    REGEX_PATTERNS.PASSWORD,
    'Password must be at least 8 characters with uppercase, number, and special character'
  )

/**
 * Name Schema
 * - Minimum 2 characters, maximum 1000
 * - Transforms to title case (First letter of each word capitalized)
 */
export const nameSchema = z
  .string()
  .min(1, 'Name is required')
  .transform((name: string) => {
    return name
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  })
  .pipe(z.string().min(2, 'Name must be at least 2 characters').max(1000, 'Name is too long'))

/**
 * Login Validation Schema
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema
})

export type LoginFormData = z.infer<typeof loginSchema>

/**
 * Signup Validation Schema
 */
export const signupSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
  email: emailSchema,
  password: passwordSchema
})

export type SignupFormData = z.infer<typeof signupSchema>

/**
 * Forget Password Validation Schema
 */
export const forgetPasswordSchema = z.object({
  email: emailSchema
})

export type ForgetPasswordFormData = z.infer<typeof forgetPasswordSchema>

/**
 * Reset Password Validation Schema
 * - Ensures password and confirmPassword match
 */
export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: passwordSchema
  })
  .refine(
    (data: { password: string; confirmPassword: string }) => data.password === data.confirmPassword,
    {
      message: "Passwords don't match",
      path: ['confirmPassword']
    }
  )

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>

/**
 * Base schemas (for reuse)
 */
export const baseSchemas = {
  email: emailSchema,
  password: passwordSchema,
  name: nameSchema
} as const

/**
 * Google token schema
 */
export const googleSchema = z.object({
  token: z.string().min(1, 'Google token is required')
})


export const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'String must be valid ObjectId')