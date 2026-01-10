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
  googleSchema,
  objectIdSchema
} from './auth.validation'

export {
  swipeSchema,
  listSchema,
  type SwipeFormData
} from './match.validation'

export {
  profileUpdateSchema,
  type ProfileCreationFormData
} from './profile.validation'

export {
  referenceUpdateSchema,
  type ReferenceUpdateFormData
} from './reference.validation'

export {
  sendMessageSchema,
  getMessagesQuerySchema,
  type SendMessageRequest,
  type GetMessagesQuery
} from './chat.validation'
