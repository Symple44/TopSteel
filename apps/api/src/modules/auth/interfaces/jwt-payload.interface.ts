export interface JwtPayload {
  sub: string
  email: string
  role: string
  sessionId?: string
  iat?: number
  exp?: number
}

export interface ExtendedJwtPayload extends JwtPayload {
  iss?: string
  aud?: string
}
