import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { PrismaModule } from '../../../core/database/prisma/prisma.module'
import { AuthPrismaService } from './auth-prisma.service'
import { AuthPrismaController } from './auth-prisma.controller'
import { RolesPrismaController } from './roles-prisma.controller'
import { MfaPrismaService } from './mfa-prisma.service'
import { TenantPrismaService } from './tenant-prisma.service'
import { UserSettingsPrismaService } from './user-settings-prisma.service'
import { GroupsPrismaService } from './groups-prisma.service'
import { AuditLogPrismaService } from './audit-log-prisma.service'
import { SmsLogPrismaService } from './sms-log-prisma.service'
import { ModulePrismaService } from './module-prisma.service'
import { RolePrismaService } from './role-prisma.service'
import { SessionPrismaService } from './session-prisma.service'
import { TenantGuard } from './guards/tenant.guard'

/**
 * AuthPrismaModule - Phase 1 + Phase 2.1
 *
 * Module complet pour l'authentification avec Prisma
 *
 * Provides:
 * - AuthPrismaService pour opérations auth avec Prisma
 * - MfaPrismaService pour MFA/TOTP avec Prisma
 * - TenantPrismaService pour multi-tenant DB-level isolation
 * - UserSettingsPrismaService pour préférences utilisateur
 * - GroupsPrismaService pour gestion des groupes
 * - AuditLogPrismaService pour logs d'audit
 * - SmsLogPrismaService pour logs SMS
 * - ModulePrismaService pour modules fonctionnels
 * - RolePrismaService pour gestion des rôles (Phase 6.2)
 * - SessionPrismaService pour gestion des sessions (Phase 6.3)
 * - TenantGuard pour validation tenant access
 * - AuthPrismaController pour endpoint /auth-prisma/login
 *
 * Utilisé pour:
 * - Authentification et autorisation
 * - MFA TOTP support avec QR codes
 * - Multi-tenant DB-level isolation
 * - Gestion complète auth domain
 */
@Module({
  imports: [
    PrismaModule,
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret'),
        signOptions: {
          expiresIn: configService.get<string>('jwt.expiresIn') || '1h',
        },
      }),
    }),
  ],
  controllers: [AuthPrismaController, RolesPrismaController],
  providers: [
    AuthPrismaService,
    MfaPrismaService,
    TenantPrismaService,
    UserSettingsPrismaService,
    GroupsPrismaService,
    AuditLogPrismaService,
    SmsLogPrismaService,
    ModulePrismaService,
    RolePrismaService,
    SessionPrismaService,
    TenantGuard,
  ],
  exports: [
    AuthPrismaService,
    MfaPrismaService,
    TenantPrismaService,
    UserSettingsPrismaService,
    GroupsPrismaService,
    AuditLogPrismaService,
    SmsLogPrismaService,
    ModulePrismaService,
    RolePrismaService,
    SessionPrismaService,
    TenantGuard,
  ],
})
export class AuthPrismaModule {}
