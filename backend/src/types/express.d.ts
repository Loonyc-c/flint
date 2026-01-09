declare global {
  namespace Express {
    interface Request {
      authorizerContext?: {
        payload: any
        principalId: string
      }
    }
  }
}

export {}
