import { Body, Controller, Get, Post, Req, UnauthorizedException, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import type { Request } from 'express'
import { TenantGuard } from '../../../shared/tenant/tenant.guard'
import type { AuthService, LoginDto, RegisterDto } from '../services/auth.service'

interface TenantRequest extends Request {
  tenant: {
    societeId: string
  }
  user?: {
    customerId: string
  }
}

@ApiTags('marketplace-auth')
@Controller('auth')
@UseGuards(TenantGuard)
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Customer login' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Req() req: TenantRequest, @Body() loginDto: LoginDto) {
    return await this.authService.login(loginDto, req.tenant.societeId)
  }

  @Post('register')
  @ApiOperation({ summary: 'Customer registration' })
  @ApiResponse({ status: 201, description: 'Registration successful' })
  @ApiResponse({ status: 400, description: 'Email already registered' })
  async register(@Req() req: TenantRequest, @Body() registerDto: RegisterDto) {
    return await this.authService.register(registerDto, req.tenant.societeId)
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token refreshed' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refreshToken(@Body() body: { refresh_token: string }) {
    return await this.authService.refreshToken(body.refresh_token)
  }

  @Post('logout')
  @ApiOperation({ summary: 'Customer logout' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  @ApiBearerAuth()
  async logout() {
    // In a stateless JWT system, logout is handled client-side
    // Here we could blacklist the token if needed
    return { message: 'Logout successful' }
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current customer info' })
  @ApiResponse({ status: 200, description: 'Customer info' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiBearerAuth()
  async getCurrentCustomer(@Req() req: TenantRequest) {
    if (!req.user?.customerId) {
      throw new UnauthorizedException()
    }

    const customer = await this.authService.validateCustomer(req.user.customerId)
    if (!customer) {
      throw new UnauthorizedException()
    }

    return {
      id: customer.id,
      email: customer.email,
      firstName: customer.firstName,
      lastName: customer.lastName,
      company: customer.company,
      phone: customer.phone,
      isVerified: customer.isVerified,
      registrationDate: customer.registrationDate,
    }
  }

  @Post('password/reset')
  @ApiOperation({ summary: 'Request password reset' })
  @ApiResponse({ status: 200, description: 'Reset email sent if account exists' })
  async requestPasswordReset(@Req() req: TenantRequest, @Body() body: { email: string }) {
    await this.authService.resetPassword(body.email, req.tenant.societeId)
    return {
      message: 'If an account exists with this email, a reset link has been sent',
    }
  }

  @Post('password/reset/confirm')
  @ApiOperation({ summary: 'Confirm password reset' })
  @ApiResponse({ status: 200, description: 'Password reset successful' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  async confirmPasswordReset(
    @Req() req: TenantRequest,
    @Body() body: { token: string; newPassword: string }
  ) {
    await this.authService.confirmResetPassword(body.token, body.newPassword, req.tenant.societeId)
    return { message: 'Password reset successful' }
  }
}
