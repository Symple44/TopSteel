import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common'
import { JwtAuthGuard } from '../../security/guards/jwt-auth.guard'
import type { MFAService } from '../../services/mfa.service'

interface SetupTOTPDto {
  phoneNumber?: string
}

interface VerifyTOTPDto {
  mfaId: string
  token: string
}

interface SetupWebAuthnDto {
  userName: string
}

interface VerifyWebAuthnDto {
  mfaId: string
  response: unknown
  deviceName?: string
}

interface InitiateMFADto {
  mfaType: 'totp' | 'webauthn' | 'sms'
}

interface VerifyMFADto {
  sessionToken: string
  code?: string
  webauthnResponse?: unknown
}

interface DisableMFADto {
  mfaType: 'totp' | 'webauthn'
  verificationCode?: string
}

@Controller('auth/mfa')
@UseGuards(JwtAuthGuard)
export class MFAController {
  constructor(private readonly mfaService: MFAService) {}

  /**
   * Obtenir le statut MFA de l'utilisateur connecté
   */
  @Get('status')
  async getMFAStatus(@Request() req: { user: { sub: string } }) {
    try {
      const userId = req.user.sub
      const stats = await this.mfaService.getMFAStats(userId)

      return {
        success: true,
        data: stats,
      }
    } catch {
      throw new HttpException(
        'Erreur lors de la récupération du statut MFA',
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }
  }

  /**
   * Obtenir les méthodes MFA configurées
   */
  @Get('methods')
  async getMFAMethods(@Request() req: { user: { sub: string } }) {
    try {
      const userId = req.user.sub
      const methods = await this.mfaService.getUserMFAMethods(userId)

      // Masquer les données sensibles
      const safeMethods = methods.map((method) => ({
        id: method.id,
        type: method.type,
        isEnabled: method.isEnabled,
        isVerified: method.isVerified,
        lastUsedAt: method.lastUsedAt,
        createdAt: method.createdAt,
        deviceInfo:
          method.type === 'webauthn'
            ? {
                credentialsCount: method.getActiveWebAuthnCredentials()?.length || 0,
                credentials:
                  method.getActiveWebAuthnCredentials()?.map((cred) => ({
                    id: `${cred.credentialId.substring(0, 8)}...`,
                    deviceName: cred.deviceName,
                    createdAt: cred.createdAt,
                  })) || [],
              }
            : undefined,
        metadata: {
          usageCount: method.metadata?.usageCount || 0,
          lastUsed: method.metadata?.lastUsed,
        },
      }))

      return {
        success: true,
        data: safeMethods,
      }
    } catch {
      throw new HttpException(
        'Erreur lors de la récupération des méthodes MFA',
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }
  }

  /**
   * Configurer TOTP (Google Authenticator)
   */
  @Post('setup/totp')
  async setupTOTP(@Request() req: { user: { sub: string } }, @Body() body: SetupTOTPDto) {
    try {
      const userId = req.user.sub
      const userEmail = (req.user as { id?: string; sub?: string; email?: string }).email

      const result = await this.mfaService.setupTOTP(userId, userEmail, body.phoneNumber)

      if (!result.success) {
        throw new HttpException(result.error || 'Verification failed', HttpStatus.BAD_REQUEST)
      }

      return {
        success: true,
        data: {
          mfaId: result.mfaId,
          secret: result.secret,
          qrCode: result.qrCode,
          backupCodes: result.backupCodes,
          manualEntryKey: result.secret?.match(/.{1,4}/g)?.join(' '),
        },
      }
    } catch (error) {
      if (error instanceof HttpException) {
        throw error
      }
      throw new HttpException(
        'Erreur lors de la configuration TOTP',
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }
  }

  /**
   * Vérifier et activer TOTP
   */
  @Post('verify/totp')
  async verifyTOTP(@Request() req: { user: { sub: string } }, @Body() body: VerifyTOTPDto) {
    try {
      const userId = req.user.sub

      const result = await this.mfaService.verifyAndEnableTOTP(userId, body.mfaId, body.token)

      if (!result.success) {
        throw new HttpException(result.error || 'Verification failed', HttpStatus.BAD_REQUEST)
      }

      return {
        success: true,
        message: 'TOTP activé avec succès',
      }
    } catch (error) {
      if (error instanceof HttpException) {
        throw error
      }
      throw new HttpException(
        'Erreur lors de la vérification TOTP',
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }
  }

  /**
   * Configurer WebAuthn
   */
  @Post('setup/webauthn')
  async setupWebAuthn(
    @Request() req: { user: { sub: string; email: string } },
    @Body() body: SetupWebAuthnDto
  ) {
    try {
      const userId = req.user.sub
      const userEmail = (req.user as { id?: string; sub?: string; email?: string }).email

      const result = await this.mfaService.setupWebAuthn(userId, userEmail, body.userName)

      if (!result.success) {
        throw new HttpException(result.error || 'Verification failed', HttpStatus.BAD_REQUEST)
      }

      return {
        success: true,
        data: {
          mfaId: result.mfaId,
          options: result.webauthnOptions,
        },
      }
    } catch (error) {
      if (error instanceof HttpException) {
        throw error
      }
      throw new HttpException(
        'Erreur lors de la configuration WebAuthn',
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }
  }

  /**
   * Vérifier et ajouter une clé WebAuthn
   */
  @Post('verify/webauthn')
  async verifyWebAuthn(@Request() req: { user: { sub: string } }, @Body() body: VerifyWebAuthnDto) {
    try {
      const userId = req.user.sub
      const userAgent = (req as any).headers['user-agent']

      const result = await this.mfaService.verifyAndAddWebAuthn(
        userId,
        body.mfaId,
        body.response as any,
        body.deviceName,
        userAgent
      )

      if (!result.success) {
        throw new HttpException(result.error || 'Verification failed', HttpStatus.BAD_REQUEST)
      }

      return {
        success: true,
        message: 'Clé WebAuthn ajoutée avec succès',
      }
    } catch (error) {
      if (error instanceof HttpException) {
        throw error
      }
      throw new HttpException(
        'Erreur lors de la vérification WebAuthn',
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }
  }

  /**
   * Initier une session MFA (pour l'authentification)
   */
  @Post('initiate')
  async initiateMFA(@Request() req: { user: { sub: string } }, @Body() body: InitiateMFADto) {
    try {
      const userId = req.user.sub

      const result = await this.mfaService.initiateMFASession(userId, body.mfaType, req)

      if (!result.success) {
        throw new HttpException(result.error || 'Verification failed', HttpStatus.BAD_REQUEST)
      }

      return {
        success: true,
        data: {
          sessionToken: result.sessionToken,
          challenge: result.challenge, // Pour WebAuthn
        },
      }
    } catch (error) {
      if (error instanceof HttpException) {
        throw error
      }
      throw new HttpException("Erreur lors de l'initiation MFA", HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }

  /**
   * Vérifier MFA pendant l'authentification
   */
  @Post('verify')
  async verifyMFA(@Body() body: VerifyMFADto) {
    try {
      const result = await this.mfaService.verifyMFA(
        body.sessionToken,
        body.code,
        body.webauthnResponse as any
      )

      if (!result.success) {
        throw new HttpException(result.error || 'Verification failed', HttpStatus.BAD_REQUEST)
      }

      return {
        success: true,
        data: {
          sessionToken: result.sessionToken,
          backupCodesUsed: result.backupCodesUsed,
        },
        message: 'MFA vérifiée avec succès',
      }
    } catch (error) {
      if (error instanceof HttpException) {
        throw error
      }
      throw new HttpException(
        'Erreur lors de la vérification MFA',
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }
  }

  /**
   * Désactiver une méthode MFA
   */
  @Delete('disable')
  async disableMFA(@Request() req: { user: { sub: string } }, @Body() body: DisableMFADto) {
    try {
      const userId = req.user.sub

      const result = await this.mfaService.disableMFA(userId, body.mfaType, body.verificationCode)

      if (!result.success) {
        throw new HttpException(result.error || 'Verification failed', HttpStatus.BAD_REQUEST)
      }

      return {
        success: true,
        message: `${body.mfaType.toUpperCase()} désactivé avec succès`,
      }
    } catch (error) {
      if (error instanceof HttpException) {
        throw error
      }
      throw new HttpException(
        'Erreur lors de la désactivation MFA',
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }
  }

  /**
   * Supprimer un credential WebAuthn spécifique
   */
  @Delete('webauthn/credential/:credentialId')
  async removeWebAuthnCredential(
    @Request() req: { user: { sub: string } },
    @Param('credentialId') credentialId: string
  ) {
    try {
      const userId = req.user.sub

      // Obtenir la configuration WebAuthn de l'utilisateur
      const methods = await this.mfaService.getUserMFAMethods(userId)
      const webauthnMethod = methods.find((m) => m.type === 'webauthn')

      if (!webauthnMethod) {
        throw new HttpException('WebAuthn non configuré', HttpStatus.NOT_FOUND)
      }

      const removed = webauthnMethod.removeWebAuthnCredential(credentialId)

      if (!removed) {
        throw new HttpException('Credential non trouvé', HttpStatus.NOT_FOUND)
      }

      // Sauvegarder les modifications
      await this.mfaService.userMFARepository.save(webauthnMethod)

      return {
        success: true,
        message: 'Credential WebAuthn supprimé avec succès',
      }
    } catch (error) {
      if (error instanceof HttpException) {
        throw error
      }
      throw new HttpException(
        'Erreur lors de la suppression du credential',
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }
  }

  /**
   * Obtenir les codes de récupération TOTP
   */
  @Get('totp/backup-codes')
  async getBackupCodes(@Request() req: { user: { sub: string } }) {
    try {
      const userId = req.user.sub

      const methods = await this.mfaService.getUserMFAMethods(userId)
      const totpMethod = methods.find((m) => m.type === 'totp' && m.isVerified)

      if (!totpMethod || !totpMethod.backupCodes) {
        throw new HttpException('Codes de récupération non trouvés', HttpStatus.NOT_FOUND)
      }

      const backupCodes = this.mfaService.totpService.decryptBackupCodes(totpMethod.backupCodes)

      return {
        success: true,
        data: {
          codes: backupCodes,
          warning: "Conservez ces codes en lieu sûr. Ils ne s'afficheront qu'une seule fois.",
        },
      }
    } catch (error) {
      if (error instanceof HttpException) {
        throw error
      }
      throw new HttpException(
        'Erreur lors de la récupération des codes',
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }
  }

  /**
   * Regénérer les codes de récupération TOTP
   */
  @Post('totp/regenerate-backup-codes')
  async regenerateBackupCodes(@Request() req: { user: { sub: string } }) {
    try {
      const userId = req.user.sub

      const methods = await this.mfaService.getUserMFAMethods(userId)
      const totpMethod = methods.find((m) => m.type === 'totp' && m.isVerified)

      if (!totpMethod) {
        throw new HttpException('TOTP non configuré', HttpStatus.NOT_FOUND)
      }

      // Générer de nouveaux codes
      const newBackupCodes = this.mfaService.totpService.generateBackupCodes()
      const encryptedCodes = this.mfaService.totpService.encryptBackupCodes(newBackupCodes)

      totpMethod.backupCodes = encryptedCodes
      await this.mfaService.userMFARepository.save(totpMethod)

      return {
        success: true,
        data: {
          codes: newBackupCodes,
        },
        message: 'Nouveaux codes de récupération générés',
      }
    } catch (error) {
      if (error instanceof HttpException) {
        throw error
      }
      throw new HttpException(
        'Erreur lors de la régénération des codes',
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }
  }

  /**
   * Nettoyer les sessions MFA expirées (endpoint admin)
   */
  @Post('cleanup')
  async cleanupExpiredSessions() {
    try {
      const cleanedCount = await this.mfaService.cleanupExpiredSessions()

      return {
        success: true,
        data: {
          cleanedSessions: cleanedCount,
        },
        message: `${cleanedCount} sessions MFA expirées nettoyées`,
      }
    } catch {
      throw new HttpException(
        'Erreur lors du nettoyage des sessions',
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }
  }
}
