import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LocalStrategy } from './strategies/local.strategy';

@Module({
  imports: [PassportModule],
  controllers: [AuthController],
  providers: [AuthService, LocalStrategy],
  exports: [AuthService],
})
export class AuthModule {}