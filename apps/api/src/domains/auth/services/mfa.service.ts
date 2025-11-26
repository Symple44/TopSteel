/**
 * MFA Service - STUB for TypeScript compilation
 *
 * This is a minimal stub that allows TypeScript to compile.
 * The actual implementation is in MfaPrismaService, which is aliased
 * to this service in auth.module.ts.
 *
 * Original implementation moved to: mfa.service.ts.disabled
 */
import { Injectable } from '@nestjs/common'

@Injectable()
export class MFAService {
  // This class is just a stub for dependency injection aliasing
  // The real implementation is MfaPrismaService

  // Stub method signatures (never called due to aliasing)
  async hasMFAEnabled(userId: string): Promise<boolean> {
    throw new Error('MFAService stub should never be called - check aliasing in auth.module.ts')
  }

  async getUserMFAMethods(userId: string): Promise<any[]> {
    throw new Error('MFAService stub should never be called - check aliasing in auth.module.ts')
  }

  async disableMFA(userId: string, type: string): Promise<void> {
    throw new Error('MFAService stub should never be called - check aliasing in auth.module.ts')
  }

  async getMFAStats(userId: string): Promise<any> {
    throw new Error('MFAService stub should never be called - check aliasing in auth.module.ts')
  }

  async setupTOTP(userId: string, userEmail: string, phoneNumber?: string): Promise<any> {
    throw new Error('MFAService stub should never be called - check aliasing in auth.module.ts')
  }

  async verifyAndEnableTOTP(userId: string, mfaId: string, token: string): Promise<any> {
    throw new Error('MFAService stub should never be called - check aliasing in auth.module.ts')
  }

  async setupSMS(userId: string, phoneNumber: string): Promise<any> {
    throw new Error('MFAService stub should never be called - check aliasing in auth.module.ts')
  }

  async verifyAndEnableSMS(userId: string, mfaId: string, code: string): Promise<any> {
    throw new Error('MFAService stub should never be called - check aliasing in auth.module.ts')
  }

  async setupWebAuthn(userId: string, deviceName: string): Promise<any> {
    throw new Error('MFAService stub should never be called - check aliasing in auth.module.ts')
  }

  async verifyAndEnableWebAuthn(userId: string, mfaId: string, credential: any): Promise<any> {
    throw new Error('MFAService stub should never be called - check aliasing in auth.module.ts')
  }
}
