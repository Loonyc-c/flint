import { NextFunction, Request, Response } from 'express'
import { ApiException, ApiErrorCode } from '@/shared/api/error'
import { HttpStatus } from '@/data/constants'
import { isNil } from '@/utils'
import { authService } from '@/features/auth'

export const authorizer = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const tokenHeader = req.headers.authorization || ''
    const headerSlices = tokenHeader.split(' ')

    if (headerSlices.length !== 2 || headerSlices[0].toLowerCase() !== 'bearer') {
      throw new ApiException(HttpStatus.UNAUTHORIZED, ApiErrorCode.UNAUTHORIZED, {
        message: 'err.auth.invalid_token',
      })
    }

    const rawToken = headerSlices[1]
    const token = authService.extractToken(rawToken)

    if (isNil(token) || !token.sub) {
      throw new ApiException(HttpStatus.UNAUTHORIZED, ApiErrorCode.UNAUTHORIZED, {
        message: 'err.auth.invalid_token',
      })
    }

    req.authorizerContext = {
      payload: token.data,
      principalId: token.sub,
    }

    next()
  } catch (error) {
    next(error)
  }
}