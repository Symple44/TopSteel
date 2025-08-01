import * as crypto from 'node:crypto'
import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as QRCode from 'qrcode'
import * as speakeasy from 'speakeasy'

@Injectable()
export class TOTPService {
  private readonly logger = new Logger(TOTPService.name)
  private readonly algorithm = 'aes-256-gcm'
  private readonly encryptionKey: string

  constructor(private configService: ConfigService) {
    // Clé de chiffrement pour les secrets TOTP
    this.encryptionKey =
      this.configService.get<string>('MFA_ENCRYPTION_KEY') || this.generateDefaultKey()

    if (!this.configService.get<string>('MFA_ENCRYPTION_KEY')) {
      this.logger.warn(
        "MFA_ENCRYPTION_KEY non configuré, utilisation d'une clé par défaut (non sécurisé pour la production)"
      )
    }
  }

  /**
   * Générer une clé secrète TOTP
   */
  generateSecret(): {
    secret: string
    base32: string
    hex: string
    ascii: string
  } {
    try {
      const secret = speakeasy.generateSecret({
        name: 'TopSteel ERP',
        issuer: 'TopSteel',
        length: 32,
      })

      return {
        secret: secret.base32,
        base32: secret.base32,
        hex: secret.hex,
        ascii: secret.ascii,
      }
    } catch (error) {
      this.logger.error('Erreur lors de la génération du secret TOTP:', error)
      throw new Error('Impossible de générer le secret TOTP')
    }
  }

  /**
   * Générer un QR code pour l'authentificateur
   */
  async generateQRCode(
    userEmail: string,
    secret: string,
    issuer: string = 'TopSteel ERP'
  ): Promise<string> {
    try {
      const otpauthUrl = speakeasy.otpauthURL({
        secret,
        label: userEmail,
        issuer,
        algorithm: 'sha1',
        period: 30,
        digits: 6,
      })

      const qrCodeDataURL = await QRCode.toDataURL(otpauthUrl)
      return qrCodeDataURL
    } catch (error) {
      this.logger.error('Erreur lors de la génération du QR code:', error)
      throw new Error('Impossible de générer le QR code')
    }
  }

  /**
   * Vérifier un code TOTP
   */
  verifyToken(token: string, secret: string, window: number = 1): boolean {
    try {
      const verified = speakeasy.totp.verify({
        secret,
        token,
        window, // Tolérance de ±30 secondes par défaut
        algorithm: 'sha1',
        digits: 6,
      })

      return verified
    } catch (error) {
      this.logger.error('Erreur lors de la vérification du token TOTP:', error)
      return false
    }
  }

  /**
   * Générer un code TOTP (pour les tests)
   */
  generateToken(secret: string): string {
    try {
      return speakeasy.totp({
        secret,
        algorithm: 'sha1',
        digits: 6,
      })
    } catch (error) {
      this.logger.error('Erreur lors de la génération du token TOTP:', error)
      throw new Error('Impossible de générer le token TOTP')
    }
  }

  /**
   * Chiffrer un secret TOTP pour le stockage
   */
  encryptSecret(secret: string): string {
    try {
      const iv = crypto.randomBytes(16)
      const cipher = crypto.createCipheriv(this.algorithm, this.encryptionKey, iv)

      let encrypted = cipher.update(secret, 'utf8', 'hex')
      encrypted += cipher.final('hex')

      const authTag = cipher.getAuthTag()

      // Combiner IV, authTag et données chiffrées
      return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
    } catch (error) {
      this.logger.error('Erreur lors du chiffrement du secret:', error)
      throw new Error('Impossible de chiffrer le secret')
    }
  }

  /**
   * Déchiffrer un secret TOTP
   */
  decryptSecret(encryptedSecret: string): string {
    try {
      const parts = encryptedSecret.split(':')
      if (parts.length !== 3) {
        throw new Error('Format de secret chiffré invalide')
      }

      const iv = Buffer.from(parts[0], 'hex')
      const authTag = Buffer.from(parts[1], 'hex')
      const encrypted = parts[2]

      const decipher = crypto.createDecipheriv(this.algorithm, this.encryptionKey, iv)
      decipher.setAuthTag(authTag)

      let decrypted = decipher.update(encrypted, 'hex', 'utf8')
      decrypted += decipher.final('utf8')

      return decrypted
    } catch (error) {
      this.logger.error('Erreur lors du déchiffrement du secret:', error)
      throw new Error('Impossible de déchiffrer le secret')
    }
  }

  /**
   * Générer des codes de récupération
   */
  generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = []

    for (let i = 0; i < count; i++) {
      const code = crypto.randomBytes(4).toString('hex').toUpperCase()
      const formattedCode = code.match(/.{1,4}/g)?.join('-') || code
      codes.push(formattedCode)
    }

    return codes
  }

  /**
   * Chiffrer les codes de récupération
   */
  encryptBackupCodes(codes: string[]): string {
    try {
      const codesString = JSON.stringify(codes)
      return this.encryptSecret(codesString)
    } catch (error) {
      this.logger.error('Erreur lors du chiffrement des codes de récupération:', error)
      throw new Error('Impossible de chiffrer les codes de récupération')
    }
  }

  /**
   * Déchiffrer les codes de récupération
   */
  decryptBackupCodes(encryptedCodes: string): string[] {
    try {
      const codesString = this.decryptSecret(encryptedCodes)
      return JSON.parse(codesString)
    } catch (error) {
      this.logger.error('Erreur lors du déchiffrement des codes de récupération:', error)
      throw new Error('Impossible de déchiffrer les codes de récupération')
    }
  }

  /**
   * Vérifier un code de récupération
   */
  verifyBackupCode(
    code: string,
    encryptedCodes: string
  ): {
    isValid: boolean
    remainingCodes?: string[]
    updatedEncryptedCodes?: string
  } {
    try {
      const codes = this.decryptBackupCodes(encryptedCodes)
      const upperCode = code.toUpperCase()

      const codeIndex = codes.findIndex((c) => c === upperCode)

      if (codeIndex === -1) {
        return { isValid: false }
      }

      // Supprimer le code utilisé
      codes.splice(codeIndex, 1)

      return {
        isValid: true,
        remainingCodes: codes,
        updatedEncryptedCodes: this.encryptBackupCodes(codes),
      }
    } catch (error) {
      this.logger.error('Erreur lors de la vérification du code de récupération:', error)
      return { isValid: false }
    }
  }

  /**
   * Obtenir le temps restant pour le token actuel
   */
  getTimeRemaining(): number {
    const period = 30 // 30 secondes
    const currentTime = Math.floor(Date.now() / 1000)
    const timeStep = Math.floor(currentTime / period)
    const nextStep = (timeStep + 1) * period
    return nextStep - currentTime
  }

  /**
   * Valider le format d'un token TOTP
   */
  isValidTokenFormat(token: string): boolean {
    return /^\d{6}$/.test(token)
  }

  /**
   * Générer une clé par défaut (pour le développement uniquement)
   */
  private generateDefaultKey(): string {
    return crypto.createHash('sha256').update('topsteel-mfa-default-key').digest('hex')
  }

  /**
   * Obtenir des informations sur la configuration TOTP
   */
  getConfiguration(): {
    algorithm: string
    period: number
    digits: number
    window: number
  } {
    return {
      algorithm: 'sha1',
      period: 30,
      digits: 6,
      window: 1,
    }
  }

  /**
   * Vérifier si un secret est valide
   */
  isValidSecret(secret: string): boolean {
    try {
      // Tenter de générer un token avec le secret
      this.generateToken(secret)
      return true
    } catch {
      return false
    }
  }

  /**
   * Générer une URL d'authentificateur manuelle (sans QR code)
   */
  generateManualEntryKey(secret: string): string {
    // Formatage du secret pour saisie manuelle (groupes de 4 caractères)
    return secret.match(/.{1,4}/g)?.join(' ') || secret
  }
}
