import { Injectable, Logger } from '@nestjs/common'
import { TenantPrismaService } from '../../../core/multi-tenant/tenant-prisma.service'
import type { SocieteLicense, Prisma } from '@prisma/client'

/**
 * SocieteLicensePrismaService - Phase 2.2
 *
 * Service pour gestion des licences de sociétés avec Prisma
 *
 * Fonctionnalités:
 * - CRUD Licences
 * - Gestion statut (active, expired, suspended, etc.)
 * - Features et restrictions (Json)
 * - Billing et facturation
 * - Validation nombre max utilisateurs
 */
@Injectable()
export class SocieteLicensePrismaService {
  private readonly logger = new Logger(SocieteLicensePrismaService.name)

  constructor(private readonly tenantPrisma: TenantPrismaService) {}

  /** Client Prisma avec filtrage automatique par tenant */
  private get prisma() {
    return this.tenantPrisma.client
  }

  /**
   * Créer une licence
   */
  async createLicense(data: {
    societeId: string
    type: string
    status: string
    maxUsers: number
    features: Record<string, any>
    restrictions?: Record<string, any>
    billing?: Record<string, any>
    startDate: Date
    endDate?: Date
  }): Promise<SocieteLicense> {
    this.logger.log(`Creating license for societe: ${data.societeId}`)

    try {
      const license = await this.prisma.societeLicense.create({
        data: {
          societeId: data.societeId,
          type: data.type,
          status: data.status,
          maxUsers: data.maxUsers,
          features: data.features as Prisma.InputJsonValue,
          restrictions: data.restrictions ? (data.restrictions as Prisma.InputJsonValue) : undefined,
          billing: data.billing ? (data.billing as Prisma.InputJsonValue) : undefined,
          startDate: data.startDate,
          endDate: data.endDate || null,
        },
      })

      this.logger.log(`License created: ${license.id}`)
      return license
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error creating license: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer une licence par ID
   */
  async getLicenseById(id: string): Promise<SocieteLicense | null> {
    this.logger.debug(`Getting license: ${id}`)

    try {
      return await this.prisma.societeLicense.findUnique({
        where: { id },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting license: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer la licence d'une societe
   */
  async getLicenseBySocieteId(societeId: string): Promise<SocieteLicense | null> {
    this.logger.debug(`Getting license for societe: ${societeId}`)

    try {
      return await this.prisma.societeLicense.findUnique({
        where: { societeId },
        include: {
          societe: {
            select: {
              id: true,
              code: true,
              name: true,
              isActive: true,
            },
          },
        },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting license by societe: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Mettre à jour une licence
   */
  async updateLicense(
    id: string,
    data: Partial<Omit<SocieteLicense, 'id' | 'societeId' | 'createdAt' | 'updatedAt'>> & {
      features?: Record<string, any>
      restrictions?: Record<string, any>
      billing?: Record<string, any>
    }
  ): Promise<SocieteLicense> {
    this.logger.log(`Updating license: ${id}`)

    try {
      const updateData: any = { ...data }

      // Convert objects to Prisma.InputJsonValue
      if (data.features) {
        updateData.features = data.features as Prisma.InputJsonValue
      }
      if (data.restrictions) {
        updateData.restrictions = data.restrictions as Prisma.InputJsonValue
      }
      if (data.billing) {
        updateData.billing = data.billing as Prisma.InputJsonValue
      }

      const license = await this.prisma.societeLicense.update({
        where: { id },
        data: updateData,
      })

      this.logger.log(`License updated: ${id}`)
      return license
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error updating license: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Mettre à jour le statut
   */
  async updateStatus(id: string, status: string): Promise<SocieteLicense> {
    this.logger.log(`Updating license status: ${id} -> ${status}`)

    return this.updateLicense(id, { status })
  }

  /**
   * Activer une licence
   */
  async activateLicense(id: string): Promise<SocieteLicense> {
    this.logger.log(`Activating license: ${id}`)

    return this.updateStatus(id, 'active')
  }

  /**
   * Suspendre une licence
   */
  async suspendLicense(id: string): Promise<SocieteLicense> {
    this.logger.log(`Suspending license: ${id}`)

    return this.updateStatus(id, 'suspended')
  }

  /**
   * Expirer une licence
   */
  async expireLicense(id: string): Promise<SocieteLicense> {
    this.logger.log(`Expiring license: ${id}`)

    return this.updateStatus(id, 'expired')
  }

  /**
   * Vérifier si une licence est valide
   */
  async isLicenseValid(societeId: string): Promise<boolean> {
    this.logger.debug(`Checking license validity for societe: ${societeId}`)

    try {
      const license = await this.getLicenseBySocieteId(societeId)

      if (!license) {
        return false
      }

      // Check status
      if (license.status !== 'active') {
        return false
      }

      // Check end date
      if (license.endDate && license.endDate < new Date()) {
        return false
      }

      return true
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error checking license validity: ${err.message}`, err.stack)
      return false
    }
  }

  /**
   * Vérifier si la limite d'utilisateurs est atteinte
   */
  async isUserLimitReached(societeId: string): Promise<boolean> {
    this.logger.debug(`Checking user limit for societe: ${societeId}`)

    try {
      const license = await this.getLicenseBySocieteId(societeId)

      if (!license) {
        throw new Error(`License not found for societe: ${societeId}`)
      }

      // Compter les utilisateurs actifs
      const activeUsers = await this.prisma.societeUser.count({
        where: {
          societeId,
          isActive: true,
        },
      })

      return activeUsers >= license.maxUsers
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error checking user limit: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer toutes les licences par statut
   */
  async getLicensesByStatus(status: string): Promise<SocieteLicense[]> {
    this.logger.debug(`Getting licenses with status: ${status}`)

    try {
      return await this.prisma.societeLicense.findMany({
        where: { status },
        include: {
          societe: {
            select: {
              id: true,
              code: true,
              name: true,
              isActive: true,
            },
          },
        },
        orderBy: { endDate: 'asc' },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting licenses by status: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer les licences qui expirent bientôt
   */
  async getExpiringLicenses(daysBeforeExpiry: number): Promise<SocieteLicense[]> {
    this.logger.debug(`Getting licenses expiring in ${daysBeforeExpiry} days`)

    try {
      const now = new Date()
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + daysBeforeExpiry)

      return await this.prisma.societeLicense.findMany({
        where: {
          status: 'active',
          endDate: {
            gte: now,
            lte: futureDate,
          },
        },
        include: {
          societe: {
            select: {
              id: true,
              code: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { endDate: 'asc' },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting expiring licenses: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Supprimer une licence
   */
  async deleteLicense(id: string): Promise<void> {
    this.logger.log(`Deleting license: ${id}`)

    try {
      await this.prisma.societeLicense.delete({
        where: { id },
      })

      this.logger.log(`License deleted: ${id}`)
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error deleting license: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Compter les licences par statut
   */
  async countByStatus(): Promise<Record<string, number>> {
    this.logger.debug('Counting licenses by status')

    try {
      const licenses = await this.prisma.societeLicense.groupBy({
        by: ['status'],
        _count: true,
      })

      const result: Record<string, number> = {}
      for (const item of licenses) {
        result[item.status] = item._count
      }

      return result
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error counting licenses by status: ${err.message}`, err.stack)
      throw error
    }
  }
}
