import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { TypeOrmModule } from '@nestjs/typeorm'
import { DatabaseCoreModule } from '../../features/database-core/database-core.module'
import { ParametersModule } from '../../features/parameters/parameters.module'
import { Societe } from '../../features/societes/entities/societe.entity'
import { SocieteUser } from '../../features/societes/entities/societe-user.entity'
import { SocietesModule } from '../../features/societes/societes.module'
import { TopSteelLogger } from '../../core/common/logger/structured-logger.service'
import { RedisService } from '../../core/common/services/redis.service'
import { OptimizedCacheService } from '../../infrastructure/cache/redis-optimized.service'
import { UsersModule } from '../users/users.module'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { AuditLog } from './core/entities/audit-log.entity'
import { MFASession } from './core/entities/mfa-session.entity'
import { Permission } from './core/entities/permission.entity'
import { Role } from './core/entities/role.entity'
import { RolePermission } from './core/entities/role-permission.entity'
import { UserMFA } from './core/entities/user-mfa.entity'
import { UserSession } from './core/entities/user-session.entity'
import { UserSocieteRole } from './core/entities/user-societe-role.entity'
import { AuthRepositoryProviders } from './core/providers/auth-repository.providers'
import { AuthCoreService } from './core/services/auth-core.service'
import { SMSLog } from './entities/sms-log.entity'
import { MFAController } from './external/controllers/mfa.controller'
import { SessionsController } from './external/controllers/sessions.controller'
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
import { AuditService } from './services/audit.service'
import { AuthPerformanceService } from './services/auth-performance.service'
import { GeolocationService } from './services/geolocation.service'
import { JwtUtilsService } from './services/jwt-utils.service'
import { MFAService } from './services/mfa.service'
import { PermissionService } from './services/permission.service'
import { PermissionCalculatorService } from './services/permission-calculator.service'
import { RoleFormattingService } from './services/role-formatting.service'
import { SessionInvalidationService } from './services/session-invalidation.service'
import { SessionRedisService } from './services/session-redis.service'
import { SMSService } from './services/sms.service'
import { TOTPService } from './services/totp.service'
import { UnifiedRolesService } from './services/unified-roles.service'
import { UserSocieteRolesService } from './services/user-societe-roles.service'
import { WebAuthnService } from './services/webauthn.service'
import { AuthPrismaModule } from './prisma/auth-prisma.module'

@Module({
  imports: [
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
    // Repositories pour les entités auth avec connexion 'auth'
    TypeOrmModule.forFeature(
      [
        UserSession,
        UserMFA,
        MFASession,
        UserSocieteRole,
        Role,
        Permission,
        RolePermission,
        Societe,
        SocieteUser,
        AuditLog,
        SMSLog,
      ],
      'auth'
    ),
    UsersModule,
    SocietesModule,
  ],
  controllers: [AuthController, SessionsController, MFAController, SMSAdminController],
  providers: [
    AuthService,
    AuthCoreService, // Service principal
    ...AuthRepositoryProviders, // Providers pour injection d'interfaces
    LocalStrategy,
    JwtStrategy,
    JwtEnhancedStrategy,
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
    TopSteelLogger, // Service de logging structuré
    RedisService, // Service de cache Redis de base
    OptimizedCacheService, // Service de cache REDIS
    UserSocieteRolesService, // Service pour la nouvelle structure de rôles
    UnifiedRolesService, // Service unifié pour la gestion des rôles
    PermissionCalculatorService, // Service de calcul des permissions
    PermissionService, // Service de gestion des permissions
    RoleFormattingService, // Service de formatage des rôles
    AuthPerformanceService, // Service de monitoring des performances
    AuditService, // Service d'audit et de traçabilité
  ],
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
