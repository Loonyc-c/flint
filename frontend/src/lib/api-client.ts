const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9999/v1'

export interface ApiSuccessResponse<T> {
  success: true
  data: T
}

export interface ApiErrorResponse {
  success: false
  error: {
    code: number
    message: string
    isReadableMessage: boolean
    data?: unknown
  }
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse

export class ApiError extends Error {
  constructor(
    public code: number,
    message: string,
    public isReadableMessage: boolean,
    public data?: unknown
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`

  let response: Response
  try {
    response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      credentials: 'include'
    })
  } catch (error) {
    if (error instanceof TypeError) {
      throw new ApiError(
        0,
        'Network error: Could not connect to server. Please check if the server is running.',
        false
      )
    }
    throw error
  }

  let responseData: ApiResponse<T> | ApiErrorResponse
  try {
    responseData = await response.json()
  } catch (parseError) {
    throw new ApiError(
      response.status || 0,
      `Invalid response from server (status: ${response.status})`,
      false
    )
  }

  if (!response.ok || ('success' in responseData && !responseData.success)) {
    if ('error' in responseData) {
      throw new ApiError(
        responseData.error.code,
        responseData.error.message,
        responseData.error.isReadableMessage,
        responseData.error.data
      )
    }
    throw new ApiError(response.status, `Request failed with status ${response.status}`, false)
  }

  if ('success' in responseData && responseData.success) {
    return responseData.data
  }

  throw new ApiError(response.status, 'Unexpected response format', false)
}
