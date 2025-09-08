import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import * as bcrypt from 'bcrypt'
import { MoreThan, type Repository } from 'typeorm'
import type { EmailService } from '../../email/email.service'
import { type CustomerAddress, MarketplaceCustomer } from '../entities/marketplace-customer.entity'

export interface CreateCustomerDto {
  email: string
  firstName?: string
  lastName?: string
  company?: string
  phone?: string
  hasAccount: boolean
  password?: string
  addresses?: CustomerAddress[]
  preferences?: Partial<MarketplaceCustomer['preferences']>
}

export interface UpdateCustomerDto {
  firstName?: string
  lastName?: string
  company?: string
  phone?: string
  addresses?: CustomerAddress[]
  preferences?: Partial<MarketplaceCustomer['preferences']>
}

export interface CustomerLoginDto {
  email: string
  password: string
}

@Injectable()
export class MarketplaceCustomersService {
  constructor(
    @InjectRepository(MarketplaceCustomer, 'marketplace')
    private customerRepo: Repository<MarketplaceCustomer>,
    private emailService: EmailService
  ) {}

  async createCustomer(
    societeId: string,
    createDto: CreateCustomerDto
  ): Promise<MarketplaceCustomer> {
    // Vérifier si email existe déjà
    const existingCustomer = await this.customerRepo.findOne({
      where: { societeId, email: createDto.email },
    })

    if (existingCustomer) {
      throw new ConflictException('Un client avec cet email existe déjà')
    }

    // Valider données
    this.validateCustomerData(createDto)

    const customer = this.customerRepo.create({
      societeId,
      email: createDto.email.toLowerCase(),
      firstName: createDto.firstName,
      lastName: createDto.lastName,
      company: createDto.company,
      phone: createDto.phone,
      hasAccount: createDto.hasAccount,
      addresses: createDto.addresses || [],
      preferences: {
        language: 'fr',
        currency: 'EUR',
        newsletter: false,
        notifications: {
          orderUpdates: true,
          promotions: false,
          newProducts: false,
        },
        ...createDto.preferences,
      },
      metadata: {
        source: 'marketplace',
        loginCount: 0,
      },
    })

    // Hash password si compte avec authentification
    if (createDto.hasAccount && createDto.password) {
      customer.passwordHash = await bcrypt.hash(createDto.password, 12)
      customer.emailVerified = false // Nécessite vérification email
    }

    const savedCustomer = await this.customerRepo.save(customer)

    // Envoyer email de vérification si compte créé
    if (createDto.hasAccount) {
      const verificationToken = this.emailService.generateSecureToken()
      const hashedToken = this.emailService.hashToken(verificationToken)

      // Stocker le token de vérification
      savedCustomer.emailVerificationToken = hashedToken
      savedCustomer.emailVerificationExpires = new Date(Date.now() + 24 * 3600000) // 24 heures
      await this.customerRepo.save(savedCustomer)

      // Envoyer l'email
      await this.emailService.sendVerificationEmail({
        email: savedCustomer.email,
        token: verificationToken,
        expiresAt: savedCustomer.emailVerificationExpires,
        type: 'email-verification',
        userId: savedCustomer.id,
        metadata: {
          societeId,
          customerName: `${savedCustomer.firstName || ''} ${savedCustomer.lastName || ''}`.trim(),
        },
      })
    }

    return savedCustomer
  }

  async createGuestCustomer(
    societeId: string,
    email: string,
    orderData?: Partial<CreateCustomerDto>
  ): Promise<MarketplaceCustomer> {
    const customer = this.customerRepo.create({
      societeId,
      email: email.toLowerCase(),
      firstName: orderData?.firstName,
      lastName: orderData?.lastName,
      company: orderData?.company,
      phone: orderData?.phone,
      hasAccount: false,
      addresses: orderData?.addresses || [],
      preferences: {
        language: 'fr',
        currency: 'EUR',
        newsletter: false,
        notifications: {
          orderUpdates: true,
          promotions: false,
          newProducts: false,
        },
      },
      metadata: {
        source: 'marketplace',
        loginCount: 0,
      },
    })

    return await this.customerRepo.save(customer)
  }

  async updateCustomer(
    customerId: string,
    societeId: string,
    updateDto: UpdateCustomerDto
  ): Promise<MarketplaceCustomer> {
    const customer = await this.customerRepo.findOne({
      where: { id: customerId, societeId },
    })

    if (!customer) {
      throw new NotFoundException('Client non trouvé')
    }

    Object.assign(customer, updateDto)

    return await this.customerRepo.save(customer)
  }

  async findByEmail(societeId: string, email: string): Promise<MarketplaceCustomer | null> {
    return await this.customerRepo.findOne({
      where: { societeId, email: email.toLowerCase() },
    })
  }

  async findById(customerId: string, societeId: string): Promise<MarketplaceCustomer> {
    const customer = await this.customerRepo.findOne({
      where: { id: customerId, societeId },
      relations: ['orders'],
    })

    if (!customer) {
      throw new NotFoundException('Client non trouvé')
    }

    return customer
  }

  async authenticateCustomer(
    societeId: string,
    loginDto: CustomerLoginDto
  ): Promise<MarketplaceCustomer> {
    const customer = await this.customerRepo.findOne({
      where: {
        societeId,
        email: loginDto.email.toLowerCase(),
        hasAccount: true,
        isActive: true,
      },
    })

    if (!customer) {
      throw new NotFoundException('Identifiants invalides')
    }

    if (!customer.canLogin()) {
      throw new BadRequestException('Compte non activé ou email non vérifié')
    }

    if (!customer.passwordHash) {
      throw new BadRequestException('Compte non configuré')
    }
    const isPasswordValid = await bcrypt.compare(loginDto.password, customer.passwordHash)
    if (!isPasswordValid) {
      throw new BadRequestException('Identifiants invalides')
    }

    // Mettre à jour dernière connexion
    customer.lastLoginAt = new Date()
    if (customer.metadata) {
      customer.metadata.loginCount = (customer.metadata.loginCount || 0) + 1
      customer.metadata.lastLogin = new Date().toISOString()
    }

    await this.customerRepo.save(customer)

    return customer
  }

  async addAddress(
    customerId: string,
    societeId: string,
    address: Omit<CustomerAddress, 'id'>
  ): Promise<MarketplaceCustomer> {
    const customer = await this.findById(customerId, societeId)

    const newAddress: CustomerAddress = {
      ...address,
      id: this.generateAddressId(),
    }

    // Si c'est la première adresse du type, la marquer comme default
    const existingAddressesOfType = customer.addresses.filter((addr) => addr.type === address.type)
    if (existingAddressesOfType.length === 0) {
      newAddress.isDefault = true
    }

    // Si marked as default, remove default from others of same type
    if (newAddress.isDefault) {
      customer.addresses = customer.addresses.map((addr) =>
        addr.type === address.type ? { ...addr, isDefault: false } : addr
      )
    }

    customer.addresses.push(newAddress)

    return await this.customerRepo.save(customer)
  }

  async updateAddress(
    customerId: string,
    societeId: string,
    addressId: string,
    updates: Partial<CustomerAddress>
  ): Promise<MarketplaceCustomer> {
    const customer = await this.findById(customerId, societeId)

    const addressIndex = customer.addresses.findIndex((addr) => addr.id === addressId)
    if (addressIndex === -1) {
      throw new NotFoundException('Adresse non trouvée')
    }

    const updatedAddress = { ...customer.addresses[addressIndex], ...updates }

    // Si marked as default, remove default from others of same type
    if (updatedAddress.isDefault) {
      customer.addresses = customer.addresses.map((addr, index) =>
        index !== addressIndex && addr.type === updatedAddress.type
          ? { ...addr, isDefault: false }
          : addr
      )
    }

    customer.addresses[addressIndex] = updatedAddress

    return await this.customerRepo.save(customer)
  }

  async removeAddress(
    customerId: string,
    societeId: string,
    addressId: string
  ): Promise<MarketplaceCustomer> {
    const customer = await this.findById(customerId, societeId)

    const addressIndex = customer.addresses.findIndex((addr) => addr.id === addressId)
    if (addressIndex === -1) {
      throw new NotFoundException('Adresse non trouvée')
    }

    const removedAddress = customer.addresses[addressIndex]
    customer.addresses.splice(addressIndex, 1)

    // Si c'était l'adresse par défaut, marquer la première restante comme défaut
    if (removedAddress.isDefault) {
      const remainingAddressesOfType = customer.addresses.filter(
        (addr) => addr.type === removedAddress.type
      )
      if (remainingAddressesOfType.length > 0) {
        const firstRemaining = customer.addresses.find((addr) => addr.type === removedAddress.type)
        if (firstRemaining) {
          firstRemaining.isDefault = true
        }
      }
    }

    return await this.customerRepo.save(customer)
  }

  async convertGuestToAccount(
    customerId: string,
    societeId: string,
    password: string,
    firstName?: string,
    lastName?: string
  ): Promise<MarketplaceCustomer> {
    const customer = await this.findById(customerId, societeId)

    if (customer.hasAccount) {
      throw new ConflictException('Client a déjà un compte')
    }

    customer.hasAccount = true
    customer.passwordHash = await bcrypt.hash(password, 12)
    customer.emailVerified = false

    if (firstName) customer.firstName = firstName
    if (lastName) customer.lastName = lastName

    return await this.customerRepo.save(customer)
  }

  async updatePassword(
    customerId: string,
    societeId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const customer = await this.findById(customerId, societeId)

    if (!customer.hasAccount || !customer.passwordHash) {
      throw new BadRequestException("Client n'a pas de compte")
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, customer.passwordHash)
    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Mot de passe actuel incorrect')
    }

    customer.passwordHash = await bcrypt.hash(newPassword, 12)
    await this.customerRepo.save(customer)
  }

  async requestPasswordReset(societeId: string, email: string): Promise<void> {
    const customer = await this.findByEmail(societeId, email)

    if (!customer || !customer.hasAccount) {
      // Ne pas révéler si l'email existe ou non pour la sécurité
      return
    }

    // Générer un token sécurisé
    const resetToken = this.emailService.generateSecureToken()
    const hashedToken = this.emailService.hashToken(resetToken)

    // Stocker le hash du token dans la base de données
    customer.resetPasswordToken = hashedToken
    customer.resetPasswordExpires = new Date(Date.now() + 3600000) // 1 heure

    await this.customerRepo.save(customer)

    // Envoyer l'email avec le token original (non hashé)
    await this.emailService.sendPasswordResetEmail({
      email: customer.email,
      token: resetToken,
      expiresAt: customer.resetPasswordExpires,
      type: 'password-reset',
      userId: customer.id,
      metadata: {
        societeId,
        customerName: `${customer.firstName || ''} ${customer.lastName || ''}`.trim(),
      },
    })
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    // Hasher le token fourni pour le comparer avec celui en base
    const hashedToken = this.emailService.hashToken(token)

    const customer = await this.customerRepo.findOne({
      where: {
        resetPasswordToken: hashedToken,
        resetPasswordExpires: MoreThan(new Date()),
      },
    })

    if (!customer) {
      throw new BadRequestException('Token de réinitialisation invalide ou expiré')
    }

    customer.passwordHash = await bcrypt.hash(newPassword, 12)
    customer.resetPasswordToken = null
    customer.resetPasswordExpires = null

    await this.customerRepo.save(customer)
  }

  private validateCustomerData(data: CreateCustomerDto): void {
    if (!data.email || !this.isValidEmail(data.email)) {
      throw new BadRequestException('Email invalide')
    }

    if (data.hasAccount && !data.password) {
      throw new BadRequestException('Mot de passe requis pour les comptes')
    }

    if (data.password && data.password.length < 8) {
      throw new BadRequestException('Mot de passe doit contenir au moins 8 caractères')
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  private generateAddressId(): string {
    return `addr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}
