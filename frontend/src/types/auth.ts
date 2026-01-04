export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  accessToken: string
  name: string
}

export interface SignupRequest {
  firstName: string
  lastName: string
  email: string
  password: string
}

export interface SignupResponse {
  id: string
  message: string
}
