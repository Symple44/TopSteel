import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { v4 as uuidv4 } from 'uuid'
import { MFASession } from '../core/entities/mfa-session.entity'
import { UserMFA } from '../core/entities/user-mfa.entity'
import { GeolocationService } from './geolocation.service'
import { TOTPService } from './totp.service'
import { WebAuthnService } from './webauthn.service'

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
  private readonly logger = new Logger(MFAService.name);

  constructor(
    @InjectRepository(UserMFA, 'auth')
    public readonly userMFARepository: Repository<UserMFA>,
    @InjectRepository(MFASession, 'auth')
    public readonly mfaSessionRepository: Repository<MFASession>,
    public readonly totpService: TOTPService,
    private readonly webauthnService: WebAuthnService,
    private readonly geolocationService: GeolocationService,
    private readonly configService: ConfigService
  ) {}

  /**
   * Vérifier si un utilisateur a MFA activé
   */
  async hasMFAEnabled(_userId: string): Promise<boolean> {
    // Temporairement désactivé à cause de problèmes de schema DB
    return false

    /* const mfaRecords = await this.userMFARepository.find({
      where: { userId, isEnabled: true, isVerified: true }
    })
    return mfaRecords.length > 0 */
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
    response: Record<string, unknown>,
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
    request?: any
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
        ipAddress = this.geolocationService.extractRealIP(request)
        userAgent = request.headers['user-agent']
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
    webauthnResponse?: Record<string, unknown>
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
          const secret = this.totpService.decryptSecret(mfaRecord.secret!)
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
      } else if (mfaSession.mfaType === 'webauthn') {
        if (!webauthnResponse) {
          return { success: false, error: 'Réponse WebAuthn requise' }
        }

        // Trouver le credential correspondant
        const credentials = mfaRecord.getActiveWebAuthnCredentials() || []
        const credentialId = webauthnResponse.id as string
        const credential = credentials.find((c) => c.credentialId === credentialId)

        if (!credential) {
          return { success: false, error: 'Credential WebAuthn non trouvé' }
        }

        const verification = await this.webauthnService.verifyAuthenticationResponse(
          webauthnResponse,
          mfaSession.challenge!,
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
    mfaType: 'totp' | 'webauthn',
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
}
