declare global {
  namespace Express {
    interface Request {
      startTime?: number
      requestId?: string
      user?: {
        id: string
        email: string
        role: string
      }
    }
  }
}
