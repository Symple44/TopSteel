import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import type { Request } from 'express'

import { TenantGuard } from '../../../shared/tenant/tenant.guard'
import type { CustomerAddress } from '../entities/marketplace-customer.entity'
import type {
  CreateCustomerDto,
  CustomerLoginDto,
  MarketplaceCustomersService,
  UpdateCustomerDto,
} from '../services/marketplace-customers.service'

@ApiTags('customers')
@Controller('customers')
@UseGuards(TenantGuard)
export class CustomersController {
  constructor(private customersService: MarketplaceCustomersService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register new customer account' })
  @ApiResponse({ status: 201, description: 'Customer created successfully' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  @HttpCode(HttpStatus.CREATED)
  async register(@Req() req: Request, @Body() createDto: CreateCustomerDto) {
    const { tenant } = req as any

    const customer = await this.customersService.createCustomer(tenant.societeId, createDto)

    // Ne pas retourner le mot de passe hashé
    const { passwordHash, ...customerData } = customer
    return customerData
  }

  @Post('login')
  @ApiOperation({ summary: 'Customer login' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @HttpCode(HttpStatus.OK)
  async login(@Req() req: Request, @Body() loginDto: CustomerLoginDto) {
    const { tenant } = req as any

    const customer = await this.customersService.authenticateCustomer(tenant.societeId, loginDto)

    // TODO: Générer JWT token
    const { passwordHash, ...customerData } = customer

    return {
      customer: customerData,
      // token: jwt.sign({ customerId: customer.id, societeId: tenant.societeId }, JWT_SECRET)
    }
  }

  @Post('guest')
  @ApiOperation({ summary: 'Create guest customer for checkout' })
  @ApiResponse({ status: 201, description: 'Guest customer created' })
  @HttpCode(HttpStatus.CREATED)
  async createGuest(
    @Req() req: Request,
    @Body() body: {
      email: string
      firstName?: string
      lastName?: string
      company?: string
      phone?: string
    }
  ) {
    const { tenant } = req as any

    const customer = await this.customersService.createGuestCustomer(
      tenant.societeId,
      body.email,
      body
    )

    return customer
  }

  @Get('profile/:customerId')
  @ApiOperation({ summary: 'Get customer profile' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Customer profile' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async getProfile(@Req() req: Request, @Param('customerId') customerId: string) {
    const { tenant } = req as any

    const customer = await this.customersService.findById(customerId, tenant.societeId)
    const { passwordHash, ...customerData } = customer

    return customerData
  }

  @Put('profile/:customerId')
  @ApiOperation({ summary: 'Update customer profile' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  async updateProfile(
    @Req() req: Request,
    @Param('customerId') customerId: string,
    @Body() updateDto: UpdateCustomerDto
  ) {
    const { tenant } = req as any

    const customer = await this.customersService.updateCustomer(
      customerId,
      tenant.societeId,
      updateDto
    )

    const { passwordHash, ...customerData } = customer
    return customerData
  }

  @Post('profile/:customerId/addresses')
  @ApiOperation({ summary: 'Add customer address' })
  @ApiBearerAuth()
  @ApiResponse({ status: 201, description: 'Address added successfully' })
  @HttpCode(HttpStatus.CREATED)
  async addAddress(
    @Req() req: Request,
    @Param('customerId') customerId: string,
    @Body() address: Omit<CustomerAddress, 'id'>
  ) {
    const { tenant } = req as any

    const customer = await this.customersService.addAddress(customerId, tenant.societeId, address)

    return customer.addresses
  }

  @Put('profile/:customerId/addresses/:addressId')
  @ApiOperation({ summary: 'Update customer address' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Address updated successfully' })
  async updateAddress(
    @Req() req: Request,
    @Param('customerId') customerId: string,
    @Param('addressId') addressId: string,
    @Body() updates: Partial<CustomerAddress>
  ) {
    const { tenant } = req as any

    const customer = await this.customersService.updateAddress(
      customerId,
      tenant.societeId,
      addressId,
      updates
    )

    return customer.addresses
  }

  @Delete('profile/:customerId/addresses/:addressId')
  @ApiOperation({ summary: 'Remove customer address' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Address removed successfully' })
  async removeAddress(
    @Req() req: Request,
    @Param('customerId') customerId: string,
    @Param('addressId') addressId: string
  ) {
    const { tenant } = req as any

    const customer = await this.customersService.removeAddress(
      customerId,
      tenant.societeId,
      addressId
    )

    return customer.addresses
  }

  @Post('profile/:customerId/convert-to-account')
  @ApiOperation({ summary: 'Convert guest to account' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Account created successfully' })
  async convertToAccount(
    @Req() req: Request,
    @Param('customerId') customerId: string,
    @Body() body: {
      password: string
      firstName?: string
      lastName?: string
    }
  ) {
    const { tenant } = req as any

    const customer = await this.customersService.convertGuestToAccount(
      customerId,
      tenant.societeId,
      body.password,
      body.firstName,
      body.lastName
    )

    const { passwordHash, ...customerData } = customer
    return customerData
  }

  @Put('profile/:customerId/password')
  @ApiOperation({ summary: 'Update customer password' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Password updated successfully' })
  @HttpCode(HttpStatus.OK)
  async updatePassword(
    @Req() req: Request,
    @Param('customerId') customerId: string,
    @Body() body: {
      currentPassword: string
      newPassword: string
    }
  ) {
    const { tenant } = req as any

    await this.customersService.updatePassword(
      customerId,
      tenant.societeId,
      body.currentPassword,
      body.newPassword
    )

    return { message: 'Mot de passe mis à jour avec succès' }
  }

  @Post('password/reset-request')
  @ApiOperation({ summary: 'Request password reset' })
  @ApiResponse({ status: 200, description: 'Reset email sent if account exists' })
  @HttpCode(HttpStatus.OK)
  async requestPasswordReset(@Req() req: Request, @Body() body: { email: string }) {
    const { tenant } = req as any

    await this.customersService.requestPasswordReset(tenant.societeId, body.email)

    return {
      message: 'Si un compte existe avec cet email, un lien de réinitialisation a été envoyé',
    }
  }

  @Post('password/reset')
  @ApiOperation({ summary: 'Reset password with token' })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() body: { token: string; newPassword: string }) {
    await this.customersService.resetPassword(body.token, body.newPassword)

    return { message: 'Mot de passe réinitialisé avec succès' }
  }

  @Get('check-email/:email')
  @ApiOperation({ summary: 'Check if email exists' })
  @ApiResponse({ status: 200, description: 'Email check result' })
  async checkEmail(@Req() req: Request, @Param('email') email: string) {
    const { tenant } = req as any

    const customer = await this.customersService.findByEmail(tenant.societeId, email)

    return {
      exists: !!customer,
      hasAccount: customer?.hasAccount || false,
    }
  }
}
