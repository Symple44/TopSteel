import {
  Body,
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
  Req,
  Logger,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import type { Request } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { AuthPrismaService } from './auth-prisma.service'
import { LoginPrismaDto, LoginPrismaResponseDto } from './dto/login-prisma.dto'

/**
 * AuthPrismaController - POC Phase 1.4
 *
 * Contrôleur pour tester l'authentification avec Prisma
 *
 * Endpoints:
 * - POST /auth-prisma/login - Login avec Prisma (POC)
 */
@Controller('auth-prisma')
export class AuthPrismaController {
  private readonly logger = new Logger(AuthPrismaController.name)

  constructor(
    private readonly authPrismaService: AuthPrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}

  /**
   * Login avec Prisma - Endpoint POC
   * @param loginDto - Email et mot de passe
   * @param request - Request Express pour IP/UserAgent
   * @returns Tokens JWT et données utilisateur
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async loginPrisma(
    @Body() loginDto: LoginPrismaDto,
    @Req() request: Request
  ): Promise<LoginPrismaResponseDto> {
    this.logger.log(`Login attempt with Prisma: ${loginDto.email}`)

    // 1. Trouver l'utilisateur par email
    const user = await this.authPrismaService.findUserByEmail(loginDto.email)

    if (!user) {
      this.logger.warn(`User not found: ${loginDto.email}`)
      throw new UnauthorizedException('Invalid credentials')
    }

    // 2. Valider le mot de passe
    const isPasswordValid = await this.authPrismaService.validatePassword(
      user,
      loginDto.password
    )

    if (!isPasswordValid) {
      this.logger.warn(`Invalid password for user: ${loginDto.email}`)
      throw new UnauthorizedException('Invalid credentials')
    }

    // 3. Vérifier que l'utilisateur est actif
    if (!user.isActive) {
      this.logger.warn(`Inactive user attempted login: ${loginDto.email}`)
      throw new UnauthorizedException('Account is inactive')
    }

    // 4. Générer les tokens JWT
    const payload = {
      sub: user.id,
      email: user.email,
      username: user.username,
    }

    const jwtSecret = this.configService.get<string>('jwt.secret')
    const jwtExpiresIn = this.configService.get<string>('jwt.expiresIn') || '1h'
    const jwtRefreshExpiresIn =
      this.configService.get<string>('jwt.refreshExpiresIn') || '7d'

    const accessToken = this.jwtService.sign(payload, {
      secret: jwtSecret,
      expiresIn: jwtExpiresIn,
    })

    const refreshToken = this.jwtService.sign(payload, {
      secret: jwtSecret,
      expiresIn: jwtRefreshExpiresIn,
    })

    // 5. Créer une session
    const sessionId = uuidv4()
    const ipAddress = request.ip || request.socket.remoteAddress
    const userAgent = request.headers['user-agent']

    await this.authPrismaService.createSession({
      userId: user.id,
      sessionId,
      accessToken,
      refreshToken,
      ipAddress,
      userAgent,
    })

    // 6. Mettre à jour le dernier login
    await this.authPrismaService.updateLastLogin(user.id)

    this.logger.log(`Login successful with Prisma: ${user.email}`)

    // 7. Retourner la réponse
    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      accessToken,
      refreshToken,
      sessionId,
      expiresIn: this.parseExpiresIn(jwtExpiresIn),
    }
  }

  /**
   * Parser le temps d'expiration en secondes
   */
  private parseExpiresIn(expiresIn: string): number {
    const match = expiresIn.match(/^(\d+)([smhd])$/)
    if (!match) return 3600 // Default 1 hour

    const value = parseInt(match[1], 10)
    const unit = match[2]

    switch (unit) {
      case 's':
        return value
      case 'm':
        return value * 60
      case 'h':
        return value * 3600
      case 'd':
        return value * 86400
      default:
        return 3600
    }
  }
}
