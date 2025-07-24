export interface JwtPayload {
  sub: string
  email: string
  role: string
  sessionId?: string
  iat?: number
  exp?: number
}

export interface MultiTenantJwtPayload extends JwtPayload {
  societeId?: string
  societeCode?: string
  siteId?: string
  permissions?: string[]
  tenantDatabase?: string
}

export interface ExtendedJwtPayload extends JwtPayload {
  iss?: string
  aud?: string
}
