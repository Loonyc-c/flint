import { TranslationData } from '@/features/auth/services/localization/types'

const translationData: Partial<TranslationData> = {
  // Auth errors
  'err.auth.unauthorized': 'Unauthorized',
  'err.auth.permission_denied': 'Permission denied',
  'err.auth.invalid_token': 'Invalid or expired token',
  'err.auth.invalid_credentials': 'Invalid email or password',
  'err.auth.wrong_otp': 'Wrong OTP',

  // Data errors
  'err.data.not_found': 'Data not found',
  'err.data.conflict': 'Data already exists',

  // System errors
  'err.system.internal_error': 'Internal error',
  'err.system.service_unavailable': 'Service unavailable',

  // User errors
  'err.user.not_found': 'User not found',
}

export default translationData
