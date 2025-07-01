// apps/api/src/modules/auth/auth.module.ts
import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { UsersModule } from "../users/users.module";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtUtilsService } from "./services/jwt-utils.service";
import { JwtStrategy } from "./strategies/jwt.strategy";
import { LocalStrategy } from "./strategies/local.strategy";

@Module({
  imports: [
    // Import du module Users pour utiliser UsersService
    UsersModule,

    // Configuration Passport
    PassportModule.register({
      defaultStrategy: "jwt",
      session: false,
    }),

    // Configuration JWT
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>("jwt.secret"),
        signOptions: {
          expiresIn: configService.get<string>("jwt.expiresIn", "15m"),
          issuer: configService.get<string>("jwt.issuer"),
          audience: configService.get<string>("jwt.audience"),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtUtilsService, LocalStrategy, JwtStrategy],
  exports: [AuthService, JwtModule, JwtUtilsService],
})
export class AuthModule {}
