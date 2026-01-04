import { TranslationKey } from './localization/types'

export enum ErrorCode {
  NOT_FOUND,
  UNAUTHORIZED,
  FORBIDDEN,
  INTERNAL_ERROR,
  BAD_REQUEST,
}

export class ServiceException extends Error {
  code: ErrorCode

  constructor(message: TranslationKey, code?: ErrorCode) {
    super(message)
    Object.setPrototypeOf(this, ServiceException.prototype)
    this.constructor = ServiceException
    this.message = message
    this.code = code ?? ErrorCode.INTERNAL_ERROR
  }
}
