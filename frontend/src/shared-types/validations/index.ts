/**
 * Shared Validations Exports
 * Clean single entry point for all shared validation schemas
 */

export {
  emailSchema,
  passwordSchema,
  nameSchema,
  loginSchema,
  signupSchema,
  forgetPasswordSchema,
  resetPasswordSchema,
  baseSchemas,
  type LoginFormData,
  type SignupFormData,
  type ForgetPasswordFormData,
  type ResetPasswordFormData,
  googleSchema
} from './auth.validation'
