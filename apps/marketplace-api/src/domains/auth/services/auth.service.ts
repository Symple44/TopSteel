import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common'
import type { JwtService } from '@nestjs/jwt'
import { InjectRepository } from '@nestjs/typeorm'
import * as bcrypt from 'bcrypt'
import type { Repository } from 'typeorm'
import { MarketplaceCustomer } from '../../customers/entities/marketplace-customer.entity'

export interface AuthPayload {
  customerId: string
  email: string
  firstName: string
  lastName: string
  tenantId: string
}

export interface LoginDto {
  email: string
  password: string
}

export interface RegisterDto {
  email: string
  password: string
  firstName: string
  lastName: string
  phone?: string
  company?: string
  vatNumber?: string
}

export interface TokenResponse {
  access_token: string
  refresh_token: string
  expires_in: number
  customer: {
    id: string
    email: string
    firstName: string
    lastName: string
    company?: string
  }
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(MarketplaceCustomer, 'marketplace')
    private customerRepository: Repository<MarketplaceCustomer>,
    private jwtService: JwtService
  ) {}

  async login(loginDto: LoginDto, tenantId: string): Promise<TokenResponse> {
    const customer = await this.customerRepository.findOne({
      where: {
        email: loginDto.email.toLowerCase(),
        tenantId,
        isActive: true,
      },
    })

    if (!customer) {
      throw new UnauthorizedException('Invalid credentials')
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, customer.passwordHash)
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials')
    }

    // Update last login
    customer.lastLoginAt = new Date()
    await this.customerRepository.save(customer)

    return this.generateTokens(customer)
  }

  async register(registerDto: RegisterDto, tenantId: string): Promise<TokenResponse> {
    // Check if customer already exists
    const existingCustomer = await this.customerRepository.findOne({
      where: {
        email: registerDto.email.toLowerCase(),
        tenantId,
      },
    })

    if (existingCustomer) {
      throw new BadRequestException('Email already registered')
    }

    // Hash password
    const passwordHash = await bcrypt.hash(registerDto.password, 10)

    // Create new customer
    const customer = this.customerRepository.create({
      societeId: tenantId, // Assuming tenantId is the societeId
      tenantId,
      email: registerDto.email.toLowerCase(),
      passwordHash,
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
      phone: registerDto.phone,
      company: registerDto.company,
      hasAccount: true,
      isActive: true,
      isVerified: false,
      registrationDate: new Date(),
      metadata: {
        source: 'marketplace',
        registrationSource: 'web',
      },
    })

    const savedCustomer = await this.customerRepository.save(customer)

    // Send verification email (would be implemented separately)
    // await this.emailService.sendVerificationEmail(savedCustomer)

    return this.generateTokens(savedCustomer)
  }

  async refreshToken(refreshToken: string): Promise<TokenResponse> {
    try {
      const payload = await this.jwtService.verifyAsync<AuthPayload>(refreshToken)

      const customer = await this.customerRepository.findOne({
        where: {
          id: payload.customerId,
          isActive: true,
        },
      })

      if (!customer) {
        throw new UnauthorizedException('Invalid refresh token')
      }

      return this.generateTokens(customer)
    } catch (_error) {
      throw new UnauthorizedException('Invalid refresh token')
    }
  }

  async validateCustomer(customerId: string): Promise<MarketplaceCustomer | null> {
    return await this.customerRepository.findOne({
      where: {
        id: customerId,
        isActive: true,
      },
    })
  }

  async resetPassword(email: string, tenantId: string): Promise<void> {
    const customer = await this.customerRepository.findOne({
      where: {
        email: email.toLowerCase(),
        tenantId,
        isActive: true,
      },
    })

    if (!customer) {
      // Don't reveal if email exists
      return
    }

    // Generate reset token
    const resetToken = this.generateResetToken()
    const resetTokenExpiry = new Date(Date.now() + 3600000) // 1 hour

    customer.resetToken = resetToken
    customer.resetTokenExpiry = resetTokenExpiry
    await this.customerRepository.save(customer)

    // Send reset email (would be implemented separately)
    // await this.emailService.sendPasswordResetEmail(customer, resetToken)
  }

  async confirmResetPassword(token: string, newPassword: string, tenantId: string): Promise<void> {
    const customer = await this.customerRepository.findOne({
      where: {
        resetToken: token,
        tenantId,
        isActive: true,
      },
    })

    if (!customer || !customer.resetTokenExpiry || customer.resetTokenExpiry < new Date()) {
      throw new BadRequestException('Invalid or expired reset token')
    }

    // Hash new password
    customer.passwordHash = await bcrypt.hash(newPassword, 10)
    customer.resetToken = undefined
    customer.resetTokenExpiry = undefined
    await this.customerRepository.save(customer)
  }

  private generateTokens(customer: MarketplaceCustomer): TokenResponse {
    const payload: AuthPayload = {
      customerId: customer.id,
      email: customer.email,
      firstName: customer.firstName,
      lastName: customer.lastName,
      tenantId: customer.tenantId,
    }

    const access_token = this.jwtService.sign(payload, {
      expiresIn: '15m',
    })

    const refresh_token = this.jwtService.sign(payload, {
      expiresIn: '7d',
    })

    return {
      access_token,
      refresh_token,
      expires_in: 900, // 15 minutes in seconds
      customer: {
        id: customer.id,
        email: customer.email,
        firstName: customer.firstName,
        lastName: customer.lastName,
        company: customer.company,
      },
    }
  }

  private generateResetToken(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  }
}
