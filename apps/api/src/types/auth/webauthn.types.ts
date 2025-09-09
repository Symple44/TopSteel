/**
 * Types pour WebAuthn et authentification
 * Créé pour résoudre les erreurs TypeScript dans les services MFA
 */

export interface WebAuthnRegistrationOptions {
  challenge: string
  rp: {
    name: string
    id: string
  }
  user: {
    id: string
    name: string
    displayName: string
  }
  pubKeyCredParams: Array<{
    type: string
    alg: number
  }>
  timeout?: number
  attestation?: string
  excludeCredentials?: Array<{
    id: string
    type: string
  }>
}

export interface WebAuthnRegistrationResponse {
  id: string
  rawId: string
  type: string
  response: {
    publicKey: string
    clientDataJSON: string
    attestationObject: string
  }
}

export interface WebAuthnAuthenticationOptions {
  challenge: string
  timeout?: number
  rpId: string
  allowCredentials?: Array<{
    id: string
    type: string
  }>
  userVerification?: string
}

export interface WebAuthnAuthenticationResponse {
  id: string
  rawId: string
  type: string
  response: {
    clientDataJSON: string
    authenticatorData: string
    signature: string
    userHandle?: string
  }
}

export interface WebAuthnCredential {
  id: string
  userId: string
  credentialId: string
  publicKey: string
  counter: number
  deviceName?: string
  createdAt: Date | string
  lastUsedAt?: Date | string
}

export interface MFAMethod {
  id: string
  userId: string
  type: 'TOTP' | 'SMS' | 'EMAIL' | 'WEBAUTHN'
  isEnabled: boolean
  isVerified: boolean
  secret?: string
  phoneNumber?: string
  email?: string
  metadata?: {
    qrCode?: string
    deviceInfo?: {
      deviceName: string
      userAgent: string
      ipAddress: string
    }
    lastUsed?: string
    usageCount?: number
    failedAttempts?: number
    lastFailedAttempt?: string
  }
  createdAt: Date | string
  updatedAt: Date | string
}

export interface MFAVerificationRequest {
  userId: string
  method: 'TOTP' | 'SMS' | 'EMAIL' | 'WEBAUTHN'
  code?: string
  webauthnResponse?: WebAuthnAuthenticationResponse
}

export interface MFAVerificationResponse {
  success: boolean
  message?: string
  remainingAttempts?: number
  nextAllowedAttempt?: Date | string
}
