import { ZodError } from 'zod'

import { ErrorCode, ServiceException } from '@/features/auth/services/error'
import localizationService from '@/features/auth/services/localization'
import { TranslationKey } from '@/features/auth/services/localization/types'

import { HttpStatus, Locale } from '@/data/constants'
import { ApiErrorHandler } from '@/shared/api/types'
export enum ApiErrorCode {
  NOT_IMPLEMENTED = 994,
  NOT_FOUND = 995,
  BAD_REQUEST = 996,
  UNAUTHORIZED = 997,
  FORBIDDEN = 998,
  INTERNAL_ERROR = 999,
}

export class ApiException extends Error {
  status: HttpStatus
  code: ApiErrorCode
  isReadableMessage: boolean
  data?: unknown

  constructor(
    status: HttpStatus,
    code: ApiErrorCode,
    message:
      | { message: string; isReadableMessage?: false }
      | { message: TranslationKey; isReadableMessage: true },
    data?: unknown,
  ) {
    super(message.message)
    Object.setPrototypeOf(this, ApiException.prototype)
    this.constructor = ApiException
    this.message = message.message
    this.isReadableMessage = message.isReadableMessage ?? false
    this.status = status
    this.code = code
    if (data !== undefined) {
      this.data = data
    }
  }
}

export const apiErrorHandler: ApiErrorHandler = async (error: unknown, { locale }) => {
  if (error instanceof ApiException) {
    return {
      statusCode: error.status,
      body: {
        success: false,
        error: {
          code: error.code,
          message: error.isReadableMessage
            ? localizationService.translate(error.message, locale as Locale)
            : error.message,
          isReadableMessage: error.isReadableMessage,
        },
      },
    }
  } else if (error instanceof ServiceException) {
    if (error.code === ErrorCode.FORBIDDEN) {
      return {
        statusCode: HttpStatus.FORBIDDEN,
        body: {
          success: false,
          error: {
            code: ApiErrorCode.FORBIDDEN,
            message: localizationService.translate('err.permission_denied', locale as Locale),
            isReadableMessage: true,
          },
        },
      }
    }
    return {
      statusCode: HttpStatus.INTERNAL_ERROR,
      body: {
        success: false,
        error: {
          code: ApiErrorCode.INTERNAL_ERROR,
          message: error.message,
          isReadableMessage: false,
        },
      },
    }
  } else if (error instanceof ZodError) {
    return {
      statusCode: HttpStatus.BAD_REQUEST,
      body: {
        success: false,
        error: {
          code: ApiErrorCode.BAD_REQUEST,
          message: 'Bad request',
          isReadableMessage: false,
          data: {
            validationIssues: error.issues,
          },
        },
      },
    }
  }
}
