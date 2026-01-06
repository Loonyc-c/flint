import { User } from '@/data/db/types/user';

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