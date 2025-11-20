import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { PrismaModule } from '../../../core/database/prisma/prisma.module'
import { RedisService } from '../../../core/common/services/redis.service'
import { TopSteelLogger } from '../../../core/common/logger/structured-logger.service'
import { AuthPrismaService } from './auth-prisma.service'
import { MfaPrismaService } from './mfa-prisma.service'
import { TenantPrismaService } from './tenant-prisma.service'
import { UserSettingsPrismaService } from './user-settings-prisma.service'
import { GroupsPrismaService } from './groups-prisma.service'
import { AuditLogPrismaService } from './audit-log-prisma.service'
import { SmsLogPrismaService } from './sms-log-prisma.service'
import { ModulePrismaService } from './module-prisma.service'
import { RolePrismaService } from './role-prisma.service'
import { SessionPrismaService } from './session-prisma.service'
import { PermissionPrismaService } from './permission-prisma.service'
import { UserSocieteRolesPrismaService } from './user-societe-roles-prisma.service'
import { UnifiedRolesPrismaService } from './unified-roles-prisma.service'
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
 * - PermissionPrismaService pour gestion des permissions RBAC
 * - UserSocieteRolesPrismaService pour rôles utilisateur-société
 * - UnifiedRolesPrismaService pour rôles unifiés (global + société)
 * - TenantGuard pour validation tenant access
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
  controllers: [], // Controllers removed - deprecated -prisma controllers
  providers: [
    RedisService,
    TopSteelLogger,
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
    PermissionPrismaService,
    UserSocieteRolesPrismaService,
    UnifiedRolesPrismaService,
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
    PermissionPrismaService,
    UserSocieteRolesPrismaService,
    UnifiedRolesPrismaService,
    TenantGuard,
  ],
})
export class AuthPrismaModule {}
