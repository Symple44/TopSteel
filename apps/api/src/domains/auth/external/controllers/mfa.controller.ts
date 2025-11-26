import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common'
import type { Request as ExpressRequest } from 'express'
import { JwtAuthGuard } from '../../security/guards/jwt-auth.guard'
import { MFAService } from '../../services/mfa.service'

interface SetupTOTPDto {
  phoneNumber?: string
}

interface VerifyTOTPDto {
  mfaId: string
  token: string
}

interface SetupSMSDto {
  phoneNumber: string
}

interface VerifySMSDto {
  mfaId: string
  verificationCode: string
}

interface SetupWebAuthnDto {
  deviceName: string
}

interface VerifyWebAuthnDto {
  mfaId: string
  response: unknown
}

interface DisableMFADto {
  mfaType: string
}

/**
 * Contrôleur MFA - Version simplifiée
 * Les endpoints avancés sont commentés, seules les fonctions de base sont disponibles
 */
@Controller('auth/mfa')
@UseGuards(JwtAuthGuard)
export class MFAController {
  constructor(private readonly mfaService: MFAService) {}

  @Get('status')
  async getMFAStatus(@Request() req: ExpressRequest) {
    const userId = (req.user as any)?.userId

    if (!userId) {
      return {
        success: false,
        error: 'User not authenticated',
      }
    }

    try {
      const hasMFA = await this.mfaService.hasMFAEnabled(userId)
      const methods = await this.mfaService.getUserMFAMethods(userId)
      const stats = await this.mfaService.getMFAStats(userId)

      return {
        success: true,
        data: {
          enabled: hasMFA,
          methods,
          stats,
        },
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  @Get('methods')
  async getMFAMethods(@Request() req: ExpressRequest) {
    const userId = (req.user as any)?.userId

    if (!userId) {
      return {
        success: false,
        error: 'User not authenticated',
      }
    }

    try {
      const methods = await this.mfaService.getUserMFAMethods(userId)

      return {
        success: true,
        data: methods,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  // ===== TOTP =====

  @Post('totp/setup')
  async setupTOTP(@Request() req: ExpressRequest, @Body() body: SetupTOTPDto) {
    const userId = (req.user as any)?.userId
    const userEmail = (req.user as any)?.email

    if (!userId || !userEmail) {
      return {
        success: false,
        error: 'User not authenticated',
      }
    }

    try {
      const result = await this.mfaService.setupTOTP(userId, userEmail, body.phoneNumber)
      return {
        success: true,
        data: result,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  @Post('totp/verify')
  async verifyTOTP(@Request() req: ExpressRequest, @Body() body: VerifyTOTPDto) {
    const userId = (req.user as any)?.userId

    if (!userId) {
      return {
        success: false,
        error: 'User not authenticated',
      }
    }

    try {
      const result = await this.mfaService.verifyAndEnableTOTP(userId, body.mfaId, body.token)
      return {
        success: true,
        data: result,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  // ===== SMS =====

  @Post('sms/setup')
  async setupSMS(@Request() req: ExpressRequest, @Body() body: SetupSMSDto) {
    const userId = (req.user as any)?.userId

    if (!userId) {
      return {
        success: false,
        error: 'User not authenticated',
      }
    }

    try {
      const result = await this.mfaService.setupSMS(userId, body.phoneNumber)
      return {
        success: true,
        data: result,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  @Post('sms/verify')
  async verifySMS(@Request() req: ExpressRequest, @Body() body: VerifySMSDto) {
    const userId = (req.user as any)?.userId

    if (!userId) {
      return {
        success: false,
        error: 'User not authenticated',
      }
    }

    try {
      const result = await this.mfaService.verifyAndEnableSMS(
        userId,
        body.mfaId,
        body.verificationCode
      )
      return {
        success: true,
        data: result,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  // ===== WebAuthn =====

  @Post('webauthn/setup')
  async setupWebAuthn(@Request() req: ExpressRequest, @Body() body: SetupWebAuthnDto) {
    const userId = (req.user as any)?.userId

    if (!userId) {
      return {
        success: false,
        error: 'User not authenticated',
      }
    }

    try {
      const result = await this.mfaService.setupWebAuthn(userId, body.deviceName)
      return {
        success: true,
        data: result,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  @Post('webauthn/verify')
  async verifyWebAuthn(@Request() req: ExpressRequest, @Body() body: VerifyWebAuthnDto) {
    const userId = (req.user as any)?.userId

    if (!userId) {
      return {
        success: false,
        error: 'User not authenticated',
      }
    }

    try {
      const result = await this.mfaService.verifyAndEnableWebAuthn(
        userId,
        body.mfaId,
        body.response
      )
      return {
        success: true,
        data: result,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  // ===== Disable MFA =====

  @Delete(':type')
  async disableMFAType(@Request() req: ExpressRequest, @Param('type') type: string) {
    const userId = (req.user as any)?.userId

    if (!userId) {
      return {
        success: false,
        error: 'User not authenticated',
      }
    }

    try {
      await this.mfaService.disableMFA(userId, type)
      return {
        success: true,
        message: `MFA ${type} disabled successfully`,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }
}
