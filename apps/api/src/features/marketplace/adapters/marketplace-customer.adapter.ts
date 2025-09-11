import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import type { Repository } from 'typeorm'
import {
  Partner,
  PartnerCategory,
  PartnerStatus,
  PartnerType,
} from '../../../domains/partners/entities/partner.entity'
import { MarketplaceCustomer } from '../entities/marketplace-customer.entity'

interface PartnerAdditionalData {
  category?: string
  adresse?: string
  codePostal?: string
  ville?: string
  pays?: string
  siret?: string
  numeroTVA?: string
  [key: string]: unknown
}

export interface MarketplaceCustomerView {
  id: string
  email: string
  firstName: string
  lastName: string
  phone?: string
  isActive: boolean
  emailVerified: boolean
  acceptMarketing: boolean
  tenantId: string
  // ❌ erpPartnerId supprimé - donnée interne sensible
  // ERP Partner data (non sensibles uniquement)
  partnerCode?: string
  denomination?: string
  // ❌ siret et numeroTVA supprimés - données sensibles
  adresse?: string
  codePostal?: string
  ville?: string
  pays?: string
  // Marketplace specific
  totalOrders: number
  totalSpent: number
  customerGroup?: string
  loyaltyTier?: string
  loyaltyPoints: number
  lastOrderDate?: Date
  createdAt: Date
  updatedAt: Date
}

export interface CreateMarketplaceCustomerDto {
  email: string
  passwordHash: string
  firstName: string
  lastName: string
  phone?: string
  acceptMarketing?: boolean
  // Address info for ERP Partner creation
  adresse?: string
  codePostal?: string
  ville?: string
  pays?: string
  siret?: string
  numeroTVA?: string
  category?: PartnerCategory
}

export interface SyncCustomerToPartnerDto {
  customerId: string
  createPartner?: boolean
  partnerData?: {
    // ❌ siret et numeroTVA gérés séparément avec permissions
    adresse?: string
    codePostal?: string
    ville?: string
    pays?: string
    category?: PartnerCategory
  }
}

// Interface séparée pour les données sensibles (accès restreint)
export interface SensitivePartnerData {
  siret?: string
  numeroTVA?: string
}

/**
 * Adapter pour synchroniser les clients marketplace avec les partenaires ERP
 * Assure la cohérence entre MarketplaceCustomer et Partner
 */
@Injectable()
export class MarketplaceCustomerAdapter {
  private readonly logger = new Logger(MarketplaceCustomerAdapter.name)

  constructor(
    @InjectRepository(MarketplaceCustomer)
    private readonly customerRepository: Repository<MarketplaceCustomer>,
    @InjectRepository(Partner)
    private readonly partnerRepository: Repository<Partner>
  ) {}

  /**
   * Créer un client marketplace avec synchronisation ERP
   */
  async createMarketplaceCustomer(
    tenantId: string,
    customerData: CreateMarketplaceCustomerDto
  ): Promise<MarketplaceCustomerView> {
    try {
      // Vérifier si l'email existe déjà
      const existingCustomer = await this.customerRepository.findOne({
        where: { email: customerData.email },
      })

      if (existingCustomer) {
        throw new Error(`Customer with email ${customerData.email} already exists`)
      }

      // Créer le client marketplace
      const customer = this.customerRepository.create({
        ...customerData,
        tenantId,
        isActive: true,
        emailVerified: false,
        acceptMarketing: customerData.acceptMarketing || false,
        totalOrders: 0,
        totalSpent: 0,
        loyaltyPoints: 0,
      })

      const savedCustomer = await this.customerRepository.save(customer)

      // Créer automatiquement le partenaire ERP associé
      const partner = await this.createPartnerFromCustomer(
        tenantId,
        savedCustomer,
        customerData as unknown as PartnerAdditionalData
      )

      // Lier le client au partenaire
      savedCustomer.erpPartnerId = partner.id
      await this.customerRepository.save(savedCustomer)

      return await this.getMarketplaceCustomerView(tenantId, savedCustomer.id)
    } catch (error) {
      this.logger.error('Failed to create marketplace customer:', error)
      throw error
    }
  }

  /**
   * Obtenir un client marketplace avec données ERP
   */
  async getMarketplaceCustomerView(
    _tenantId: string,
    customerId: string
  ): Promise<MarketplaceCustomerView> {
    const customer = await this.customerRepository.findOne({
      where: { id: customerId },
      relations: ['erpPartner'],
    })

    if (!customer) {
      throw new NotFoundException(`Customer ${customerId} not found`)
    }

    return this.customerToView(customer)
  }

  /**
   * Obtenir un client marketplace par email
   */
  async getMarketplaceCustomerByEmail(
    _tenantId: string,
    email: string
  ): Promise<MarketplaceCustomerView | null> {
    const customer = await this.customerRepository.findOne({
      where: { email },
      relations: ['erpPartner'],
    })

    return customer ? this.customerToView(customer) : null
  }

  /**
   * Synchroniser un client existant avec un partenaire ERP
   */
  async syncCustomerToPartner(
    tenantId: string,
    syncData: SyncCustomerToPartnerDto
  ): Promise<MarketplaceCustomerView> {
    try {
      const customer = await this.customerRepository.findOne({
        where: { id: syncData.customerId },
      })

      if (!customer) {
        throw new NotFoundException(`Customer ${syncData.customerId} not found`)
      }

      let partner: Partner

      if (customer.erpPartnerId) {
        // Partenaire existant - mettre à jour
        const existingPartner = await this.partnerRepository.findOne({
          where: { id: customer.erpPartnerId },
        })

        if (!existingPartner) {
          throw new NotFoundException(`Partner ${customer.erpPartnerId} not found`)
        }

        partner = existingPartner

        if (syncData.partnerData) {
          Object.assign(partner, syncData.partnerData)
          partner = await this.partnerRepository.save(partner)
        }
      } else if (syncData.createPartner) {
        // Créer un nouveau partenaire
        partner = await this.createPartnerFromCustomer(
          tenantId,
          customer,
          syncData.partnerData || {}
        )

        // Lier le client au partenaire
        customer.erpPartnerId = partner.id
        await this.customerRepository.save(customer)
      } else {
        throw new Error('Customer has no ERP partner and createPartner is false')
      }

      return await this.getMarketplaceCustomerView(tenantId, customer.id)
    } catch (error) {
      this.logger.error('Failed to sync customer to partner:', error)
      throw error
    }
  }

  /**
   * Mettre à jour les statistiques du client (commandes, montant)
   */
  async updateCustomerStats(
    tenantId: string,
    customerId: string,
    stats: {
      totalOrders?: number
      totalSpent?: number
      loyaltyPoints?: number
      lastOrderDate?: Date
      customerGroup?: string
      loyaltyTier?: string
    }
  ): Promise<void> {
    await this.customerRepository.update(
      { id: customerId, tenantId },
      { ...stats, updatedAt: new Date() }
    )
  }

  /**
   * Obtenir tous les clients marketplace avec pagination
   */
  async getMarketplaceCustomers(
    tenantId: string,
    options: {
      page?: number
      limit?: number
      search?: string
      isActive?: boolean
      hasErpPartner?: boolean
    } = {}
  ): Promise<{
    customers: MarketplaceCustomerView[]
    total: number
    page: number
    limit: number
    totalPages: number
  }> {
    const { page = 1, limit = 20, search, isActive, hasErpPartner } = options

    const queryBuilder = this.customerRepository
      .createQueryBuilder('customer')
      .leftJoinAndSelect('customer.erpPartner', 'partner')
      .where('customer.tenantId = :tenantId', { tenantId })

    if (search) {
      queryBuilder.andWhere(
        '(customer.firstName ILIKE :search OR customer.lastName ILIKE :search OR customer.email ILIKE :search)',
        { search: `%${search}%` }
      )
    }

    if (isActive !== undefined) {
      queryBuilder.andWhere('customer.isActive = :isActive', { isActive })
    }

    if (hasErpPartner !== undefined) {
      if (hasErpPartner) {
        queryBuilder.andWhere('customer.erpPartnerId IS NOT NULL')
      } else {
        queryBuilder.andWhere('customer.erpPartnerId IS NULL')
      }
    }

    const total = await queryBuilder.getCount()

    queryBuilder
      .orderBy('customer.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)

    const customers = await queryBuilder.getMany()

    return {
      customers: customers.map((customer) => this.customerToView(customer)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  }

  /**
   * Créer un partenaire ERP à partir d'un client marketplace
   */
  private async createPartnerFromCustomer(
    _tenantId: string,
    customer: MarketplaceCustomer,
    additionalData: PartnerAdditionalData = {}
  ): Promise<Partner> {
    // Générer un code unique pour le partenaire
    const baseCode = `CLI${Date.now().toString().slice(-6)}`
    let code = baseCode
    let counter = 1

    while (await this.partnerRepository.findOne({ where: { code } })) {
      code = `${baseCode}${counter.toString().padStart(2, '0')}`
      counter++
    }

    const partner = this.partnerRepository.create({
      code,
      type: PartnerType.CLIENT,
      status: PartnerStatus.ACTIF,
      category: (additionalData.category as PartnerCategory) || PartnerCategory.PARTICULIER,
      denomination: `${customer.firstName} ${customer.lastName}`,
      contactPrincipal: `${customer.firstName} ${customer.lastName}`,
      email: customer.email,
      telephone: customer.phone,
      adresse: additionalData.adresse,
      codePostal: additionalData.codePostal,
      ville: additionalData.ville,
      pays: additionalData.pays || 'France',
      siret: additionalData.siret,
      numeroTVA: additionalData.numeroTVA,
      // Conditions par défaut pour les clients marketplace
      conditionsPaiement: '30J',
      modePaiement: 'CARTE',
      notes: {
        commentaires: 'Client créé automatiquement depuis le marketplace',
        tagsPersonnalises: ['marketplace', 'client-web'],
      },
    })

    return (await this.partnerRepository.save(partner)) as unknown as Partner
  }

  /**
   * Transformer un MarketplaceCustomer en vue avec données ERP (sécurisée)
   */
  private customerToView(customer: MarketplaceCustomer): MarketplaceCustomerView {
    const partner = customer.erpPartner

    return {
      id: customer.id,
      email: customer.email,
      firstName: customer.firstName,
      lastName: customer.lastName,
      phone: customer.phone,
      isActive: customer.isActive,
      emailVerified: customer.emailVerified,
      acceptMarketing: customer.acceptMarketing,
      tenantId: customer.tenantId,
      // ❌ NE JAMAIS exposer erpPartnerId (donnée interne)
      // Données du partenaire ERP (non sensibles uniquement)
      partnerCode: partner?.code,
      denomination: partner?.denomination,
      // ❌ SIRET et TVA sont des données sensibles - à filtrer selon permissions
      // siret: partner?.siret,
      // numeroTVA: partner?.numeroTVA,
      adresse: partner?.adresse,
      codePostal: partner?.codePostal,
      ville: partner?.ville,
      pays: partner?.pays,
      // Données marketplace publiques
      totalOrders: customer.totalOrders,
      totalSpent: customer.totalSpent,
      customerGroup: customer.customerGroup,
      loyaltyTier: customer.loyaltyTier,
      loyaltyPoints: customer.loyaltyPoints,
      lastOrderDate: customer.lastOrderDate,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
    }
  }
}
