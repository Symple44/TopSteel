import {
  Body,
  Controller,
  Post,
  Get,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
  BadRequestException,
  Req,
  Logger,
  UseGuards,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import type { Request } from 'express'
import { Public } from '../../core/multi-tenant'
import { v4 as uuidv4 } from 'uuid'
import * as bcrypt from 'bcrypt'
import { AuthPrismaService } from './prisma/auth-prisma.service'
import { LoginPrismaDto, LoginPrismaResponseDto } from './prisma/dto/login-prisma.dto'
import { JwtAuthGuard } from './security/guards/jwt-auth.guard'
import { CurrentUser } from '../../core/common/decorators/current-user.decorator'
import { EmailService } from '../../core/email/email.service'
import { PrismaService } from '../../core/database/prisma/prisma.service'
import type { User } from '@prisma/client'
import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator'

// DTOs for new endpoints
class RegisterDto {
  @IsString()
  firstName!: string

  @IsString()
  lastName!: string

  @IsEmail()
  email!: string

  @IsString()
  @IsOptional()
  company?: string

  @IsString()
  @MinLength(8)
  password!: string
}

class ForgotPasswordDto {
  @IsEmail()
  email!: string
}

class ResetPasswordDto {
  @IsString()
  token!: string

  @IsString()
  @MinLength(8)
  newPassword!: string
}

/**
 * AuthController - Prisma-based Authentication
 *
 * Primary authentication controller using Prisma ORM
 *
 * Endpoints:
 * - POST /auth/login - User authentication (public)
 * - GET /auth/verify - Verify JWT token (requires auth)
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
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
    private readonly prisma: PrismaService
  ) {}

  /**
   * User Login
   * @param loginDto - Email and password
   * @param request - Express Request for IP/UserAgent tracking
   * @returns JWT tokens and user data
   */
  @Post('login')
  @Public()
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
    if (!user.actif) {
      this.logger.warn(`Inactive user attempted login: ${loginDto.email}`)
      throw new UnauthorizedException('Account is inactive')
    }

    // 4. Generate JWT tokens
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    }

    // Get JWT secret with same fallback as JwtStrategy for consistency
    const configuredSecret = this.configService.get<string>('jwt.secret')
    const isProduction = process.env.NODE_ENV === 'production'
    const jwtSecret = configuredSecret || (isProduction ? '' : 'jwt-strategy-dev-secret-min-32-characters')

    if (!jwtSecret) {
      this.logger.error('JWT secret not configured')
      throw new UnauthorizedException('Server configuration error')
    }

    const jwtExpiresIn = this.configService.get<string>('jwt.expiresIn') || '24h'
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
        nom: user.nom,
        prenom: user.prenom,
        role: user.role,
        isActive: user.actif,
      },
      accessToken,
      refreshToken,
      sessionId,
      expiresIn: this.parseExpiresIn(jwtExpiresIn),
    }
  }

  /**
   * Verify JWT Token
   * Returns user info if token is valid
   *
   * Note: @Public() bypasses global TenantGuard to allow JwtAuthGuard to run first
   * and populate request.user. JwtAuthGuard still validates the JWT token.
   */
  @Get('verify')
  @Public()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Verify JWT token',
    description: 'Validates the JWT token and returns user information',
  })
  @ApiResponse({
    status: 200,
    description: 'Token is valid',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid or expired token',
  })
  async verify(@CurrentUser() user: User) {
    this.logger.debug(`Token verified for user: ${user.email}`)
    return {
      valid: true,
      user: {
        id: user.id,
        email: user.email,
        nom: user.nom,
        prenom: user.prenom,
        role: user.role,
        isActive: user.actif,
      },
    }
  }

  /**
   * User Registration
   * @param registerDto - User registration data
   * @returns Created user data
   */
  @Post('register')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'User registration',
    description: 'Register a new user account',
  })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: 201,
    description: 'User created successfully',
  })
  @ApiResponse({
    status: 409,
    description: 'User already exists',
  })
  async register(@Body() registerDto: RegisterDto) {
    this.logger.log(`Registration attempt: ${registerDto.email}`)

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: registerDto.email.toLowerCase() },
    })

    if (existingUser) {
      this.logger.warn(`User already exists: ${registerDto.email}`)
      throw new BadRequestException('Un compte existe déjà avec cet email')
    }

    // Hash password
    const saltRounds = process.env.NODE_ENV === 'production' ? 12 : 10
    const hashedPassword = await bcrypt.hash(registerDto.password, saltRounds)

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email: registerDto.email.toLowerCase(),
        password: hashedPassword,
        nom: registerDto.lastName,
        prenom: registerDto.firstName,
        role: 'USER',
        actif: true,
      },
    })

    this.logger.log(`User registered successfully: ${user.email}`)

    return {
      success: true,
      message: 'Compte créé avec succès',
      user: {
        id: user.id,
        email: user.email,
        nom: user.nom,
        prenom: user.prenom,
      },
    }
  }

  /**
   * Forgot Password - Request password reset
   * @param forgotPasswordDto - Email address
   * @returns Success message (always returns success for security)
   */
  @Post('forgot-password')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Request password reset',
    description: 'Send a password reset link to the user email',
  })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Reset email sent (if account exists)',
  })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    this.logger.log(`Password reset request: ${forgotPasswordDto.email}`)

    // Find user by email
    const user = await this.prisma.user.findUnique({
      where: { email: forgotPasswordDto.email.toLowerCase() },
    })

    // Always return success for security (don't reveal if email exists)
    if (!user) {
      this.logger.warn(`Password reset for non-existent email: ${forgotPasswordDto.email}`)
      return {
        success: true,
        message: 'Si un compte existe avec cet email, un lien de réinitialisation a été envoyé',
      }
    }

    // Generate reset token (valid for 1 hour)
    const resetToken = uuidv4()
    const resetExpires = new Date(Date.now() + 3600000) // 1 hour

    // Store reset token in database
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: resetToken,
        resetPasswordExpires: resetExpires,
      },
    })

    // Send reset email
    try {
      await this.emailService.sendPasswordResetEmail(
        user.email,
        user.prenom || user.nom || 'Utilisateur',
        resetToken
      )
      this.logger.log(`Password reset email sent to: ${user.email}`)
    } catch (error) {
      this.logger.error(`Failed to send password reset email: ${error}`)
      // Don't expose email sending errors to user
    }

    return {
      success: true,
      message: 'Si un compte existe avec cet email, un lien de réinitialisation a été envoyé',
    }
  }

  /**
   * Reset Password - Set new password with token
   * @param resetPasswordDto - Token and new password
   * @returns Success message
   */
  @Post('reset-password')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reset password with token',
    description: 'Set a new password using the reset token',
  })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Password reset successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid or expired token',
  })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    this.logger.log('Password reset attempt with token')

    // Find user by reset token
    const user = await this.prisma.user.findFirst({
      where: {
        resetPasswordToken: resetPasswordDto.token,
        resetPasswordExpires: {
          gt: new Date(),
        },
      },
    })

    if (!user) {
      this.logger.warn('Invalid or expired reset token')
      throw new BadRequestException('Token invalide ou expiré')
    }

    // Hash new password
    const saltRounds = process.env.NODE_ENV === 'production' ? 12 : 10
    const hashedPassword = await bcrypt.hash(resetPasswordDto.newPassword, saltRounds)

    // Update password and clear reset token
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    })

    this.logger.log(`Password reset successfully for: ${user.email}`)

    return {
      success: true,
      message: 'Mot de passe réinitialisé avec succès',
    }
  }

  /**
   * Get User Societes
   * Returns the list of companies the user has access to
   *
   * Note: @Public() bypasses global TenantGuard, JwtAuthGuard still validates JWT
   */
  @Get('societes')
  @Public()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get user societes',
    description: 'Returns the list of companies the authenticated user has access to',
  })
  @ApiResponse({
    status: 200,
    description: 'List of societes retrieved successfully',
  })
  async getUserSocietes(@CurrentUser() user: User) {
    this.logger.debug(`Getting societes for user: ${user.email}`)

    // Get societes where user is associated
    const societeUsers = await this.prisma.societeUser.findMany({
      where: {
        userId: user.id,
        isActive: true,
      },
      include: {
        societe: true,
      },
    })

    const societes = societeUsers
      .filter(su => su.societe && su.societe.isActive)
      .map(su => ({
        id: su.societe.id,
        code: su.societe.code,
        nom: su.societe.name,
        raisonSociale: su.societe.legalName,
        actif: su.societe.isActive,
      }))

    return {
      success: true,
      data: societes,
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
