import { TranslationData } from '../types'

const translationData: Partial<TranslationData> = {
  // Auth errors
  'err.auth.unauthorized': 'Please log in to continue.',
  'err.auth.permission_denied': 'You do not have permission to perform this action.',
  'err.auth.invalid_token': 'Your session has expired. Please log in again.',
  'err.auth.invalid_credentials': 'The email or password you entered is incorrect.',
  'err.auth.wrong_otp': 'The verification code is incorrect. Please try again.',

  // Data errors
  'err.data.not_found': 'We couldn\'t find the requested information.',
  'err.data.conflict': 'This information is already registered.',

  // System errors
  'err.system.internal_error': 'Something went wrong on our end. Please try again later.',
  'err.system.service_unavailable': 'The service is currently unavailable. Please check back soon.',

  // User errors
  'err.user.not_found': 'We couldn\'t find an account with those details.',
  'err.user.already_exists': 'An account with this email already exists.'
}

export default translationData