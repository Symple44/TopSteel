import * as crypto from 'node:crypto'
import { BadRequestException, Injectable, Logger, UnauthorizedException } from '@nestjs/common'
import type { ConfigService } from '@nestjs/config'
import type { EventEmitter2 } from '@nestjs/event-emitter'
import type { JwtService } from '@nestjs/jwt'
import { InjectRepository } from '@nestjs/typeorm'
import { InjectRedis } from '@nestjs-modules/ioredis'
import * as bcrypt from 'bcrypt'
import type { Redis } from 'ioredis'
import type { DeepPartial, Repository } from 'typeorm'
import type { EmailService } from '../../../core/email/email.service'
import { MarketplaceCustomer } from '../entities/marketplace-customer.entity'
import type { MarketplaceCustomerSession } from './interfaces/marketplace-customer.interface'

interface RegisterDto {
  email: string
  password: string
  firstName: string
  lastName: string
  phone?: string
  acceptMarketing?: boolean
}

interface LoginDto {
  email: string
  password: string
  rememberMe?: boolean
}

interface JwtPayload {
  sub: string
  email: string
  type: 'marketplace_customer'
  tenantId: string
  iat?: number
  exp?: number
}

interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

interface ResetPasswordDto {
  token: string
  newPassword: string
}

@Injectable()
export class MarketplaceAuthService {
  private readonly logger = new Logger(MarketplaceAuthService.name)
  private readonly jwtSecret: string
  private readonly jwtExpiresIn: string
  private readonly refreshTokenExpiresIn: string
  private readonly resetTokenExpiresIn: number = 3600 // 1 hour
  private readonly maxLoginAttempts: number = 5
  private readonly lockoutDuration: number = 900 // 15 minutes

  constructor(
    @InjectRepository(MarketplaceCustomer)
    private readonly customerRepository: Repository<MarketplaceCustomer>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2,
    @InjectRedis() private readonly redisService: Redis,
    private readonly emailService: EmailService
  ) {
    const jwtSecret =
      this.configService.get<string>('MARKETPLACE_JWT_SECRET') ||
      this.configService.get<string>('JWT_SECRET')

    // Security: Ensure JWT secret is always defined
    if (!jwtSecret) {
      throw new Error(
        'MARKETPLACE_JWT_SECRET or JWT_SECRET must be defined in environment variables'
      )
    }

    this.jwtSecret = jwtSecret

    // Validate JWT secret strength
    if (this.jwtSecret.length < 32) {
      throw new Error('JWT secret must be at least 32 characters long')
    }

    this.jwtExpiresIn = this.configService.get<string>('MARKETPLACE_JWT_EXPIRY') || '1h'
    this.refreshTokenExpiresIn =
      this.configService.get<string>('MARKETPLACE_REFRESH_TOKEN_EXPIRY') || '7d'
  }

  /**
   * Register a new marketplace customer
   */
  async register(data: RegisterDto, tenantId: string): Promise<AuthTokens> {
    // Validate email format
    if (!this.isValidEmail(data.email)) {
      throw new BadRequestException('Invalid email format')
    }

    // Check if email already exists
    const existingCustomer = await this.customerRepository.findOne({
      where: { email: data.email.toLowerCase(), tenantId },
    })

    if (existingCustomer) {
      throw new BadRequestException('Email already registered')
    }

    // Validate password strength
    this.validatePasswordStrength(data.password)

    // Hash password with salt (configurable rounds)
    const saltRounds = this.configService.get<number>('BCRYPT_SALT_ROUNDS') || 12
    const salt = await bcrypt.genSalt(saltRounds)
    const hashedPassword = await bcrypt.hash(data.password, salt)

    // Create customer (aligned with entity)
    const customerData: DeepPartial<MarketplaceCustomer> = {
      email: data.email.toLowerCase(),
      passwordHash: hashedPassword,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      acceptMarketing: data.acceptMarketing || false,
      isActive: true,
      emailVerified: false,
      tenantId,
      metadata: {
        registeredAt: new Date(),
        registrationIp: undefined, // Should be passed from request context
        lastLoginAt: new Date(),
      },
    }

    const customer = this.customerRepository.create(customerData)

    const savedCustomer = (await this.customerRepository.save(customer)) as MarketplaceCustomer

    // Generate email verification token
    const verificationToken = await this.generateVerificationToken(savedCustomer.id)

    // Send welcome email with verification link
    await this.sendWelcomeEmail(savedCustomer, verificationToken)

    // Generate auth tokens
    const tokens = await this.generateAuthTokens(savedCustomer, tenantId)

    // Emit registration event
    this.eventEmitter.emit('marketplace.customer.registered', {
      customerId: savedCustomer.id,
      email: savedCustomer.email,
      tenantId,
    })

    this.logger.log(`New customer registered: ${savedCustomer.email}`)

    return tokens
  }

  /**
   * Login marketplace customer
   */
  async login(data: LoginDto, tenantId: string): Promise<AuthTokens> {
    const email = data.email.toLowerCase()

    // Check rate limiting
    const isLocked = await this.isAccountLocked(email)
    if (isLocked) {
      throw new UnauthorizedException('Account temporarily locked due to too many failed attempts')
    }

    // Find customer
    const customer = await this.customerRepository.findOne({
      where: { email, tenantId },
      select: ['id', 'email', 'passwordHash', 'isActive', 'emailVerified', 'firstName', 'lastName'],
    })

    // Timing attack mitigation: always compare password even if customer doesn't exist
    const dummyHash = '$2b$12$dummy.hash.to.prevent.timing.attacks.on.nonexistent.users'
    const passwordToCheck = customer?.passwordHash || dummyHash
    const isPasswordValid = await bcrypt.compare(data.password, passwordToCheck)

    if (!customer || !isPasswordValid) {
      await this.recordFailedAttempt(email)
      throw new UnauthorizedException('Invalid credentials')
    }

    // Check if account is active
    if (!customer.isActive) {
      throw new UnauthorizedException('Account is deactivated')
    }

    // Clear failed attempts
    await this.clearFailedAttempts(email)

    // Update last login
    customer.metadata = {
      ...customer.metadata,
      lastLoginAt: new Date(),
    }
    await this.customerRepository.save(customer)

    // Generate tokens
    const tokens = await this.generateAuthTokens(customer, tenantId, data.rememberMe)

    // Emit login event
    this.eventEmitter.emit('marketplace.customer.login', {
      customerId: customer.id,
      email: customer.email,
      tenantId,
    })

    return tokens
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    try {
      // Verify refresh token
      const payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: this.jwtSecret,
      })

      // Check if refresh token exists in Redis
      const storedToken = await this.redisService.get(`refresh_token:${payload.sub}`)
      if (!storedToken || storedToken !== refreshToken) {
        throw new UnauthorizedException('Invalid refresh token')
      }

      // Find customer
      const customer = await this.customerRepository.findOne({
        where: { id: payload.sub },
      })

      if (!customer || !customer.isActive) {
        throw new UnauthorizedException('Customer not found or inactive')
      }

      // Generate new tokens
      return await this.generateAuthTokens(customer, payload.tenantId)
    } catch (_error) {
      throw new UnauthorizedException('Invalid refresh token')
    }
  }

  /**
   * Logout customer
   */
  async logout(customerId: string): Promise<void> {
    // Remove refresh token from Redis
    await this.redisService.del(`refresh_token:${customerId}`)

    // Remove all active sessions
    const sessionKeys = await this.redisService.keys(`session:${customerId}:*`)
    if (sessionKeys.length > 0) {
      await this.redisService.del(...sessionKeys)
    }

    this.logger.log(`Customer ${customerId} logged out`)
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string, tenantId: string): Promise<void> {
    const customer = await this.customerRepository.findOne({
      where: { email: email.toLowerCase(), tenantId },
    })

    if (!customer) {
      // Don't reveal if email exists
      return
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex')
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex')

    // Store token in Redis with expiration
    await this.redisService.setex(
      `reset_token:${hashedToken}`,
      this.resetTokenExpiresIn,
      customer.id
    )

    // Send reset email
    await this.emailService.sendEmail({
      to: customer.email,
      subject: 'Notification Marketplace',
      template: 'marketplace-password-reset',
      context: {
        firstName: customer.firstName,
        resetLink: `${this.configService.get('MARKETPLACE_URL')}/reset-password?token=${resetToken}`,
        expiresIn: '1 hour',
      },
    })

    // Emit event
    this.eventEmitter.emit('marketplace.password.reset.requested', {
      customerId: customer.id,
      email: customer.email,
    })
  }

  /**
   * Reset password with token
   */
  async resetPassword(data: ResetPasswordDto): Promise<void> {
    // Hash the token to match stored version
    const hashedToken = crypto.createHash('sha256').update(data.token).digest('hex')

    // Get customer ID from Redis
    const customerId = await this.redisService.get(`reset_token:${hashedToken}`)

    if (!customerId) {
      throw new BadRequestException('Invalid or expired reset token')
    }

    // Validate new password
    this.validatePasswordStrength(data.newPassword)

    // Find customer
    const customer = await this.customerRepository.findOne({
      where: { id: customerId },
    })

    if (!customer) {
      throw new BadRequestException('Customer not found')
    }

    // Hash new password with configurable rounds
    const saltRounds = this.configService.get<number>('BCRYPT_SALT_ROUNDS') || 12
    const salt = await bcrypt.genSalt(saltRounds)
    const hashedPassword = await bcrypt.hash(data.newPassword, salt)

    // Update password (aligned with entity)
    customer.passwordHash = hashedPassword
    customer.metadata = {
      ...customer.metadata,
      passwordChangedAt: new Date(),
    }
    await this.customerRepository.save(customer)

    // Delete reset token
    await this.redisService.del(`reset_token:${hashedToken}`)

    // Invalidate all existing sessions
    await this.logout(customer.id)

    // Send confirmation email
    await this.emailService.sendEmail({
      to: customer.email,
      subject: 'Notification Marketplace',
      template: 'marketplace-password-changed',
      context: {
        firstName: customer.firstName,
      },
    })

    // Emit event
    this.eventEmitter.emit('marketplace.password.reset.completed', {
      customerId: customer.id,
      email: customer.email,
    })
  }

  /**
   * Verify email with token
   */
  async verifyEmail(token: string): Promise<void> {
    const customerId = await this.redisService.get(`verify_token:${token}`)

    if (!customerId) {
      throw new BadRequestException('Invalid or expired verification token')
    }

    const customer = await this.customerRepository.findOne({
      where: { id: customerId },
    })

    if (!customer) {
      throw new BadRequestException('Customer not found')
    }

    customer.emailVerified = true
    customer.metadata = {
      ...customer.metadata,
      verifiedAt: new Date(),
    }
    await this.customerRepository.save(customer)

    // Delete verification token
    await this.redisService.del(`verify_token:${token}`)

    // Send confirmation email
    await this.emailService.sendEmail({
      to: customer.email,
      subject: 'Notification Marketplace',
      template: 'marketplace-email-verified',
      context: {
        firstName: customer.firstName,
      },
    })
  }

  /**
   * Private helper methods
   */
  private async generateAuthTokens(
    customer: MarketplaceCustomer,
    tenantId: string,
    rememberMe: boolean = false
  ): Promise<AuthTokens> {
    const payload: JwtPayload = {
      sub: customer.id,
      email: customer.email,
      type: 'marketplace_customer',
      tenantId,
    }

    // Generate access token
    const accessToken = this.jwtService.sign(payload, {
      secret: this.jwtSecret,
      expiresIn: this.jwtExpiresIn,
    })

    // Generate refresh token with longer expiry
    const refreshTokenExpiry = rememberMe ? '30d' : this.refreshTokenExpiresIn
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.jwtSecret,
      expiresIn: refreshTokenExpiry,
    })

    // Store refresh token in Redis
    const ttl = rememberMe ? 2592000 : 604800 // 30 days or 7 days in seconds
    await this.redisService.setex(`refresh_token:${customer.id}`, ttl, refreshToken)

    // Create session
    await this.createSession(customer.id, tenantId)

    return {
      accessToken,
      refreshToken,
      expiresIn: 3600, // 1 hour in seconds
    }
  }

  private async generateVerificationToken(customerId: string): Promise<string> {
    const token = crypto.randomBytes(32).toString('hex')

    // Store in Redis with 24 hour expiration
    await this.redisService.setex(`verify_token:${token}`, 86400, customerId)

    return token
  }

  private async createSession(customerId: string, tenantId: string): Promise<void> {
    const sessionId = crypto.randomBytes(16).toString('hex')
    const sessionData = {
      customerId,
      tenantId,
      createdAt: new Date(),
      lastActivity: new Date(),
    }

    // Store session with 1 hour expiration
    await this.redisService.setex(
      `session:${customerId}:${sessionId}`,
      3600,
      JSON.stringify(sessionData)
    )
  }

  private async isAccountLocked(email: string): Promise<boolean> {
    const attempts = await this.redisService.get(`failed_attempts:${email}`)
    return parseInt(attempts || '0', 10) >= this.maxLoginAttempts
  }

  private async recordFailedAttempt(email: string): Promise<void> {
    const key = `failed_attempts:${email}`
    const attempts = await this.redisService.incr(key)

    if (attempts === 1) {
      // Set expiration on first attempt
      await this.redisService.expire(key, this.lockoutDuration)
    }

    if (attempts >= this.maxLoginAttempts) {
      this.logger.warn(`Account locked for ${email} after ${attempts} failed attempts`)
    }
  }

  private async clearFailedAttempts(email: string): Promise<void> {
    await this.redisService.del(`failed_attempts:${email}`)
  }

  private validatePasswordStrength(password: string): void {
    if (password.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters long')
    }

    if (!/[A-Z]/.test(password)) {
      throw new BadRequestException('Password must contain at least one uppercase letter')
    }

    if (!/[a-z]/.test(password)) {
      throw new BadRequestException('Password must contain at least one lowercase letter')
    }

    if (!/[0-9]/.test(password)) {
      throw new BadRequestException('Password must contain at least one number')
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      throw new BadRequestException('Password must contain at least one special character')
    }
  }

  private isValidEmail(email: string): boolean {
    // Enhanced email validation
    const emailRegex =
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
    return emailRegex.test(email) && email.length <= 254
  }

  /**
   * Change password for authenticated customer
   */
  async changePassword(
    customerId: string,
    data: { currentPassword: string; newPassword: string }
  ): Promise<void> {
    const customer = await this.customerRepository.findOne({
      where: { id: customerId },
      select: ['id', 'passwordHash', 'email', 'firstName'],
    })

    if (!customer) {
      throw new BadRequestException('Customer not found')
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(data.currentPassword, customer.passwordHash)
    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Current password is incorrect')
    }

    // Validate new password strength
    this.validatePasswordStrength(data.newPassword)

    // Hash new password
    const saltRounds = this.configService.get<number>('BCRYPT_SALT_ROUNDS') || 12
    const salt = await bcrypt.genSalt(saltRounds)
    const hashedPassword = await bcrypt.hash(data.newPassword, salt)

    // Update password
    customer.passwordHash = hashedPassword
    customer.metadata = {
      ...customer.metadata,
      passwordChangedAt: new Date(),
    }
    await this.customerRepository.save(customer)

    // Invalidate all existing sessions
    await this.logout(customer.id)

    // Send confirmation email
    await this.emailService.sendEmail({
      to: customer.email,
      subject: 'Notification Marketplace',
      template: 'marketplace-password-changed',
      context: {
        firstName: customer.firstName,
        changeTime: new Date().toISOString(),
      },
    })

    // Emit event
    this.eventEmitter.emit('marketplace.password.changed', {
      customerId: customer.id,
      email: customer.email,
    })
  }

  /**
   * Resend email verification
   */
  async resendVerificationEmail(customerId: string): Promise<void> {
    const customer = await this.customerRepository.findOne({
      where: { id: customerId },
    })

    if (!customer) {
      throw new BadRequestException('Customer not found')
    }

    if (customer.emailVerified) {
      throw new BadRequestException('Email is already verified')
    }

    // Check rate limiting for verification emails
    const rateLimitKey = `verify_email_rate_limit:${customer.email}`
    const attempts = await this.redisService.get(rateLimitKey)

    if (parseInt(attempts || '0', 10) >= 3) {
      throw new BadRequestException(
        'Too many verification emails sent. Please try again in 1 hour.'
      )
    }

    // Generate new verification token
    const verificationToken = await this.generateVerificationToken(customer.id)

    // Send verification email
    await this.emailService.sendEmail({
      to: customer.email,
      subject: 'Notification Marketplace',
      template: 'marketplace-email-verification',
      context: {
        firstName: customer.firstName,
        verificationLink: `${this.configService.get('MARKETPLACE_URL')}/verify-email?token=${verificationToken}`,
      },
    })

    // Update rate limit
    await this.redisService.incr(rateLimitKey)
    await this.redisService.expire(rateLimitKey, 3600) // 1 hour

    this.logger.log(`Verification email resent to ${customer.email}`)
  }

  /**
   * Get customer by ID
   */
  async getCustomerById(customerId: string): Promise<MarketplaceCustomer> {
    const customer = await this.customerRepository.findOne({
      where: { id: customerId, isActive: true },
    })

    if (!customer) {
      throw new UnauthorizedException('Customer not found')
    }

    return customer
  }

  /**
   * Get active sessions for customer
   */
  async getActiveSessions(customerId: string): Promise<MarketplaceCustomerSession[]> {
    const sessionKeys = await this.redisService.keys(`session:${customerId}:*`)
    const sessions: MarketplaceCustomerSession[] = []

    for (const key of sessionKeys) {
      const sessionData = await this.redisService.get(key)
      if (sessionData) {
        sessions.push({
          id: key.split(':').pop(),
          ...JSON.parse(sessionData),
          isCurrentSession: false, // To be set by calling service
        })
      }
    }

    return sessions
  }

  private async sendWelcomeEmail(
    customer: MarketplaceCustomer,
    verificationToken: string
  ): Promise<void> {
    await this.emailService.sendEmail({
      to: customer.email,
      subject: 'Notification Marketplace',
      template: 'marketplace-welcome',
      context: {
        firstName: customer.firstName,
        verificationLink: `${this.configService.get('MARKETPLACE_URL')}/verify-email?token=${verificationToken}`,
      },
    })
  }
}
