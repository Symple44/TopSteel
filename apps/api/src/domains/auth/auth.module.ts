import { DatabaseModule } from '../../core/database/database.module'
import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'

import { DatabaseCoreModule } from '../../features/database-core/database-core.module'
import { ParametersModule } from '../../features/parameters/parameters.module'
import { EmailModule } from '../../core/email/email.module'

import { SocietesModule } from '../../features/societes/societes.module'
import { TopSteelLogger } from '../../core/common/logger/structured-logger.service'
import { RedisService } from '../../core/common/services/redis.service'
import { OptimizedCacheService } from '../../infrastructure/cache/redis-optimized.service'
import { UsersModule } from '../users/users.module'
// import { UserAuthPrismaRepositoryService } from '../users/services/user-auth-prisma-repository.service' // DISABLED: TypeORM dependency
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { AuthRepositoryProviders } from './core/providers/auth-repository.providers'
import { AuthCoreService } from './core/services/auth-core.service'
import { MFAController } from './external/controllers/mfa.controller'
import { SMSAdminController } from './external/controllers/sms-admin.controller'
import { CombinedSecurityGuard } from './security/guards/combined-security.guard'
import { EnhancedRolesGuard } from './security/guards/enhanced-roles.guard'
import { EnhancedTenantGuard } from './security/guards/enhanced-tenant.guard'
import { ResourceOwnershipGuard } from './security/guards/resource-ownership.guard'
import { RolesGuard } from './security/guards/roles.guard'
import { TenantGuard } from './security/guards/tenant.guard'
import { JwtStrategy } from './security/strategies/jwt.strategy'
import { JwtEnhancedStrategy } from './security/strategies/jwt-enhanced.strategy'
import { LocalStrategy } from './security/strategies/local.strategy'
// Legacy TypeORM Services (being aliased to Prisma)
import { AuditService } from './services/audit.service'
import { MFAService } from './services/mfa.service'
import { PermissionService } from './services/permission.service'
import { SessionInvalidationService } from './services/session-invalidation.service'
import { SMSService } from './services/sms.service'
import { RoleService } from './services/role.service'
import { GroupService } from './services/group.service'

// Utility Services (no TypeORM - keep as is)
import { AuthPerformanceService } from './services/auth-performance.service'
import { GeolocationService } from './services/geolocation.service'
import { JwtUtilsService } from './services/jwt-utils.service'
import { PermissionCalculatorService } from './services/permission-calculator.service'
import { RoleFormattingService } from './services/role-formatting.service'
import { SessionRedisService } from './services/session-redis.service'
import { TOTPService } from './services/totp.service'

import { UnifiedRolesService } from './services/unified-roles.service'
import { UserSocieteRolesService } from './services/user-societe-roles.service'
import { WebAuthnService } from './services/webauthn.service'
import { AuthPrismaModule } from './prisma/auth-prisma.module'

// Prisma Services for aliasing
import { AuditLogPrismaService } from './prisma/audit-log-prisma.service'
import { MfaPrismaService } from './prisma/mfa-prisma.service'
import { PermissionPrismaService } from './prisma/permission-prisma.service'
import { SessionPrismaService } from './prisma/session-prisma.service'
import { SmsLogPrismaService } from './prisma/sms-log-prisma.service'
import { RolePrismaService } from './prisma/role-prisma.service'
import { GroupsPrismaService } from './prisma/groups-prisma.service'
import { UnifiedRolesPrismaService } from './prisma/unified-roles-prisma.service'
import { UserSocieteRolesPrismaService } from './prisma/user-societe-roles-prisma.service'

@Module({
  imports: [
    DatabaseModule,
    ConfigModule,
    DatabaseCoreModule,
    ParametersModule,
    AuthPrismaModule, // Prisma-based auth services
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const secret = configService.get<string>('jwt.secret')
        const issuer = configService.get<string>('jwt.issuer')
        const audience = configService.get<string>('jwt.audience')

        if (!secret) {
          throw new Error('JWT secret is required')
        }

        return {
          secret,
          signOptions: {
            expiresIn: '24h',
            ...(issuer && { issuer }),
            ...(audience && { audience }),
          },
        }
      },
      inject: [ConfigService],
    }),
    // TypeORM repositories disabled - using Prisma services (aliased below)
    // TypeOrmModule.forFeature(
    //   [
    //     UserSession,
    //     UserMFA,
    //     MFASession,
    //     UserSocieteRole,
    //     Role,
    //     Permission,
    //     RolePermission,
    //     Societe,
    //     SocieteUser,
    //     AuditLog,
    //     SMSLog,
    //   ],
    //   'auth'
    // ),
    UsersModule,
    SocietesModule,
    EmailModule,
  ],
  controllers: [AuthController, MFAController, SMSAdminController],
  providers: [
    // Core Auth Services
    AuthService,
    AuthCoreService,
    // UserAuthPrismaRepositoryService, // DISABLED: TypeORM dependency
    ...AuthRepositoryProviders,

    // Strategies
    LocalStrategy,
    JwtStrategy,
    JwtEnhancedStrategy,

    // Utility Services (no TypeORM - keep as is)
    JwtUtilsService,
    SessionRedisService,
    GeolocationService,
    TOTPService,
    WebAuthnService,
    PermissionCalculatorService,
    RoleFormattingService,
    AuthPerformanceService,

    // Guards
    RolesGuard,
    TenantGuard,
    EnhancedRolesGuard,
    EnhancedTenantGuard,
    ResourceOwnershipGuard,
    CombinedSecurityGuard,

    // Infrastructure
    TopSteelLogger,
    RedisService,
    OptimizedCacheService,

    // ===== PRISMA SERVICES WITH ALIASING =====
    // Pattern: Ancien nom TypeORM → Nouveau service Prisma

    // AuditService → AuditLogPrismaService
    {
      provide: AuditService,
      useExisting: AuditLogPrismaService,
    },

    // MFAService → MfaPrismaService
    {
      provide: MFAService,
      useExisting: MfaPrismaService,
    },

    // PermissionService → PermissionPrismaService
    {
      provide: PermissionService,
      useExisting: PermissionPrismaService,
    },

    // SessionInvalidationService → SessionPrismaService
    {
      provide: SessionInvalidationService,
      useExisting: SessionPrismaService,
    },

    // SMSService → SmsLogPrismaService
    {
      provide: SMSService,
      useExisting: SmsLogPrismaService,
    },

    // RoleService → RolePrismaService
    {
      provide: RoleService,
      useExisting: RolePrismaService,
    },

    // GroupService → GroupsPrismaService
    {
      provide: GroupService,
      useExisting: GroupsPrismaService,
    },

    // UnifiedRolesService → UnifiedRolesPrismaService
    {
      provide: UnifiedRolesService,
      useExisting: UnifiedRolesPrismaService,
    },

    // UserSocieteRolesService → UserSocieteRolesPrismaService
    {
      provide: UserSocieteRolesService,
      useExisting: UserSocieteRolesPrismaService,
    }],
  exports: [
    // TypeORM Services (Legacy - being migrated)
    AuthService,
    AuthCoreService, // Export du service principal
    JwtUtilsService,
    SessionInvalidationService,
    SessionRedisService,
    GeolocationService,
    TOTPService,
    WebAuthnService,
    SMSService,
    MFAService,
    RolesGuard,
    TenantGuard,
    EnhancedRolesGuard,
    EnhancedTenantGuard,
    ResourceOwnershipGuard,
    CombinedSecurityGuard,
    UserSocieteRolesService,
    UnifiedRolesService,
    PermissionCalculatorService,
    PermissionService,
    RoleFormattingService,
    AuthPerformanceService,
    AuditService,
    // Prisma Services - exported via AuthPrismaModule:
    // AuthPrismaService, MfaPrismaService, TenantPrismaService,
    // UserSettingsPrismaService, GroupsPrismaService, AuditLogPrismaService,
    // SmsLogPrismaService, ModulePrismaService
  ],
})
export class AuthModule {}

