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
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import type { Request } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { AuthPrismaService } from './prisma/auth-prisma.service'
import { LoginPrismaDto, LoginPrismaResponseDto } from './prisma/dto/login-prisma.dto'

/**
 * AuthController - Prisma-based Authentication
 *
 * Primary authentication controller using Prisma ORM
 *
 * Endpoints:
 * - POST /auth/login - User authentication
 *
 * @see /auth-legacy/* for deprecated TypeORM endpoints
 */
@ApiTags('🔐 Auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name)

  constructor(
    private readonly authPrismaService: AuthPrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}

  /**
   * User Login
   * @param loginDto - Email and password
   * @param request - Express Request for IP/UserAgent tracking
   * @returns JWT tokens and user data
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'User authentication',
    description: 'Authenticate user with email and password, create session and return JWT tokens',
  })
  @ApiResponse({
    status: 200,
    description: 'Authentication successful',
    type: LoginPrismaResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials or inactive account',
  })
  async login(
    @Body() loginDto: LoginPrismaDto,
    @Req() request: Request
  ): Promise<LoginPrismaResponseDto> {
    this.logger.log(`Login attempt: ${loginDto.email}`)

    // 1. Find user by email
    const user = await this.authPrismaService.findUserByEmail(loginDto.email)

    if (!user) {
      this.logger.warn(`User not found: ${loginDto.email}`)
      throw new UnauthorizedException('Invalid credentials')
    }

    // 2. Validate password
    const isPasswordValid = await this.authPrismaService.validatePassword(
      user,
      loginDto.password
    )

    if (!isPasswordValid) {
      this.logger.warn(`Invalid password for user: ${loginDto.email}`)
      throw new UnauthorizedException('Invalid credentials')
    }

    // 3. Check if user is active
    if (!user.isActive) {
      this.logger.warn(`Inactive user attempted login: ${loginDto.email}`)
      throw new UnauthorizedException('Account is inactive')
    }

    // 4. Generate JWT tokens
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

    // 5. Create session
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

    // 6. Update last login timestamp
    await this.authPrismaService.updateLastLogin(user.id)

    this.logger.log(`Login successful: ${user.email}`)

    // 7. Return response
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
   * Parse expiration time to seconds
   * @private
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
