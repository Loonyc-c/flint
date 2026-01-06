declare global {
  namespace Express {
    interface Request {
      authorizerContext?: {
        payload: string
        principalId: string
      }
    }
  }
}

export {}
