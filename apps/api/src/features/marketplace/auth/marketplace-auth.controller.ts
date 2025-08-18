import {
  BadRequestException,
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Ip,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { ThrottlerGuard } from '@nestjs/throttler'
import { CurrentMarketplaceCustomer } from './decorators/current-customer.decorator'
import {
  AuthTokensResponse,
  type ChangePasswordDto,
  type LoginDto,
  MessageResponse,
  type RefreshTokenDto,
  type RegisterDto,
  type RequestPasswordResetDto,
  type ResetPasswordDto,
  type VerifyEmailDto,
} from './dto/marketplace-auth.dto'
import { MarketplaceAuthGuard } from './guards/marketplace-auth.guard'
import type { MarketplaceAuthService } from './marketplace-auth.service'

@ApiTags('Marketplace Authentication')
@Controller('marketplace/auth')
@UseInterceptors(ClassSerializerInterceptor)
@UseGuards(ThrottlerGuard)
export class MarketplaceAuthController {
  constructor(private readonly authService: MarketplaceAuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Register new marketplace customer',
    description: 'Create a new customer account for the marketplace',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Customer successfully registered',
    type: AuthTokensResponse,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input or email already exists',
  })
  @ApiResponse({
    status: HttpStatus.TOO_MANY_REQUESTS,
    description: 'Too many requests, please try again later',
  })
  @ApiHeader({
    name: 'X-Tenant-ID',
    description: 'Tenant identifier',
    required: true,
  })
  async register(
    @Body() dto: RegisterDto,
    @Headers('x-tenant-id') tenantId: string,
    @Ip() _ip: string
  ): Promise<AuthTokensResponse> {
    if (!tenantId) {
      throw new BadRequestException('Tenant ID is required')
    }

    const tokens = await this.authService.register(dto, tenantId)

    return {
      ...tokens,
      customer: {
        id: '', // Will be populated by the service
        email: dto.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
      },
    }
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Login marketplace customer',
    description: 'Authenticate customer and receive access tokens',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully authenticated',
    type: AuthTokensResponse,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid credentials or account locked',
  })
  @ApiResponse({
    status: HttpStatus.TOO_MANY_REQUESTS,
    description: 'Too many failed attempts',
  })
  @ApiHeader({
    name: 'X-Tenant-ID',
    description: 'Tenant identifier',
    required: true,
  })
  async login(
    @Body() dto: LoginDto,
    @Headers('x-tenant-id') tenantId: string,
    @Ip() _ip: string
  ): Promise<AuthTokensResponse> {
    if (!tenantId) {
      throw new BadRequestException('Tenant ID is required')
    }

    return await this.authService.login(dto, tenantId)
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh access token',
    description: 'Get new access token using refresh token',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Token refreshed successfully',
    type: AuthTokensResponse,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid or expired refresh token',
  })
  async refreshToken(@Body() dto: RefreshTokenDto): Promise<AuthTokensResponse> {
    return await this.authService.refreshToken(dto.refreshToken)
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(MarketplaceAuthGuard)
  @ApiBearerAuth('marketplace-jwt')
  @ApiOperation({
    summary: 'Logout customer',
    description: 'Invalidate current session and tokens',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Successfully logged out',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Not authenticated',
  })
  async logout(@CurrentMarketplaceCustomer() customer: any): Promise<void> {
    await this.authService.logout(customer.id)
  }

  @Post('password/request-reset')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Request password reset',
    description: 'Send password reset email to customer',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Reset email sent if account exists',
    type: MessageResponse,
  })
  @ApiResponse({
    status: HttpStatus.TOO_MANY_REQUESTS,
    description: 'Too many requests',
  })
  @ApiHeader({
    name: 'X-Tenant-ID',
    description: 'Tenant identifier',
    required: true,
  })
  async requestPasswordReset(
    @Body() dto: RequestPasswordResetDto,
    @Headers('x-tenant-id') tenantId: string
  ): Promise<MessageResponse> {
    if (!tenantId) {
      throw new BadRequestException('Tenant ID is required')
    }

    await this.authService.requestPasswordReset(dto.email, tenantId)

    // Always return success to prevent email enumeration
    return {
      message: 'If an account exists with this email, a password reset link has been sent',
      success: true,
    }
  }

  @Post('password/reset')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reset password with token',
    description: 'Set new password using reset token from email',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Password successfully reset',
    type: MessageResponse,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid or expired token',
  })
  async resetPassword(@Body() dto: ResetPasswordDto): Promise<MessageResponse> {
    await this.authService.resetPassword(dto)

    return {
      message: 'Password has been successfully reset. Please login with your new password.',
      success: true,
    }
  }

  @Post('password/change')
  @HttpCode(HttpStatus.OK)
  @UseGuards(MarketplaceAuthGuard)
  @ApiBearerAuth('marketplace-jwt')
  @ApiOperation({
    summary: 'Change password',
    description: 'Change password for authenticated customer',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Password successfully changed',
    type: MessageResponse,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid current password or not authenticated',
  })
  async changePassword(
    @Body() dto: ChangePasswordDto,
    @CurrentMarketplaceCustomer() customer: any
  ): Promise<MessageResponse> {
    await this.authService.changePassword(customer.sub || customer.id, {
      currentPassword: dto.currentPassword,
      newPassword: dto.newPassword,
    })

    return {
      message: 'Password has been successfully changed. You have been logged out from all devices.',
      success: true,
    }
  }

  @Post('email/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify email address',
    description: 'Verify customer email with token from email',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Email successfully verified',
    type: MessageResponse,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid or expired token',
  })
  async verifyEmail(@Body() dto: VerifyEmailDto): Promise<MessageResponse> {
    await this.authService.verifyEmail(dto.token)

    return {
      message: 'Email has been successfully verified',
      success: true,
    }
  }

  @Post('email/resend-verification')
  @HttpCode(HttpStatus.OK)
  @UseGuards(MarketplaceAuthGuard)
  @ApiBearerAuth('marketplace-jwt')
  @ApiOperation({
    summary: 'Resend verification email',
    description: 'Send new verification email to customer',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Verification email sent',
    type: MessageResponse,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Not authenticated',
  })
  async resendVerificationEmail(
    @CurrentMarketplaceCustomer() customer: any
  ): Promise<MessageResponse> {
    await this.authService.resendVerificationEmail(customer.sub || customer.id)

    return {
      message: 'Verification email has been sent',
      success: true,
    }
  }

  @Get('me')
  @UseGuards(MarketplaceAuthGuard)
  @ApiBearerAuth('marketplace-jwt')
  @ApiOperation({
    summary: 'Get current customer',
    description: 'Get authenticated customer information',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Current customer information',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Not authenticated',
  })
  async getCurrentCustomer(@CurrentMarketplaceCustomer() customer: any) {
    // Return sanitized customer data
    return {
      id: customer.id,
      email: customer.email,
      firstName: customer.firstName,
      lastName: customer.lastName,
      emailVerified: customer.emailVerified,
      createdAt: customer.createdAt,
    }
  }

  @Get('sessions')
  @UseGuards(MarketplaceAuthGuard)
  @ApiBearerAuth('marketplace-jwt')
  @ApiOperation({
    summary: 'Get active sessions',
    description: 'List all active sessions for the customer',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of active sessions',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Not authenticated',
  })
  async getActiveSessions(@CurrentMarketplaceCustomer() customer: any) {
    const sessions = await this.authService.getActiveSessions(customer.sub || customer.id)

    return {
      sessions,
      totalCount: sessions.length,
    }
  }

  @Post('sessions/revoke-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(MarketplaceAuthGuard)
  @ApiBearerAuth('marketplace-jwt')
  @ApiOperation({
    summary: 'Revoke all sessions',
    description: 'Logout from all devices',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'All sessions revoked',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Not authenticated',
  })
  async revokeAllSessions(@CurrentMarketplaceCustomer() customer: any): Promise<void> {
    await this.authService.logout(customer.id)
  }
}
