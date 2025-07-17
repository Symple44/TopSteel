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
    TypeOrmModule.forFeature([User]),
    UsersModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, LocalStrategy, JwtStrategy, JwtUtilsService, RolesGuard],
  exports: [AuthService, JwtUtilsService, RolesGuard],
})
export class AuthModule {}
