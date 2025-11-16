import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '../../../core/database/prisma/prisma.service'
import type { Site, Prisma } from '@prisma/client'

/**
 * SitePrismaService - Phase 2.2
 *
 * Service pour gestion des sites/localisations avec Prisma
 *
 * Sites = Lieux physiques d'une societe (usines, bureaux, entrepôts, etc.)
 *
 * Fonctionnalités:
 * - CRUD Sites
 * - Configuration et metadata Json
 * - Activation/désactivation
 * - Recherche par critères
 */
@Injectable()
export class SitePrismaService {
  private readonly logger = new Logger(SitePrismaService.name)

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Créer un site
   */
  async createSite(data: {
    societeId: string
    name: string
    code: string
    address?: string
    city?: string
    postalCode?: string
    country?: string
    phone?: string
    email?: string
    configuration?: Record<string, any>
    metadata?: Record<string, any>
    isActive?: boolean
  }): Promise<Site> {
    this.logger.log(`Creating site: ${data.code} for societe ${data.societeId}`)

    try {
      const site = await this.prisma.site.create({
        data: {
          societeId: data.societeId,
          name: data.name,
          code: data.code,
          address: data.address || null,
          city: data.city || null,
          postalCode: data.postalCode || null,
          country: data.country || null,
          phone: data.phone || null,
          email: data.email || null,
          configuration: data.configuration ? (data.configuration as Prisma.InputJsonValue) : undefined,
          metadata: data.metadata ? (data.metadata as Prisma.InputJsonValue) : undefined,
          isActive: data.isActive !== undefined ? data.isActive : true,
        },
      })

      this.logger.log(`Site created: ${site.id}`)
      return site
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error creating site: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer un site par ID
   */
  async getSiteById(id: string): Promise<Site | null> {
    this.logger.debug(`Getting site: ${id}`)

    try {
      return await this.prisma.site.findUnique({
        where: { id },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting site: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer un site par societeId + code
   */
  async getSiteByCode(societeId: string, code: string): Promise<Site | null> {
    this.logger.debug(`Getting site by code: ${code} for societe ${societeId}`)

    try {
      return await this.prisma.site.findUnique({
        where: {
          societeId_code: {
            societeId,
            code,
          },
        },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting site by code: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Lister tous les sites d'une societe
   */
  async getSocieteSites(societeId: string, includeInactive = false): Promise<Site[]> {
    this.logger.debug(`Getting sites for societe: ${societeId}`)

    try {
      return await this.prisma.site.findMany({
        where: {
          societeId,
          ...(includeInactive ? {} : { isActive: true }),
        },
        orderBy: { name: 'asc' },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting societe sites: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer un site avec sa societe
   */
  async getSiteWithSociete(id: string) {
    this.logger.debug(`Getting site with societe: ${id}`)

    try {
      return await this.prisma.site.findUnique({
        where: { id },
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
      this.logger.error(`Error getting site with societe: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Mettre à jour un site
   */
  async updateSite(
    id: string,
    data: Partial<Omit<Site, 'id' | 'societeId' | 'createdAt' | 'updatedAt'>> & {
      configuration?: Record<string, any>
      metadata?: Record<string, any>
    }
  ): Promise<Site> {
    this.logger.log(`Updating site: ${id}`)

    try {
      const updateData: any = { ...data }

      // Convert objects to Prisma.InputJsonValue
      if (data.configuration) {
        updateData.configuration = data.configuration as Prisma.InputJsonValue
      }
      if (data.metadata) {
        updateData.metadata = data.metadata as Prisma.InputJsonValue
      }

      const site = await this.prisma.site.update({
        where: { id },
        data: updateData,
      })

      this.logger.log(`Site updated: ${id}`)
      return site
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error updating site: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Mettre à jour la configuration
   */
  async updateConfiguration(id: string, configuration: Record<string, any>): Promise<Site> {
    this.logger.log(`Updating configuration for site: ${id}`)

    return this.updateSite(id, { configuration })
  }

  /**
   * Mettre à jour les metadata
   */
  async updateMetadata(id: string, metadata: Record<string, any>): Promise<Site> {
    this.logger.log(`Updating metadata for site: ${id}`)

    return this.updateSite(id, { metadata })
  }

  /**
   * Désactiver un site
   */
  async deactivateSite(id: string): Promise<Site> {
    this.logger.log(`Deactivating site: ${id}`)

    try {
      const site = await this.prisma.site.update({
        where: { id },
        data: {
          isActive: false,
        },
      })

      this.logger.log(`Site deactivated: ${id}`)
      return site
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error deactivating site: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Supprimer un site
   */
  async deleteSite(id: string): Promise<void> {
    this.logger.log(`Deleting site: ${id}`)

    try {
      await this.prisma.site.delete({
        where: { id },
      })

      this.logger.log(`Site deleted: ${id}`)
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error deleting site: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Rechercher des sites par critères
   */
  async searchSites(filters: {
    societeId?: string
    name?: string
    code?: string
    city?: string
    country?: string
    isActive?: boolean
  }): Promise<Site[]> {
    this.logger.debug('Searching sites with filters')

    try {
      const where: any = {}

      if (filters.societeId) where.societeId = filters.societeId
      if (filters.code) {
        where.code = { contains: filters.code, mode: 'insensitive' }
      }
      if (filters.name) {
        where.name = { contains: filters.name, mode: 'insensitive' }
      }
      if (filters.city) {
        where.city = { contains: filters.city, mode: 'insensitive' }
      }
      if (filters.country) {
        where.country = filters.country
      }
      if (filters.isActive !== undefined) {
        where.isActive = filters.isActive
      }

      return await this.prisma.site.findMany({
        where,
        include: {
          societe: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
        },
        orderBy: { name: 'asc' },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error searching sites: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Compter les sites d'une societe
   */
  async countSocieteSites(societeId: string, includeInactive = false): Promise<number> {
    this.logger.debug(`Counting sites for societe: ${societeId}`)

    try {
      return await this.prisma.site.count({
        where: {
          societeId,
          ...(includeInactive ? {} : { isActive: true }),
        },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error counting sites: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Vérifier si un site existe par code
   */
  async siteExists(societeId: string, code: string): Promise<boolean> {
    this.logger.debug(`Checking if site exists: ${code} for societe ${societeId}`)

    try {
      const site = await this.getSiteByCode(societeId, code)
      return site !== null
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error checking site existence: ${err.message}`, err.stack)
      return false
    }
  }
}
