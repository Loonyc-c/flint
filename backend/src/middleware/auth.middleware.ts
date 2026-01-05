import { NextFunction, Request, Response } from 'express'
import { ApiException, ApiErrorCode } from '@/shared/api/error'
import { HttpStatus } from '@/data/constants'
import { getUserCollection } from '@/data/db/collection'
import { isNil } from '@/utils'
import { ObjectId } from 'mongodb'
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

    const userCollection = await getUserCollection()
    const user = await userCollection.findOne(
      { _id: new ObjectId(token.sub) },
      {
        projection: {
          _id: 1,
          'auth.email': 1,
          'auth.firstName': 1,
          'auth.lastName': 1,
          isActive: 1,
          isDeleted: 1,
          profileCompletion: 1,
          preferences: 1,
        },
      },
    )

    if (isNil(user)) {
      throw new ApiException(HttpStatus.NOT_FOUND, ApiErrorCode.NOT_FOUND, {
        message: 'err.data.not_found',
      })
    }

    req.user = user
    next()
  } catch (error) {
    next(error)
  }
}
