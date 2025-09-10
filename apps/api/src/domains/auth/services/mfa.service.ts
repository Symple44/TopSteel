import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import type { Repository } from 'typeorm'
import { v4 as uuidv4 } from 'uuid'
import type { OptimizedCacheService } from '../../../infrastructure/cache/redis-optimized.service'
import type { MFAMethod, WebAuthnAuthenticationResponse } from '../../../types/auth/webauthn.types'
import { User } from '../../users/entities/user.entity'
import { GlobalUserRole } from '../core/constants/roles.constants'
import { MFASession } from '../core/entities/mfa-session.entity'
import { UserMFA } from '../core/entities/user-mfa.entity'
import type { GeolocationService } from './geolocation.service'
import type { SMSService } from './sms.service'
import type { TOTPService } from './totp.service'
import type { WebAuthnService } from './webauthn.service'

interface MFASetupResult {
  success: boolean
  mfaId?: string
  secret?: string
  qrCode?: string
  backupCodes?: string[]
  webauthnOptions?: Record<string, unknown>
  error?: string
}

interface MFAVerificationResult {
  success: boolean
  sessionToken?: string
  backupCodesUsed?: number
  error?: string
}

@Injectable()
export class MFAService {
  private readonly logger = new Logger(MFAService.name)
  private readonly MFA_CACHE_TTL = 300 // 5 minutes

  constructor(
    @InjectRepository(UserMFA, 'auth')
    public readonly userMFARepository: Repository<UserMFA>,
    @InjectRepository(MFASession, 'auth')
    public readonly mfaSessionRepository: Repository<MFASession>,
    @InjectRepository(User, 'auth')
    private readonly userRepository: Repository<User>,
    public readonly totpService: TOTPService,
    private readonly webauthnService: WebAuthnService,
    private readonly geolocationService: GeolocationService,
    private readonly cacheService: OptimizedCacheService,
    private readonly smsService: SMSService
  ) {}

  /**
   * Vérifier si un utilisateur a MFA activé ou requis
   */
  async hasMFAEnabled(userId: string): Promise<boolean> {
    const cacheKey = `mfa_enabled:${userId}`

    // Try cache first
    const cached = await this.cacheService.getWithMetrics<boolean>(cacheKey)
    if (cached !== null) {
      return cached
    }

    try {
      // Get user to check role
      const user = await this.userRepository.findOne({
        where: { id: userId },
        select: ['id', 'role'],
      })

      if (!user) {
        return false
      }

      // SUPER_ADMIN policy: MFA is optional but recommended
      if (user.role === GlobalUserRole.SUPER_ADMIN) {
        const mfaRecords = await this.userMFARepository.find({
          where: { userId, isEnabled: true, isVerified: true },
        })
        const hasMFA = mfaRecords.length > 0

        // Cache result for SUPER_ADMIN
        await this.cacheService.setWithGroup(cacheKey, hasMFA, `user:${userId}`, this.MFA_CACHE_TTL)
        return hasMFA
      }

      // For other roles, check if MFA is required by policy
      const isMFARequired = await this.isMFARequiredForRole(user.role as GlobalUserRole)

      if (isMFARequired) {
        // MFA is required - check if user has it enabled
        const mfaRecords = await this.userMFARepository.find({
          where: { userId, isEnabled: true, isVerified: true },
        })
        const hasMFA = mfaRecords.length > 0

        // Cache result
        await this.cacheService.setWithGroup(cacheKey, hasMFA, `user:${userId}`, this.MFA_CACHE_TTL)
        return hasMFA
      }

      // MFA not required for this role
      const mfaRecords = await this.userMFARepository.find({
        where: { userId, isEnabled: true, isVerified: true },
      })
      const hasMFA = mfaRecords.length > 0

      // Cache result
      await this.cacheService.setWithGroup(cacheKey, hasMFA, `user:${userId}`, this.MFA_CACHE_TTL)
      return hasMFA
    } catch (error) {
      this.logger.error(`Error checking MFA status for user ${userId}:`, error)
      return false
    }
  }

  /**
   * Vérifier si MFA est requis pour un rôle donné
   */
  async isMFARequiredForRole(role: GlobalUserRole): Promise<boolean> {
    // MFA policy based on role hierarchy
    const mfaRequiredRoles = [
      GlobalUserRole.SUPER_ADMIN, // Optional but recommended
      GlobalUserRole.ADMIN, // Required
      GlobalUserRole.MANAGER, // Required for managers
    ]

    return mfaRequiredRoles.includes(role)
  }

  /**
   * Vérifier si l'utilisateur peut bypasser MFA (SUPER_ADMIN in trusted environment)
   */
  async canBypassMFA(userId: string, ipAddress?: string, userAgent?: string): Promise<boolean> {
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId },
        select: ['id', 'role'],
      })

      if (!user || user.role !== GlobalUserRole.SUPER_ADMIN) {
        return false
      }

      // Check if it's from a trusted environment (same network, recognized device)
      const isTrustedEnvironment = await this.isTrustedEnvironment(userId, ipAddress, userAgent)

      if (isTrustedEnvironment) {
        this.logger.log(`SUPER_ADMIN ${userId} bypassing MFA from trusted environment`)
        return true
      }

      return false
    } catch (error) {
      this.logger.error(`Error checking MFA bypass for user ${userId}:`, error)
      return false
    }
  }

  /**
   * Vérifier si l'environnement est de confiance
   */
  private async isTrustedEnvironment(
    userId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<boolean> {
    if (!ipAddress || !userAgent) {
      return false
    }

    try {
      // Check geolocation trust
      const _location = await this.geolocationService.getLocationFromIP(ipAddress)

      // For now, consider local networks as trusted
      const isLocalNetwork =
        ipAddress.startsWith('192.168.') ||
        ipAddress.startsWith('10.') ||
        ipAddress.startsWith('172.')

      if (isLocalNetwork) {
        return true
      }

      // Check if this IP/device combination has been used recently
      const cacheKey = `trusted_device:${userId}:${this.hashDevice(ipAddress, userAgent)}`
      const isTrusted = await this.cacheService.get(cacheKey)

      return !!isTrusted
    } catch (error) {
      this.logger.error('Error checking trusted environment:', error)
      return false
    }
  }

  /**
   * Marquer un appareil comme de confiance
   */
  async markDeviceAsTrusted(
    userId: string,
    ipAddress: string,
    userAgent: string,
    trustDurationDays = 30
  ): Promise<void> {
    const cacheKey = `trusted_device:${userId}:${this.hashDevice(ipAddress, userAgent)}`
    const ttl = trustDurationDays * 24 * 60 * 60 // Convert to seconds

    await this.cacheService.set(
      cacheKey,
      {
        trustedAt: new Date().toISOString(),
        ipAddress,
        userAgent,
        location: await this.geolocationService.getLocationFromIP(ipAddress),
      },
      ttl
    )

    this.logger.log(`Device marked as trusted for user ${userId} for ${trustDurationDays} days`)
  }

  /**
   * Créer un hash de l'appareil
   */
  private hashDevice(ipAddress: string, userAgent: string): string {
    // Simple hash - in production, use proper crypto hashing
    const crypto = require('node:crypto')
    return crypto
      .createHash('sha256')
      .update(`${ipAddress}:${userAgent}`)
      .digest('hex')
      .substring(0, 16)
  }

  /**
   * Obtenir les méthodes MFA activées pour un utilisateur
   */
  async getUserMFAMethods(userId: string): Promise<UserMFA[]> {
    return await this.userMFARepository.find({
      where: { userId },
    })
  }

  /**
   * Configurer SMS pour un utilisateur
   */
  async setupSMS(userId: string, phoneNumber: string): Promise<MFASetupResult> {
    try {
      // Vérifier si SMS est déjà configuré
      const existingSMS = await this.userMFARepository.findOne({
        where: { userId, type: 'sms' },
      })

      if (existingSMS?.isVerified) {
        return {
          success: false,
          error: 'SMS déjà configuré pour cet utilisateur',
        }
      }

      // Valider le format du numéro de téléphone
      if (!this.isValidPhoneNumber(phoneNumber)) {
        return {
          success: false,
          error: 'Format de numéro de téléphone invalide (requis: +33XXXXXXXXX)',
        }
      }

      // Générer un code de vérification
      const verificationCode = this.generateSMSVerificationCode()

      // Envoyer le SMS de vérification
      const smsResult = await this.smsService.sendMFAVerificationCode(
        phoneNumber,
        verificationCode,
        10 // 10 minutes d'expiration
      )

      if (!smsResult.success) {
        return {
          success: false,
          error: `Impossible d'envoyer le SMS: ${smsResult.error}`,
        }
      }

      // Créer ou mettre à jour l'enregistrement MFA
      let mfaRecord: UserMFA
      if (existingSMS) {
        existingSMS.phoneNumber = phoneNumber
        existingSMS.isEnabled = false
        existingSMS.isVerified = false
        existingSMS.metadata = {
          ...existingSMS.metadata,
          lastUsed: new Date().toISOString(),
        } as MFAMethod['metadata']
        // Store SMS verification code temporarily
        const metadata = existingSMS.metadata as MFAMethod['metadata'] & {
          pendingVerificationCode?: string
          pendingCodeExpiry?: string
          smsMessageId?: string
        }
        metadata.pendingVerificationCode = verificationCode
        metadata.pendingCodeExpiry = new Date(Date.now() + 10 * 60 * 1000).toISOString()
        metadata.smsMessageId = smsResult.messageId
        mfaRecord = await this.userMFARepository.save(existingSMS)
      } else {
        mfaRecord = UserMFA.createSMS(userId, phoneNumber)
        mfaRecord.metadata = {
          // Store SMS verification temporarily
          lastUsed: new Date().toISOString(),
        } as MFAMethod['metadata']
        mfaRecord = await this.userMFARepository.save(mfaRecord)
      }

      return {
        success: true,
        mfaId: mfaRecord.id,
      }
    } catch (error) {
      this.logger.error('Erreur lors de la configuration SMS:', error)
      return {
        success: false,
        error: 'Impossible de configurer SMS',
      }
    }
  }

  /**
   * Vérifier et activer SMS
   */
  async verifyAndEnableSMS(
    userId: string,
    mfaId: string,
    verificationCode: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const mfaRecord = await this.userMFARepository.findOne({
        where: { id: mfaId, userId, type: 'sms' },
      })

      if (!mfaRecord) {
        return { success: false, error: 'Configuration SMS non trouvée' }
      }

      if (mfaRecord.isVerified) {
        return { success: false, error: 'SMS déjà vérifié' }
      }

      const metadata = mfaRecord.metadata as Record<string, unknown>
      const pendingCode = metadata?.pendingVerificationCode as string
      const codeExpiry = metadata?.pendingCodeExpiry as string

      if (!pendingCode || !codeExpiry) {
        return { success: false, error: 'Code de vérification non trouvé' }
      }

      if (new Date() > new Date(codeExpiry)) {
        return { success: false, error: 'Code de vérification expiré' }
      }

      if (pendingCode !== verificationCode) {
        mfaRecord.markFailedAttempt()
        await this.userMFARepository.save(mfaRecord)
        return { success: false, error: 'Code de vérification invalide' }
      }

      // Activer SMS
      mfaRecord.verify()
      mfaRecord.enable()
      mfaRecord.markAsUsed()

      // Nettoyer les données temporaires
      if (mfaRecord.metadata) {
        delete (mfaRecord.metadata as Record<string, unknown>).pendingVerificationCode
        delete (mfaRecord.metadata as Record<string, unknown>).pendingCodeExpiry
      }

      await this.userMFARepository.save(mfaRecord)

      return { success: true }
    } catch (error) {
      this.logger.error('Erreur lors de la vérification SMS:', error)
      return { success: false, error: 'Erreur de vérification' }
    }
  }

  /**
   * Envoyer un code SMS pour MFA
   */
  async sendSMSCode(
    userId: string,
    sessionToken?: string
  ): Promise<{ success: boolean; error?: string; expiresIn?: number }> {
    try {
      const mfaRecord = await this.userMFARepository.findOne({
        where: { userId, type: 'sms', isEnabled: true, isVerified: true },
      })

      if (!mfaRecord?.phoneNumber) {
        return { success: false, error: 'SMS non configuré pour cet utilisateur' }
      }

      if (mfaRecord.isRateLimited()) {
        return { success: false, error: 'Trop de tentatives, réessayez plus tard' }
      }

      // Générer un nouveau code
      const verificationCode = this.generateSMSVerificationCode()
      const _expiryTime = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes

      // Envoyer le SMS
      const smsResult = await this.smsService.sendMFAVerificationCode(
        mfaRecord.phoneNumber,
        verificationCode,
        5
      )

      if (!smsResult.success) {
        return {
          success: false,
          error: `Impossible d'envoyer le SMS: ${smsResult.error}`,
        }
      }

      // Stocker le code temporairement
      if (sessionToken) {
        const mfaSession = await this.mfaSessionRepository.findOne({
          where: { sessionToken },
        })

        if (mfaSession) {
          mfaSession.metadata = {
            ...mfaSession.metadata,
            smsCode: verificationCode, // Use the correct field name
          }
          await this.mfaSessionRepository.save(mfaSession)
        }
      }

      // Mettre à jour les métadonnées de l'utilisateur
      mfaRecord.metadata = {
        ...mfaRecord.metadata,
        lastUsed: new Date().toISOString(),
      } as MFAMethod['metadata']
      // Store message ID temporarily
      const metadata = mfaRecord.metadata as MFAMethod['metadata'] & { lastSMSMessageId?: string }
      metadata.lastSMSMessageId = smsResult.messageId
      await this.userMFARepository.save(mfaRecord)

      this.logger.log(`SMS code sent to user ${userId}`)

      return {
        success: true,
        expiresIn: 5 * 60, // 5 minutes en secondes
      }
    } catch (error) {
      this.logger.error("Erreur lors de l'envoi du code SMS:", error)
      return {
        success: false,
        error: "Impossible d'envoyer le code SMS",
      }
    }
  }

  /**
   * Valider un numéro de téléphone
   */
  private isValidPhoneNumber(phoneNumber: string): boolean {
    // Format international requis : +33123456789
    const phoneRegex = /^\+[1-9]\d{1,14}$/
    return phoneRegex.test(phoneNumber)
  }

  /**
   * Générer un code de vérification SMS
   */
  private generateSMSVerificationCode(): string {
    // Générer un code à 6 chiffres
    return Math.floor(100000 + Math.random() * 900000).toString()
  }

  /**
   * Configurer TOTP pour un utilisateur
   */
  async setupTOTP(
    userId: string,
    userEmail: string,
    phoneNumber?: string
  ): Promise<MFASetupResult> {
    try {
      // Vérifier si TOTP est déjà configuré
      const existingTOTP = await this.userMFARepository.findOne({
        where: { userId, type: 'totp' },
      })

      if (existingTOTP?.isVerified) {
        return {
          success: false,
          error: 'TOTP déjà configuré pour cet utilisateur',
        }
      }

      // Générer un nouveau secret
      const { secret } = this.totpService.generateSecret()
      const encryptedSecret = this.totpService.encryptSecret(secret)

      // Générer le QR code
      const qrCode = await this.totpService.generateQRCode(userEmail, secret)

      // Générer les codes de récupération
      const backupCodes = this.totpService.generateBackupCodes()
      const encryptedBackupCodes = this.totpService.encryptBackupCodes(backupCodes)

      // Créer ou mettre à jour l'enregistrement MFA
      let mfaRecord: UserMFA
      if (existingTOTP) {
        existingTOTP.secret = encryptedSecret
        existingTOTP.backupCodes = encryptedBackupCodes
        existingTOTP.phoneNumber = phoneNumber
        existingTOTP.isEnabled = false
        existingTOTP.isVerified = false
        mfaRecord = await this.userMFARepository.save(existingTOTP)
      } else {
        mfaRecord = UserMFA.createTOTP(userId, encryptedSecret, phoneNumber)
        mfaRecord.backupCodes = encryptedBackupCodes
        mfaRecord = await this.userMFARepository.save(mfaRecord)
      }

      // Stocker le QR code dans les métadonnées
      mfaRecord.metadata = {
        ...mfaRecord.metadata,
        qrCode,
      }
      await this.userMFARepository.save(mfaRecord)

      return {
        success: true,
        mfaId: mfaRecord.id,
        secret,
        qrCode,
        backupCodes,
      }
    } catch (error) {
      this.logger.error('Erreur lors de la configuration TOTP:', error)
      return {
        success: false,
        error: 'Impossible de configurer TOTP',
      }
    }
  }

  /**
   * Vérifier et activer TOTP
   */
  async verifyAndEnableTOTP(
    userId: string,
    mfaId: string,
    token: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const mfaRecord = await this.userMFARepository.findOne({
        where: { id: mfaId, userId, type: 'totp' },
      })

      if (!mfaRecord || !mfaRecord.secret) {
        return { success: false, error: 'Configuration TOTP non trouvée' }
      }

      if (mfaRecord.isVerified) {
        return { success: false, error: 'TOTP déjà vérifié' }
      }

      // Déchiffrer le secret et vérifier le token
      const secret = this.totpService.decryptSecret(mfaRecord.secret)
      const isValid = this.totpService.verifyToken(token, secret)

      if (!isValid) {
        mfaRecord.markFailedAttempt()
        await this.userMFARepository.save(mfaRecord)
        return { success: false, error: 'Code TOTP invalide' }
      }

      // Activer TOTP
      mfaRecord.verify()
      mfaRecord.enable()
      mfaRecord.markAsUsed()
      await this.userMFARepository.save(mfaRecord)

      return { success: true }
    } catch (error) {
      this.logger.error('Erreur lors de la vérification TOTP:', error)
      return { success: false, error: 'Erreur de vérification' }
    }
  }

  /**
   * Configurer WebAuthn pour un utilisateur
   */
  async setupWebAuthn(
    userId: string,
    userEmail: string,
    userName: string
  ): Promise<MFASetupResult> {
    try {
      // Obtenir les credentials existants
      let mfaRecord = await this.userMFARepository.findOne({
        where: { userId, type: 'webauthn' },
      })

      if (!mfaRecord) {
        mfaRecord = UserMFA.createWebAuthn(userId)
        mfaRecord = await this.userMFARepository.save(mfaRecord)
      }

      const existingCredentials = mfaRecord.getActiveWebAuthnCredentials() || []

      // Générer les options d'enregistrement
      const { options, challenge } = await this.webauthnService.generateRegistrationOptions(
        userId,
        userEmail,
        userName,
        existingCredentials
      )

      // Stocker le challenge temporairement
      mfaRecord.metadata = {
        ...mfaRecord.metadata,
        ...({
          pendingChallenge: challenge,
          pendingChallengeExpiry: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
        } as Record<string, unknown>),
      }
      await this.userMFARepository.save(mfaRecord)

      return {
        success: true,
        mfaId: mfaRecord.id,
        webauthnOptions: options,
      }
    } catch (error) {
      this.logger.error('Erreur lors de la configuration WebAuthn:', error)
      return {
        success: false,
        error: 'Impossible de configurer WebAuthn',
      }
    }
  }

  /**
   * Vérifier et ajouter une clé WebAuthn
   */
  async verifyAndAddWebAuthn(
    userId: string,
    mfaId: string,
    response: WebAuthnAuthenticationResponse,
    deviceName?: string,
    userAgent?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const mfaRecord = await this.userMFARepository.findOne({
        where: { id: mfaId, userId, type: 'webauthn' },
      })

      if (!mfaRecord) {
        return { success: false, error: 'Configuration WebAuthn non trouvée' }
      }

      const pendingChallenge = (mfaRecord.metadata as Record<string, unknown>)?.pendingChallenge
      const challengeExpiry = (mfaRecord.metadata as Record<string, unknown>)
        ?.pendingChallengeExpiry

      if (!pendingChallenge || !challengeExpiry) {
        return { success: false, error: 'Challenge WebAuthn manquant' }
      }

      if (new Date() > new Date(challengeExpiry as string)) {
        return { success: false, error: 'Challenge WebAuthn expiré' }
      }

      // Vérifier la réponse d'enregistrement
      const verification = await this.webauthnService.verifyRegistrationResponse(
        response,
        pendingChallenge as string
      )

      if (!verification.verified || !verification.registrationInfo) {
        return { success: false, error: verification.error || 'Vérification WebAuthn échouée' }
      }

      // Ajouter le credential
      const finalDeviceName = deviceName || this.webauthnService.extractDeviceName(userAgent || '')
      mfaRecord.addWebAuthnCredential({
        credentialId: verification.registrationInfo.credentialId,
        publicKey: verification.registrationInfo.publicKey,
        counter: verification.registrationInfo.counter,
        deviceName: finalDeviceName,
        userAgent: userAgent,
      })

      // Activer WebAuthn si c'est le premier credential
      if (!mfaRecord.isVerified) {
        mfaRecord.verify()
        mfaRecord.enable()
      }

      // Nettoyer le challenge temporaire
      if (mfaRecord.metadata) {
        delete (mfaRecord.metadata as Record<string, unknown>).pendingChallenge
        delete (mfaRecord.metadata as Record<string, unknown>).pendingChallengeExpiry
      }

      await this.userMFARepository.save(mfaRecord)

      return { success: true }
    } catch (error) {
      this.logger.error('Erreur lors de la vérification WebAuthn:', error)
      return { success: false, error: 'Erreur de vérification' }
    }
  }

  /**
   * Initier une session MFA
   */
  async initiateMFASession(
    userId: string,
    mfaType: 'totp' | 'webauthn' | 'sms',
    request?: { headers?: Record<string, string>; ip?: string; userAgent?: string }
  ): Promise<{
    success: boolean
    sessionToken?: string
    challenge?: Record<string, unknown>
    error?: string
  }> {
    try {
      const mfaRecord = await this.userMFARepository.findOne({
        where: { userId, type: mfaType, isEnabled: true, isVerified: true },
      })

      if (!mfaRecord) {
        return { success: false, error: `${mfaType.toUpperCase()} non configuré` }
      }

      if (mfaRecord.isRateLimited()) {
        return { success: false, error: 'Trop de tentatives, réessayez plus tard' }
      }

      const sessionToken = uuidv4()
      let ipAddress: string | undefined
      let userAgent: string | undefined

      if (request) {
        ipAddress =
          request.ip ||
          (request.headers
            ? this.geolocationService.extractRealIP({
                headers: request.headers,
                ip: request.ip,
              })
            : undefined)
        userAgent = request.userAgent || request.headers?.['user-agent']
      }

      let mfaSession: MFASession

      if (mfaType === 'webauthn') {
        // Générer les options d'authentification WebAuthn
        const credentials = mfaRecord.getActiveWebAuthnCredentials() || []
        const { options, challenge } =
          await this.webauthnService.generateAuthenticationOptions(credentials)

        const challengeId = this.webauthnService.generateChallengeId()
        mfaSession = MFASession.createWebAuthn(
          userId,
          sessionToken,
          challengeId,
          challenge,
          options,
          ipAddress,
          userAgent
        )

        await this.mfaSessionRepository.save(mfaSession)

        return {
          success: true,
          sessionToken,
          challenge: options,
        }
      } else {
        // Pour TOTP et SMS
        mfaSession = MFASession.create(userId, sessionToken, mfaType, 10, ipAddress, userAgent)
        await this.mfaSessionRepository.save(mfaSession)

        return {
          success: true,
          sessionToken,
        }
      }
    } catch (error) {
      this.logger.error("Erreur lors de l'initiation de la session MFA:", error)
      return { success: false, error: "Impossible d'initier la session MFA" }
    }
  }

  /**
   * Vérifier MFA
   */
  async verifyMFA(
    sessionToken: string,
    code?: string,
    webauthnResponse?: WebAuthnAuthenticationResponse
  ): Promise<MFAVerificationResult> {
    try {
      const mfaSession = await this.mfaSessionRepository.findOne({
        where: { sessionToken },
      })

      if (!mfaSession || !mfaSession.isValid()) {
        return { success: false, error: 'Session MFA invalide ou expirée' }
      }

      if (mfaSession.isRateLimited()) {
        return { success: false, error: 'Trop de tentatives' }
      }

      const mfaRecord = await this.userMFARepository.findOne({
        where: {
          userId: mfaSession.userId,
          type: mfaSession.mfaType,
          isEnabled: true,
          isVerified: true,
        },
      })

      if (!mfaRecord) {
        return { success: false, error: 'Configuration MFA non trouvée' }
      }

      let isValid = false
      let backupCodesUsed = 0

      if (mfaSession.mfaType === 'totp') {
        if (!code) {
          return { success: false, error: 'Code TOTP requis' }
        }

        // Vérifier le code TOTP ou un code de récupération
        if (this.totpService.isValidTokenFormat(code)) {
          if (!mfaRecord.secret) {
            return { success: false, error: 'Secret TOTP non trouvé' }
          }
          const secret = this.totpService.decryptSecret(mfaRecord.secret)
          isValid = this.totpService.verifyToken(code, secret)
        } else if (mfaRecord.backupCodes) {
          // Vérifier si c'est un code de récupération
          const backupResult = this.totpService.verifyBackupCode(code, mfaRecord.backupCodes)
          if (backupResult.isValid) {
            isValid = true
            backupCodesUsed = 1
            // Mettre à jour les codes de récupération
            if (backupResult.updatedEncryptedCodes) {
              mfaRecord.backupCodes = backupResult.updatedEncryptedCodes
              await this.userMFARepository.save(mfaRecord)
            }
          }
        }
      } else if (mfaSession.mfaType === 'sms') {
        if (!code) {
          return { success: false, error: 'Code SMS requis' }
        }

        // Vérifier le code SMS depuis la session
        const sessionMetadata = mfaSession.metadata as Record<string, unknown>
        const storedCode = sessionMetadata?.smsCode as string
        const codeExpiry = sessionMetadata?.smsCodeExpiry as string

        if (!storedCode || !codeExpiry) {
          return { success: false, error: 'Code SMS non trouvé ou expiré' }
        }

        if (new Date() > new Date(codeExpiry)) {
          return { success: false, error: 'Code SMS expiré' }
        }

        if (storedCode === code) {
          isValid = true
          // Nettoyer le code de la session
          if (mfaSession.metadata) {
            delete (mfaSession.metadata as Record<string, unknown>).smsCode
            delete (mfaSession.metadata as Record<string, unknown>).smsCodeExpiry
          }
        }
      } else if (mfaSession.mfaType === 'webauthn') {
        if (!webauthnResponse) {
          return { success: false, error: 'Réponse WebAuthn requise' }
        }

        // Trouver le credential correspondant
        const credentials = mfaRecord.getActiveWebAuthnCredentials() || []
        const credentialId = webauthnResponse.id
        const credential = credentials.find((c) => c.credentialId === credentialId)

        if (!credential) {
          return { success: false, error: 'Credential WebAuthn non trouvé' }
        }

        if (!mfaSession.challenge) {
          return { success: false, error: 'Challenge de session non trouvé' }
        }

        const verification = await this.webauthnService.verifyAuthenticationResponse(
          webauthnResponse,
          mfaSession.challenge,
          credential
        )

        if (verification.verified) {
          isValid = true
          // Mettre à jour le compteur
          if (verification.newCounter !== undefined) {
            mfaRecord.updateWebAuthnCounter(credentialId, verification.newCounter as number)
            await this.userMFARepository.save(mfaRecord)
          }
        }
      }

      if (isValid) {
        mfaSession.markAsVerified()
        mfaRecord.markAsUsed()
        mfaRecord.resetFailedAttempts()
        await Promise.all([
          this.mfaSessionRepository.save(mfaSession),
          this.userMFARepository.save(mfaRecord),
        ])

        return {
          success: true,
          sessionToken,
          backupCodesUsed,
        }
      } else {
        mfaSession.incrementAttempts()
        mfaRecord.markFailedAttempt()

        if (mfaSession.isRateLimited()) {
          mfaSession.markAsFailed()
        }

        await Promise.all([
          this.mfaSessionRepository.save(mfaSession),
          this.userMFARepository.save(mfaRecord),
        ])

        return { success: false, error: 'Code MFA invalide' }
      }
    } catch (error) {
      this.logger.error('Erreur lors de la vérification MFA:', error)
      return { success: false, error: 'Erreur de vérification MFA' }
    }
  }

  /**
   * Désactiver MFA pour un utilisateur
   */
  async disableMFA(
    userId: string,
    mfaType: 'totp' | 'webauthn' | 'sms',
    verificationCode?: string
  ): Promise<{
    success: boolean
    error?: string
  }> {
    try {
      const mfaRecord = await this.userMFARepository.findOne({
        where: { userId, type: mfaType },
      })

      if (!mfaRecord) {
        return { success: false, error: 'Configuration MFA non trouvée' }
      }

      // Vérifier le code pour la désactivation (sécurité)
      if (verificationCode && mfaRecord.isEnabled) {
        if (mfaType === 'totp' && mfaRecord.secret) {
          const secret = this.totpService.decryptSecret(mfaRecord.secret)
          const isValid = this.totpService.verifyToken(verificationCode, secret)

          if (!isValid) {
            return { success: false, error: 'Code de vérification invalide' }
          }
        } else if (mfaType === 'sms' && mfaRecord.phoneNumber) {
          // Pour SMS, envoyer un code de confirmation
          const confirmationCode = this.generateSMSVerificationCode()
          const smsResult = await this.smsService.sendMFAVerificationCode(
            mfaRecord.phoneNumber,
            confirmationCode,
            5
          )

          if (!smsResult.success) {
            return { success: false, error: "Impossible d'envoyer le code de confirmation" }
          }

          // Vérifier que le code fourni correspond
          if (confirmationCode !== verificationCode) {
            return { success: false, error: 'Code de vérification invalide' }
          }
        }
      }

      mfaRecord.disable()
      await this.userMFARepository.save(mfaRecord)

      return { success: true }
    } catch (error) {
      this.logger.error('Erreur lors de la désactivation MFA:', error)
      return { success: false, error: 'Impossible de désactiver MFA' }
    }
  }

  /**
   * Obtenir les statistiques MFA
   */
  async getMFAStats(userId: string): Promise<{
    hasActiveMFA: boolean
    methods: {
      totp: { enabled: boolean; verified: boolean; lastUsed?: Date }
      webauthn: { enabled: boolean; verified: boolean; credentialsCount: number; lastUsed?: Date }
      sms: { enabled: boolean; verified: boolean; lastUsed?: Date }
    }
    totalUsage: number
    securityLevel: 'none' | 'basic' | 'enhanced'
  }> {
    const mfaMethods = await this.getUserMFAMethods(userId)

    const stats = {
      hasActiveMFA: false,
      methods: {
        totp: { enabled: false, verified: false, lastUsed: undefined as Date | undefined },
        webauthn: {
          enabled: false,
          verified: false,
          credentialsCount: 0,
          lastUsed: undefined as Date | undefined,
        },
        sms: { enabled: false, verified: false, lastUsed: undefined as Date | undefined },
      },
      totalUsage: 0,
      securityLevel: 'none' as 'none' | 'basic' | 'enhanced',
    }

    for (const method of mfaMethods) {
      if (method.type === 'totp') {
        stats.methods.totp = {
          enabled: method.isEnabled,
          verified: method.isVerified,
          lastUsed: method.lastUsedAt,
        }
      } else if (method.type === 'webauthn') {
        stats.methods.webauthn = {
          enabled: method.isEnabled,
          verified: method.isVerified,
          credentialsCount: method.getActiveWebAuthnCredentials()?.length || 0,
          lastUsed: method.lastUsedAt,
        }
      } else if (method.type === 'sms') {
        stats.methods.sms = {
          enabled: method.isEnabled,
          verified: method.isVerified,
          lastUsed: method.lastUsedAt,
        }
      }

      if (method.hasEnabledMFA()) {
        stats.hasActiveMFA = true
      }

      stats.totalUsage += method.metadata?.usageCount || 0
    }

    // Déterminer le niveau de sécurité
    const activeMethods = Object.values(stats.methods).filter((m) => m.enabled && m.verified).length
    if (activeMethods === 0) {
      stats.securityLevel = 'none'
    } else if (activeMethods === 1) {
      stats.securityLevel = 'basic'
    } else {
      stats.securityLevel = 'enhanced'
    }

    return stats
  }

  /**
   * Nettoyer les sessions MFA expirées
   */
  async cleanupExpiredSessions(): Promise<number> {
    try {
      const result = await this.mfaSessionRepository
        .createQueryBuilder()
        .delete()
        .where('expiresAt < :now', { now: new Date() })
        .execute()

      this.logger.log(`Nettoyé ${result.affected} sessions MFA expirées`)
      return result.affected || 0
    } catch (error) {
      this.logger.error('Erreur lors du nettoyage des sessions MFA:', error)
      return 0
    }
  }

  // ===== ENHANCED MFA FLOW FOR AUTHENTICATION =====

  /**
   * Initier le processus MFA lors de l'authentification
   */
  async initiateMFAForLogin(
    userId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{
    requiresMFA: boolean
    canBypass: boolean
    sessionToken?: string
    availableMethods?: string[]
    trustDevice?: boolean
  }> {
    try {
      // Check if user can bypass MFA (SUPER_ADMIN in trusted environment)
      const canBypass = await this.canBypassMFA(userId, ipAddress, userAgent)

      if (canBypass) {
        this.logger.log(`User ${userId} bypassing MFA - trusted environment`)
        return {
          requiresMFA: false,
          canBypass: true,
          trustDevice: true,
        }
      }

      // Check if MFA is enabled/required
      const hasMFA = await this.hasMFAEnabled(userId)
      const isRequired = await this.isMFARequiredForUser(userId)

      if (!hasMFA && !isRequired) {
        return {
          requiresMFA: false,
          canBypass: false,
        }
      }

      // Get available MFA methods
      const methods = await this.getUserMFAMethods(userId)
      const activeMethods = methods.filter((m) => m.isEnabled && m.isVerified)

      if (activeMethods.length === 0 && isRequired) {
        // Force MFA setup for required users
        return {
          requiresMFA: true,
          canBypass: false,
          availableMethods: ['setup_required'],
        }
      }

      // Create MFA session
      const sessionToken = uuidv4()
      const mfaSession = MFASession.create(
        userId,
        sessionToken,
        activeMethods[0]?.type || 'totp',
        10, // 10 minutes
        ipAddress,
        userAgent
      )

      await this.mfaSessionRepository.save(mfaSession)

      return {
        requiresMFA: true,
        canBypass: false,
        sessionToken,
        availableMethods: activeMethods.map((m) => m.type),
        trustDevice: false,
      }
    } catch (error) {
      this.logger.error(`Error initiating MFA for user ${userId}:`, error)
      return {
        requiresMFA: false,
        canBypass: false,
      }
    }
  }

  /**
   * Vérifier MFA lors de l'authentification
   */
  async verifyMFAForLogin(
    sessionToken: string,
    code: string,
    mfaType: 'totp' | 'sms' | 'webauthn' = 'totp',
    trustDevice: boolean = false,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{
    success: boolean
    userId?: string
    error?: string
    deviceTrusted?: boolean
  }> {
    try {
      // Find MFA session
      const mfaSession = await this.mfaSessionRepository.findOne({
        where: { sessionToken, status: 'pending' },
      })

      if (!mfaSession || !mfaSession.isValid()) {
        return {
          success: false,
          error: 'Session MFA invalide ou expirée',
        }
      }

      // Rate limiting
      if (mfaSession.isRateLimited()) {
        return {
          success: false,
          error: 'Trop de tentatives. Réessayez plus tard.',
        }
      }

      // Get user MFA method
      const mfaMethod = await this.userMFARepository.findOne({
        where: {
          userId: mfaSession.userId,
          type: mfaType,
          isEnabled: true,
          isVerified: true,
        },
      })

      if (!mfaMethod) {
        return {
          success: false,
          error: 'Méthode MFA non trouvée',
        }
      }

      // Verify based on type
      let isValid = false

      if (mfaType === 'totp' && mfaMethod.secret) {
        isValid = await this.totpService.verifyToken(code, mfaMethod.secret)
      } else if (mfaType === 'sms') {
        // Pour SMS, d'abord envoyer le code si pas déjà fait
        if (!mfaSession.metadata?.smsCode) {
          const smsResult = await this.sendSMSCode(mfaSession.userId, sessionToken)
          if (!smsResult.success) {
            return {
              success: false,
              error: smsResult.error || "Impossible d'envoyer le code SMS",
            }
          }

          return {
            success: false,
            error: 'Code SMS envoyé. Veuillez saisir le code reçu.',
          }
        }

        // Vérifier le code SMS
        const sessionMetadata = mfaSession.metadata as Record<string, unknown>
        const storedCode = sessionMetadata?.smsCode as string
        const codeExpiry = sessionMetadata?.smsCodeExpiry as string

        if (!storedCode || !codeExpiry) {
          return {
            success: false,
            error: 'Code SMS non trouvé',
          }
        }

        if (new Date() > new Date(codeExpiry)) {
          return {
            success: false,
            error: 'Code SMS expiré',
          }
        }

        isValid = storedCode === code

        if (isValid) {
          // Nettoyer le code de la session
          delete (mfaSession.metadata as Record<string, unknown>).smsCode
          delete (mfaSession.metadata as Record<string, unknown>).smsCodeExpiry
        }
      }

      if (!isValid) {
        mfaSession.incrementAttempts()
        mfaMethod.markFailedAttempt()

        await this.mfaSessionRepository.save(mfaSession)
        await this.userMFARepository.save(mfaMethod)

        return {
          success: false,
          error: 'Code MFA invalide',
        }
      }

      // Success - mark as verified
      mfaSession.markAsVerified()
      mfaMethod.markAsUsed()
      mfaMethod.resetFailedAttempts()

      await this.mfaSessionRepository.save(mfaSession)
      await this.userMFARepository.save(mfaMethod)

      // Trust device if requested
      let deviceTrusted = false
      if (trustDevice && ipAddress && userAgent) {
        await this.markDeviceAsTrusted(mfaSession.userId, ipAddress, userAgent)
        deviceTrusted = true
      }

      // Invalidate MFA cache
      await this.invalidateMFACache(mfaSession.userId)

      return {
        success: true,
        userId: mfaSession.userId,
        deviceTrusted,
      }
    } catch (error) {
      this.logger.error(`Error verifying MFA:`, error)
      return {
        success: false,
        error: 'Erreur lors de la vérification MFA',
      }
    }
  }

  /**
   * Vérifier si MFA est requis pour un utilisateur spécifique
   */
  async isMFARequiredForUser(userId: string): Promise<boolean> {
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId },
        select: ['id', 'role'],
      })

      if (!user) {
        return false
      }

      return await this.isMFARequiredForRole(user.role as GlobalUserRole)
    } catch (error) {
      this.logger.error(`Error checking MFA requirement for user ${userId}:`, error)
      return false
    }
  }

  /**
   * Invalider le cache MFA pour un utilisateur
   */
  async invalidateMFACache(userId: string): Promise<void> {
    await this.cacheService.invalidateGroup(`user:${userId}`)
    await this.cacheService.invalidatePattern(`mfa_*:${userId}`)
  }

  /**
   * Obtenir l'état complet MFA pour l'administration
   */
  async getAdminMFAStatus(): Promise<{
    totalUsers: number
    usersWithMFA: number
    usersByRole: Record<string, { total: number; withMFA: number }>
    mfaMethodDistribution: Record<string, number>
  }> {
    try {
      // Get all users with their roles
      const users = await this.userRepository.find({
        select: ['id', 'role'],
      })

      // Get all MFA records
      const mfaRecords = await this.userMFARepository.find({
        where: { isEnabled: true, isVerified: true },
      })

      const usersWithMFA = new Set(mfaRecords.map((m) => m.userId))

      // Group by role
      const usersByRole: Record<string, { total: number; withMFA: number }> = {}
      for (const user of users) {
        const role = user.role || 'unknown'
        if (!usersByRole[role]) {
          usersByRole[role] = { total: 0, withMFA: 0 }
        }
        usersByRole[role].total++
        if (usersWithMFA.has(user.id)) {
          usersByRole[role].withMFA++
        }
      }

      // Method distribution
      const mfaMethodDistribution: Record<string, number> = {}
      for (const record of mfaRecords) {
        mfaMethodDistribution[record.type] = (mfaMethodDistribution[record.type] || 0) + 1
      }

      return {
        totalUsers: users.length,
        usersWithMFA: usersWithMFA.size,
        usersByRole,
        mfaMethodDistribution,
      }
    } catch (error) {
      this.logger.error('Error getting admin MFA status:', error)
      return {
        totalUsers: 0,
        usersWithMFA: 0,
        usersByRole: {},
        mfaMethodDistribution: {},
      }
    }
  }
}
