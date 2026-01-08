import { HttpResponseHeader, HttpStatus } from '@/data/constants'

export type QueryParams = Record<string, string | string[] | undefined>

export type ResponseHeaders = Partial<Record<HttpResponseHeader, string>>

export interface NormalizedEvent<T = unknown> {
  body: T
  pathParameters: Record<string, string>
  queryStringParameters: QueryParams
  httpMethod: string
  headers: Record<string, string>
  authorizerContext?: {
    payload: string
    principalId: string
  }
  query: QueryParams
}

export type ApiHandlerResponse<Resp> = Promise<Resp | { response: Resp; headers?: ResponseHeaders }>

export type ApiErrorHandler = (
  err: unknown,
  opt: {
    locale?: string
  },
) => Promise<{ statusCode: HttpStatus; body: Record<string, unknown> } | undefined>