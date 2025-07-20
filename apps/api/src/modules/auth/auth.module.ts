import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { TypeOrmModule } from '@nestjs/typeorm'
import { User } from '../users/entities/user.entity'
import { UsersModule } from '../users/users.module'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { RolesGuard } from './guards/roles.guard'
import { JwtUtilsService } from './services/jwt-utils.service'
import { SessionInvalidationService } from './services/session-invalidation.service'
import { SessionRedisService } from './services/session-redis.service'
import { GeolocationService } from './services/geolocation.service'
import { TOTPService } from './services/totp.service'
import { WebAuthnService } from './services/webauthn.service'
import { MFAService } from './services/mfa.service'
import { SessionsController } from './controllers/sessions.controller'
import { MFAController } from './controllers/mfa.controller'
import { UserSession } from './entities/user-session.entity'
import { UserMFA } from './entities/user-mfa.entity'
import { MFASession } from './entities/mfa-session.entity'
import { JwtStrategy } from './strategies/jwt.strategy'
import { LocalStrategy } from './strategies/local.strategy'

@Module({
  imports: [
    ConfigModule,
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
    TypeOrmModule.forFeature([UserSession, UserMFA, MFASession]),
    UsersModule,
  ],
  controllers: [AuthController, SessionsController, MFAController],
  providers: [
    AuthService, 
    LocalStrategy, 
    JwtStrategy, 
    JwtUtilsService, 
    SessionInvalidationService, 
    SessionRedisService,
    GeolocationService,
    TOTPService,
    WebAuthnService,
    MFAService,
    RolesGuard
  ],
  exports: [
    AuthService, 
    JwtUtilsService, 
    SessionInvalidationService, 
    SessionRedisService,
    GeolocationService,
    TOTPService,
    WebAuthnService,
    MFAService,
    RolesGuard
  ],
})
export class AuthModule {}
