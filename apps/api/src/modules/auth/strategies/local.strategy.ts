// apps/api/src/modules/auth/strategies/local.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { Strategy } from 'passport-local'
import type { User } from '../../users/entities/user.entity'
import type { AuthService } from '../auth.service'

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({
      usernameField: 'email', // Utiliser email au lieu de username
      passwordField: 'password',
    })
  }

  async validate(
    email: string,
    password: string
  ): Promise<Omit<User, 'password' | 'hashPassword'>> {
    const user = await this.authService.validateUser(email, password)
    if (!user) {
      throw new UnauthorizedException('Credentials invalides')
    }
    return user
  }
}
