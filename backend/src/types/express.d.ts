declare global {
  namespace Express {
    interface Request {
      authorizerContext?: {
        payload: Record<string, unknown>
        principalId: string
      }
    }
  }
}

export {}
