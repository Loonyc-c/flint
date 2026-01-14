import { NormalizedEvent } from '@/shared/api/types'
import { profileService } from '@/features/profile/services/profile.service'
import { objectIdSchema, contactInfoSchema } from '@shared/validations'
import { HttpStatus } from '@/data/constants'
import { ApiErrorCode, ApiException } from '@/shared/api/error'
import { UserContactInfo } from '@shared/types'

// Update contact info handler
export const updateContactInfoHandler = async (event: NormalizedEvent): Promise<UserContactInfo> => {
  const { pathParameters: { id }, body, authorizerContext } = event

  if (id !== authorizerContext?.principalId) {
    throw new ApiException(HttpStatus.FORBIDDEN, ApiErrorCode.FORBIDDEN, {
      message: 'err.auth.permission_denied',
      isReadableMessage: true,
    })
  }

  const _id = objectIdSchema.parse(id)
  const contactInfo = contactInfoSchema.parse(body)

  return await profileService.updateContactInfo(_id, contactInfo)
}

// Get contact info handler
export const getContactInfoHandler = async (event: NormalizedEvent): Promise<{ contactInfo: UserContactInfo | null }> => {
  const { pathParameters: { id }, authorizerContext } = event

  if (id !== authorizerContext?.principalId) {
    throw new ApiException(HttpStatus.FORBIDDEN, ApiErrorCode.FORBIDDEN, {
      message: 'err.auth.permission_denied',
      isReadableMessage: true,
    })
  }

  const _id = objectIdSchema.parse(id)
  const contactInfo = await profileService.getContactInfo(_id)

  return { contactInfo }
}
