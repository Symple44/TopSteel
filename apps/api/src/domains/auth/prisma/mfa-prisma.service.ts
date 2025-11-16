import { Injectable, Logger, BadRequestException, UnauthorizedException } from '@nestjs/common'
import { PrismaService } from '../../../core/database/prisma/prisma.service'
import { authenticator } from 'otplib'
import { toDataURL } from 'qrcode'
import type { UserMfa } from '@prisma/client'

/**
 * MfaPrismaService - POC Phase 1.5
 *
 * Service MFA (Multi-Factor Authentication) utilisant Prisma
 *
 * Fonctionnalités:
 * - TOTP (Time-based One-Time Password) support
 * - QR code generation pour apps authenticator
 * - Backup codes génération
 * - Failed attempts tracking
 * - Verify/Enable TOTP
 */
@Injectable()
export class MfaPrismaService {
  private readonly logger = new Logger(MfaPrismaService.name)
  private readonly MAX_FAILED_ATTEMPTS = 5

  constructor(private readonly prisma: PrismaService) {
    // Configuration otplib
    authenticator.options = {
      window: 1, // Accepte 30s avant/après
      digits: 6,
      step: 30,
    }
  }

  /**
   * Vérifier si un utilisateur a MFA activé
   */
  async hasMFAEnabled(userId: string): Promise<boolean> {
    this.logger.debug(`Checking if user ${userId} has MFA enabled`)

    try {
      const mfa = await this.prisma.userMfa.findFirst({
        where: {
          userId,
          type: 'TOTP',
          isEnabled: true,
          isVerified: true,
        },
      })

      return mfa !== null
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error checking MFA enabled: ${err.message}`, err.stack)
      return false
    }
  }

  /**
   * Récupérer la configuration MFA d'un utilisateur
   */
  async getUserMFA(userId: string): Promise<UserMfa | null> {
    this.logger.debug(`Getting MFA configuration for user: ${userId}`)

    try {
      return await this.prisma.userMfa.findFirst({
        where: {
          userId,
          type: 'TOTP',
        },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting user MFA: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Activer TOTP pour un utilisateur
   * @returns Secret + QR code URL pour scanner avec app authenticator
   */
  async enableTOTP(
    userId: string,
    phoneNumber?: string
  ): Promise<{
    secret: string
    qrCodeUrl: string
    backupCodes: string[]
  }> {
    this.logger.log(`Enabling TOTP for user: ${userId}`)

    try {
      // Vérifier si MFA existe déjà
      const existingMfa = await this.getUserMFA(userId)

      if (existingMfa && existingMfa.isVerified) {
        throw new BadRequestException('MFA already enabled and verified')
      }

      // Récupérer l'utilisateur pour le nom
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      })

      if (!user) {
        throw new BadRequestException('User not found')
      }

      // Générer un secret TOTP
      const secret = authenticator.generateSecret()

      // Créer l'OTP auth URL pour QR code
      const service = 'TopSteel'
      const otpauthUrl = authenticator.keyuri(
        user.email,
        service,
        secret
      )

      // Générer le QR code
      const qrCodeUrl = await toDataURL(otpauthUrl)

      // Générer backup codes (8 codes de 8 caractères)
      const backupCodes = this.generateBackupCodes(8)
      const backupCodesString = backupCodes.join(',')

      // Créer ou mettre à jour l'entrée MFA
      if (existingMfa) {
        await this.prisma.userMfa.update({
          where: { id: existingMfa.id },
          data: {
            secret,
            backupCodes: backupCodesString,
            phoneNumber: phoneNumber || null,
            isEnabled: false, // Sera activé après vérification
            isVerified: false,
          },
        })
      } else {
        await this.prisma.userMfa.create({
          data: {
            userId,
            type: 'TOTP',
            secret,
            backupCodes: backupCodesString,
            phoneNumber: phoneNumber || null,
            isEnabled: false,
            isVerified: false,
          },
        })
      }

      this.logger.log(`TOTP enabled for user: ${userId}`)

      return {
        secret,
        qrCodeUrl,
        backupCodes,
      }
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error enabling TOTP: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Vérifier un code TOTP et activer MFA si valide
   */
  async verifyTOTP(userId: string, code: string): Promise<boolean> {
    this.logger.log(`Verifying TOTP for user: ${userId}`)

    try {
      const mfa = await this.getUserMFA(userId)

      if (!mfa) {
        throw new BadRequestException('MFA not configured for this user')
      }

      if (!mfa.secret) {
        throw new BadRequestException('MFA secret not found')
      }

      // Vérifier le code TOTP
      const isValid = authenticator.verify({
        token: code,
        secret: mfa.secret,
      })

      if (isValid) {
        // Activer et marquer comme vérifié
        await this.prisma.userMfa.update({
          where: { id: mfa.id },
          data: {
            isEnabled: true,
            isVerified: true,
            verifiedAt: new Date(),
            lastUsedAt: new Date(),
          },
        })

        this.logger.log(`TOTP verified and enabled for user: ${userId}`)
        return true
      } else {
        this.logger.warn(`Invalid TOTP code for user: ${userId}`)
        return false
      }
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error verifying TOTP: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Valider un code TOTP pour login (après activation)
   * Inclut le tracking des tentatives échouées
   */
  async validateTOTP(userId: string, code: string): Promise<boolean> {
    this.logger.log(`Validating TOTP for login: ${userId}`)

    try {
      const mfa = await this.getUserMFA(userId)

      if (!mfa) {
        throw new UnauthorizedException('MFA not configured')
      }

      if (!mfa.isEnabled || !mfa.isVerified) {
        throw new UnauthorizedException('MFA not enabled or verified')
      }

      if (!mfa.secret) {
        throw new UnauthorizedException('MFA secret not found')
      }

      // Vérifier le code TOTP
      const isValid = authenticator.verify({
        token: code,
        secret: mfa.secret,
      })

      if (isValid) {
        // Mise à jour lastUsedAt et reset failed attempts si besoin
        await this.prisma.userMfa.update({
          where: { id: mfa.id },
          data: {
            lastUsedAt: new Date(),
            // Reset metadata failed attempts
            metadata: {
              ...(typeof mfa.metadata === 'object' ? mfa.metadata : {}),
              failedAttempts: 0,
              lastFailedAttempt: null,
            },
          },
        })

        this.logger.log(`TOTP validated successfully for user: ${userId}`)
        return true
      } else {
        // Incrémenter failed attempts
        const metadata = typeof mfa.metadata === 'object' ? (mfa.metadata as any) : {}
        const failedAttempts = (metadata.failedAttempts || 0) + 1

        await this.prisma.userMfa.update({
          where: { id: mfa.id },
          data: {
            metadata: {
              ...metadata,
              failedAttempts,
              lastFailedAttempt: new Date().toISOString(),
            },
          },
        })

        // Bloquer si trop de tentatives
        if (failedAttempts >= this.MAX_FAILED_ATTEMPTS) {
          await this.prisma.userMfa.update({
            where: { id: mfa.id },
            data: {
              isEnabled: false,
              metadata: {
                ...metadata,
                failedAttempts,
                blockedAt: new Date().toISOString(),
                reason: 'Too many failed attempts',
              },
            },
          })

          this.logger.error(
            `MFA blocked for user ${userId} due to ${failedAttempts} failed attempts`
          )
          throw new UnauthorizedException(
            'MFA blocked due to too many failed attempts. Please contact support.'
          )
        }

        this.logger.warn(`Invalid TOTP code for user: ${userId} (attempt ${failedAttempts})`)
        return false
      }
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error validating TOTP: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Désactiver MFA pour un utilisateur
   */
  async disableMFA(userId: string): Promise<void> {
    this.logger.log(`Disabling MFA for user: ${userId}`)

    try {
      const mfa = await this.getUserMFA(userId)

      if (!mfa) {
        throw new BadRequestException('MFA not configured for this user')
      }

      await this.prisma.userMfa.update({
        where: { id: mfa.id },
        data: {
          isEnabled: false,
          isVerified: false,
        },
      })

      this.logger.log(`MFA disabled for user: ${userId}`)
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error disabling MFA: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Régénérer les backup codes
   */
  async regenerateBackupCodes(userId: string): Promise<string[]> {
    this.logger.log(`Regenerating backup codes for user: ${userId}`)

    try {
      const mfa = await this.getUserMFA(userId)

      if (!mfa) {
        throw new BadRequestException('MFA not configured for this user')
      }

      const backupCodes = this.generateBackupCodes(8)
      const backupCodesString = backupCodes.join(',')

      await this.prisma.userMfa.update({
        where: { id: mfa.id },
        data: {
          backupCodes: backupCodesString,
        },
      })

      this.logger.log(`Backup codes regenerated for user: ${userId}`)
      return backupCodes
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error regenerating backup codes: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Utiliser un backup code
   */
  async useBackupCode(userId: string, code: string): Promise<boolean> {
    this.logger.log(`Using backup code for user: ${userId}`)

    try {
      const mfa = await this.getUserMFA(userId)

      if (!mfa || !mfa.backupCodes) {
        throw new UnauthorizedException('MFA not configured or no backup codes')
      }

      const backupCodes = mfa.backupCodes.split(',')

      if (backupCodes.includes(code)) {
        // Retirer le code utilisé
        const remainingCodes = backupCodes.filter((c) => c !== code)

        await this.prisma.userMfa.update({
          where: { id: mfa.id },
          data: {
            backupCodes: remainingCodes.join(','),
            lastUsedAt: new Date(),
          },
        })

        this.logger.log(`Backup code used successfully for user: ${userId}`)
        return true
      } else {
        this.logger.warn(`Invalid backup code for user: ${userId}`)
        return false
      }
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error using backup code: ${err.message}`, err.stack)
      throw error
    }
  }

  // ============================================
  // PRIVATE HELPERS
  // ============================================

  /**
   * Générer des backup codes aléatoires
   */
  private generateBackupCodes(count: number): string[] {
    const codes: string[] = []
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

    for (let i = 0; i < count; i++) {
      let code = ''
      for (let j = 0; j < 8; j++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length))
      }
      codes.push(code)
    }

    return codes
  }
}
