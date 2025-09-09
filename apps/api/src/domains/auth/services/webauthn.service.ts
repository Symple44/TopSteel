import * as crypto from 'node:crypto'
import { Injectable, Logger } from '@nestjs/common'
import type { ConfigService } from '@nestjs/config'
import type {
  WebAuthnAuthenticationResponse,
  WebAuthnRegistrationResponse,
} from '../../../types/auth/webauthn.types'

interface WebAuthnCredential {
  credentialId: string
  publicKey: string
  counter: number
  deviceName?: string
  userAgent?: string
  createdAt: string
}

@Injectable()
export class WebAuthnService {
  private readonly logger = new Logger(WebAuthnService.name)
  private readonly rpName: string
  private readonly rpID: string
  private readonly origin: string

  constructor(private configService: ConfigService) {
    this.rpName = this.configService.get<string>('WEBAUTHN_RP_NAME') || 'TopSteel ERP'
    this.rpID = this.configService.get<string>('WEBAUTHN_RP_ID') || 'localhost'
    this.origin = this.configService.get<string>('WEBAUTHN_ORIGIN') || 'http://localhost:3000'

    this.logger.log(`WebAuthn configuré: RP=${this.rpName}, ID=${this.rpID}, Origin=${this.origin}`)
  }

  /**
   * Générer les options d'enregistrement WebAuthn
   */
  async generateRegistrationOptions(
    userId: string,
    userEmail: string,
    userName: string,
    _existingCredentials: WebAuthnCredential[] = []
  ): Promise<{
    options: Record<string, unknown>
    challenge: string
  }> {
    try {
      const challenge = crypto.randomBytes(32).toString('base64url')

      const options = {
        challenge,
        rp: {
          name: this.rpName,
          id: this.rpID,
        },
        user: {
          id: Buffer.from(userId).toString('base64url'),
          name: userEmail,
          displayName: userName,
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' },
          { alg: -257, type: 'public-key' },
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'preferred',
        },
        timeout: 60000,
        attestation: 'none',
      }

      return {
        options,
        challenge,
      }
    } catch (error) {
      this.logger.error("Erreur lors de la génération des options d'enregistrement:", error)
      throw new Error("Impossible de générer les options d'enregistrement WebAuthn")
    }
  }

  /**
   * Vérifier la réponse d'enregistrement WebAuthn
   */
  async verifyRegistrationResponse(
    response: unknown,
    _expectedChallenge: string,
    _expectedOrigin: string = this.origin,
    _expectedRPID: string = this.rpID
  ): Promise<{
    verified: boolean
    registrationInfo?: {
      credentialId: string
      publicKey: string
      counter: number
      credentialDeviceType: string
      credentialBackedUp: boolean
    }
    error?: string
  }> {
    try {
      // Implémentation simplifiée pour la compatibilité
      // En production, utiliser une vraie vérification WebAuthn

      const typedResponse = response as WebAuthnRegistrationResponse
      if (!typedResponse || !typedResponse.id) {
        return {
          verified: false,
          error: 'Réponse WebAuthn invalide',
        }
      }

      return {
        verified: true,
        registrationInfo: {
          credentialId: typedResponse.id,
          publicKey: typedResponse.response.publicKey || 'mock-public-key',
          counter: 0,
          credentialDeviceType: 'platform',
          credentialBackedUp: false,
        },
      }
    } catch (error) {
      this.logger.error("Erreur lors de la vérification de l'enregistrement:", error)
      return {
        verified: false,
        error: (error as Error).message || 'Erreur de vérification',
      }
    }
  }

  /**
   * Générer les options d'authentification WebAuthn
   */
  async generateAuthenticationOptions(credentials: WebAuthnCredential[]): Promise<{
    options: Record<string, unknown>
    challenge: string
  }> {
    try {
      const challenge = crypto.randomBytes(32).toString('base64url')

      const allowCredentials = credentials.map((cred) => ({
        id: cred.credentialId,
        type: 'public-key',
        transports: ['internal', 'usb', 'ble', 'nfc'],
      }))

      const options = {
        challenge,
        timeout: 60000,
        allowCredentials,
        userVerification: 'preferred',
        rpId: this.rpID,
      }

      return {
        options,
        challenge,
      }
    } catch (error) {
      this.logger.error("Erreur lors de la génération des options d'authentification:", error)
      throw new Error("Impossible de générer les options d'authentification WebAuthn")
    }
  }

  /**
   * Vérifier la réponse d'authentification WebAuthn
   */
  async verifyAuthenticationResponse(
    response: unknown,
    _expectedChallenge: string,
    credential: WebAuthnCredential,
    _expectedOrigin: string = this.origin,
    _expectedRPID: string = this.rpID
  ): Promise<{
    verified: boolean
    newCounter?: number
    error?: string
  }> {
    try {
      // Implémentation simplifiée pour la compatibilité
      // En production, utiliser une vraie vérification WebAuthn

      const typedResponse = response as WebAuthnAuthenticationResponse
      if (!typedResponse || !typedResponse.id || typedResponse.id !== credential.credentialId) {
        return {
          verified: false,
          error: 'Credential WebAuthn invalide',
        }
      }

      return {
        verified: true,
        newCounter: credential.counter + 1,
      }
    } catch (error) {
      this.logger.error("Erreur lors de la vérification de l'authentification:", error)
      return {
        verified: false,
        error: (error as Error).message || 'Erreur de vérification',
      }
    }
  }

  /**
   * Générer un ID de challenge unique
   */
  generateChallengeId(): string {
    return crypto.randomBytes(32).toString('base64url')
  }

  /**
   * Extraire le nom de l'appareil depuis le User-Agent
   */
  extractDeviceName(userAgent: string): string {
    try {
      // Détection basique du navigateur et de l'OS
      const browser = userAgent.includes('Chrome')
        ? 'Chrome'
        : userAgent.includes('Firefox')
          ? 'Firefox'
          : userAgent.includes('Safari')
            ? 'Safari'
            : userAgent.includes('Edge')
              ? 'Edge'
              : 'Navigateur inconnu'

      const os = userAgent.includes('Windows')
        ? 'Windows'
        : userAgent.includes('Mac')
          ? 'macOS'
          : userAgent.includes('Linux')
            ? 'Linux'
            : userAgent.includes('Android')
              ? 'Android'
              : userAgent.includes('iOS')
                ? 'iOS'
                : 'OS inconnu'

      return `${browser} sur ${os}`
    } catch (error) {
      this.logger.error("Erreur lors de l'extraction du nom de l'appareil:", error)
      return 'Appareil inconnu'
    }
  }

  /**
   * Vérifier si WebAuthn est supporté par le navigateur
   */
  isWebAuthnSupported(userAgent: string): boolean {
    // Vérification basique du support WebAuthn
    const unsupportedBrowsers = [
      /MSIE/i,
      /Trident/i,
      /Edge\/1[0-8]/i, // Edge legacy
    ]

    return !unsupportedBrowsers.some((pattern) => pattern.test(userAgent))
  }

  /**
   * Obtenir les types d'authentificateurs recommandés
   */
  getRecommendedAuthenticatorTypes(): {
    platform: string[]
    crossPlatform: string[]
  } {
    return {
      platform: ['Windows Hello', 'Touch ID', 'Face ID', 'Android Biometric'],
      crossPlatform: ['YubiKey', 'Google Titan', 'Clé de sécurité FIDO2'],
    }
  }

  /**
   * Convertir un credential ID en format lisible
   */
  formatCredentialId(credentialId: string): string {
    try {
      // Prendre les 8 premiers caractères et ajouter des ellipses
      return `${credentialId.substring(0, 8)}...`
    } catch {
      return 'ID invalide'
    }
  }

  /**
   * Obtenir la configuration WebAuthn
   */
  getConfiguration(): {
    rpName: string
    rpID: string
    origin: string
    timeout: number
    userVerification: string
  } {
    return {
      rpName: this.rpName,
      rpID: this.rpID,
      origin: this.origin,
      timeout: 60000,
      userVerification: 'preferred',
    }
  }

  /**
   * Valider les données de credential
   */
  validateCredential(credential: WebAuthnCredential): boolean {
    try {
      return !!(
        credential.credentialId &&
        credential.publicKey &&
        typeof credential.counter === 'number' &&
        credential.createdAt
      )
    } catch {
      return false
    }
  }

  /**
   * Générer des statistiques d'utilisation
   */
  generateUsageStats(credentials: WebAuthnCredential[]): {
    totalCredentials: number
    activeCredentials: number
    deviceTypes: { [key: string]: number }
    oldestCredential?: string
    newestCredential?: string
  } {
    const stats = {
      totalCredentials: credentials.length,
      activeCredentials: credentials.length, // Tous sont considérés actifs
      deviceTypes: {} as { [key: string]: number },
      oldestCredential: undefined as string | undefined,
      newestCredential: undefined as string | undefined,
    }

    if (credentials.length === 0) {
      return stats
    }

    // Analyser les types d'appareils
    credentials.forEach((cred) => {
      const deviceName = cred.deviceName || 'Appareil inconnu'
      stats.deviceTypes[deviceName] = (stats.deviceTypes[deviceName] || 0) + 1
    })

    // Trouver les credentials les plus anciens et récents
    const sortedByDate = credentials.sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    )

    stats.oldestCredential = sortedByDate[0]?.createdAt
    stats.newestCredential = sortedByDate[sortedByDate.length - 1]?.createdAt

    return stats
  }
}
