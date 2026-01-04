import { HttpResponseHeader } from '@/data/constants'
import { Locale } from '@/data/constants'
import { Request } from 'express'
import type { NormalizedEvent } from '@/shared/api/types'

const normalizeEvent = (req: Request): NormalizedEvent => {
  const {
    body,
    params: pathParameters, // Use params for path parameters
    method: httpMethodRaw,
    headers,
    ...rest
  } = req

  const queryStringParameters = req.query as Record<string, string | string[] | undefined>

  const headersInLowerCase: Record<string, string> = {}
  let acceptLanguageHeader: string | undefined

  for (const header in headers) {
    const headerValue = headers[header]
    if (typeof headerValue === 'string') {
      const headerLower = header.toLowerCase()
      headersInLowerCase[headerLower] = headerValue
      if (headerLower === HttpResponseHeader.ACCEPT_LANGUAGE) {
        acceptLanguageHeader = headerValue?.split('-')?.[0]
      }
    }
  }

  const normalizedHeaders: Record<string, string> = {
    ...headersInLowerCase,
    [HttpResponseHeader.ACCEPT_LANGUAGE]: Object.values(Locale).includes(
      acceptLanguageHeader as Locale,
    )
      ? (acceptLanguageHeader as Locale)
      : Locale.MONGOLIAN,
  }

  const httpMethod = httpMethodRaw.toLowerCase()

  return {
    body: body ?? {},
    pathParameters: pathParameters ?? {},
    queryStringParameters: queryStringParameters ?? {},
    httpMethod,
    headers: normalizedHeaders,
    ...rest,
  }
}

export default normalizeEvent
