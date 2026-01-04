import { NextFunction, Request, Response } from 'express'
import {
  ApiHandlerResponse,
  ApiErrorHandler,
  NormalizedEvent,
  ResponseHeaders,
} from '@/shared/api/types'
import { HttpStatus, HttpResponseHeader, Locale } from '@/data/constants'
import normalizeEvent from '@/utils/normalize-event'

type ApiHandler = (event: NormalizedEvent) => ApiHandlerResponse<unknown>

const defaultHeaders = {
  [HttpResponseHeader.CONTENT_TYPE]: 'application/json',
}

const createApiHandler =
  (handler: ApiHandler) => async (req: Request, res: Response, next: NextFunction) => {
    try {
      const event = normalizeEvent(req)
      const result = await handler(event)

      let resData: unknown
      let headers: ResponseHeaders = {}

      if (result && typeof result === 'object' && 'response' in result) {
        resData = result.response
        headers = (result as { headers?: ResponseHeaders }).headers ?? {}
      } else {
        resData = result
      }
      res
        .status(HttpStatus.OK)
        .set({ ...defaultHeaders, ...headers })
        .json({
          success: true,
          data: resData,
        })
    } catch (e) {
      next(e)
    }
  }

export const createErrorhandler =
  (errorHandler: ApiErrorHandler) =>
  async (error: Error, req: Request, res: Response, _next: NextFunction) => {
    console.error('API Error:', error)
    const locale = (req.headers[HttpResponseHeader.ACCEPT_LANGUAGE] as Locale) ?? Locale.MONGOLIAN
    const errorResponse = await errorHandler(error, { locale })
    if (errorResponse) {
      let resData: unknown
      let headers: ResponseHeaders = {}

      if (typeof errorResponse === 'object' && errorResponse && 'response' in errorResponse) {
        resData = errorResponse.response
        headers = (errorResponse as { headers?: ResponseHeaders }).headers ?? {}
      } else {
        resData = errorResponse
      }

      const { statusCode, body } = resData as {
        statusCode: HttpStatus
        body: Record<string, unknown>
      }
      return res
        .status(statusCode)
        .set({ ...defaultHeaders, ...headers })
        .json(body)
    } else {
      return res
        .status(HttpStatus.INTERNAL_ERROR)
        .set({ ...defaultHeaders })
        .json({
          success: false,
          error: {
            code: 999,
            message: 'Internal server error',
            isReadableMessage: false,
          },
        })
    }
  }

export default createApiHandler
