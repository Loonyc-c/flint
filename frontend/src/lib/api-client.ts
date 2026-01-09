import { isNil } from './utils'

// =============================================================================
// Constants
// =============================================================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9999/v1'

// =============================================================================
// Types
// =============================================================================

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

// =============================================================================
// Error Class
// =============================================================================

/**
 * Custom error class for API errors.
 * Preserves error code, message readability flag, and additional data.
 */
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

// =============================================================================
// Token Management
// =============================================================================

const TOKEN_KEY = 'flint_access_token'

/**
 * Retrieves the authentication token from localStorage.
 * Returns null when running on the server or when no token exists.
 */
const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TOKEN_KEY)
}

// =============================================================================
// API Request Function
// =============================================================================

/**
 * Makes an authenticated API request to the backend.
 *
 * @template T - The expected response data type
 * @param endpoint - API endpoint (will be appended to API_BASE_URL)
 * @param options - Standard fetch options
 * @returns Promise resolving to the response data
 * @throws ApiError for any API or network errors
 *
 * @example
 * ```ts
 * // GET request
 * const users = await apiRequest<User[]>('/users')
 *
 * // POST request with body
 * const newUser = await apiRequest<User>('/users', {
 *   method: 'POST',
 *   body: JSON.stringify({ name: 'John' })
 * })
 * ```
 */
export const apiRequest = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
  const url = `${API_BASE_URL}${endpoint}`
  const token = getAuthToken()

  // Attempt the fetch request
  let response: Response
  try {
    response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(!isNil(token) ? { Authorization: `Bearer ${token}` } : {}),
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

  // Parse the response JSON
  let responseData: ApiResponse<T> | ApiErrorResponse
  try {
    responseData = await response.json()
  } catch {
    throw new ApiError(
      response.status || 0,
      `Invalid response from server (status: ${response.status})`,
      false
    )
  }

  // Handle error responses
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

  // Return successful response data
  if ('success' in responseData && responseData.success) {
    return responseData.data
  }

  throw new ApiError(response.status, 'Unexpected response format', false)
}
