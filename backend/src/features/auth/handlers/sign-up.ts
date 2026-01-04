import { NormalizedEvent } from '@/shared/api/types'
import { ServiceException } from '@/features/auth/services/error'
import { ApiErrorCode, ApiException } from '@/shared/api/error'
import { HttpStatus } from '@/data/constants'
import { TranslationKey } from '@/features/auth/services/localization/types'
import { MongoError } from 'mongodb'
import { isNil } from '@/utils'
import { signupSchema } from '@shared/validations'
import { authService } from '@/features/auth'

const handler = async (event: NormalizedEvent) => {
  const { body } = event

  try {
    const req = signupSchema.parse(body)
    const { id } = await authService.createUser(req)
    return {
      id,
      message: 'User created successfully',
    }
  } catch (e: unknown) {
    if (e instanceof ServiceException) {
      throw new ApiException(HttpStatus.BAD_REQUEST, ApiErrorCode.BAD_REQUEST, {
        message: e.message as TranslationKey,
        isReadableMessage: true,
      })
    }

    if (e instanceof MongoError) {
      if (e.code === 11000) {
        const err = e as MongoError & { keyValue?: Record<string, unknown> }
        if (!isNil(err.keyValue) && !isNil(err?.keyValue['name'])) {
          throw new ApiException(HttpStatus.BAD_REQUEST, ApiErrorCode.BAD_REQUEST, {
            message: 'err.data.conflict' as TranslationKey,
            isReadableMessage: true,
          })
        }
        throw e
      }
    }
    throw e
  }
}

export default handler
