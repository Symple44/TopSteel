import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '../../../core/database/prisma/prisma.service'
import type { DiscoveredPage, Prisma } from '@prisma/client'

/**
 * DiscoveredPagePrismaService - Phase 2.3
 *
 * Service pour gestion des pages découvertes automatiquement avec Prisma
 *
 * DiscoveredPage = Pages découvertes automatiquement par scan/introspection
 * Permet d'auto-générer des menus basés sur les routes/pages disponibles
 *
 * Fonctionnalités:
 * - CRUD pages découvertes
 * - Recherche par path/category
 * - Activation/désactivation
 * - Metadata Json pour extensions
 * - Catégorisation automatique
 */
@Injectable()
export class DiscoveredPagePrismaService {
  private readonly logger = new Logger(DiscoveredPagePrismaService.name)

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Créer une page découverte
   */
  async createDiscoveredPage(data: {
    path: string
    title: string
    description?: string
    category?: string
    icon?: string
    isActive?: boolean
    metadata?: Record<string, any>
  }): Promise<DiscoveredPage> {
    this.logger.log(`Creating discovered page: ${data.path}`)

    try {
      const page = await this.prisma.discoveredPage.create({
        data: {
          path: data.path,
          title: data.title,
          description: data.description || null,
          category: data.category || null,
          icon: data.icon || null,
          isActive: data.isActive !== undefined ? data.isActive : true,
          metadata: data.metadata ? (data.metadata as Prisma.InputJsonValue) : undefined,
        },
      })

      this.logger.log(`Discovered page created: ${page.id}`)
      return page
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error creating discovered page: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer une page par ID
   */
  async getDiscoveredPageById(id: string): Promise<DiscoveredPage | null> {
    this.logger.debug(`Getting discovered page: ${id}`)

    try {
      return await this.prisma.discoveredPage.findUnique({
        where: { id },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting discovered page: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer une page par path
   */
  async getDiscoveredPageByPath(path: string): Promise<DiscoveredPage | null> {
    this.logger.debug(`Getting discovered page by path: ${path}`)

    try {
      return await this.prisma.discoveredPage.findUnique({
        where: { path },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting discovered page by path: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Lister toutes les pages découvertes
   */
  async getAllDiscoveredPages(includeInactive = false): Promise<DiscoveredPage[]> {
    this.logger.debug('Getting all discovered pages')

    try {
      return await this.prisma.discoveredPage.findMany({
        where: includeInactive ? {} : { isActive: true },
        orderBy: [{ category: 'asc' }, { title: 'asc' }],
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting all discovered pages: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer les pages actives
   */
  async getActiveDiscoveredPages(): Promise<DiscoveredPage[]> {
    this.logger.debug('Getting active discovered pages')

    return this.getAllDiscoveredPages(false)
  }

  /**
   * Récupérer les pages par catégorie
   */
  async getDiscoveredPagesByCategory(category: string, includeInactive = false): Promise<DiscoveredPage[]> {
    this.logger.debug(`Getting discovered pages by category: ${category}`)

    try {
      return await this.prisma.discoveredPage.findMany({
        where: {
          category,
          ...(includeInactive ? {} : { isActive: true }),
        },
        orderBy: { title: 'asc' },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting discovered pages by category: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer toutes les catégories
   */
  async getAllCategories(): Promise<string[]> {
    this.logger.debug('Getting all categories')

    try {
      const pages = await this.prisma.discoveredPage.findMany({
        select: { category: true },
        where: {
          category: { not: null },
          isActive: true,
        },
        distinct: ['category'],
        orderBy: { category: 'asc' },
      })

      return pages.map((p) => p.category).filter((c): c is string => c !== null)
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting all categories: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Mettre à jour une page découverte
   */
  async updateDiscoveredPage(
    id: string,
    data: {
      path?: string
      title?: string
      description?: string
      category?: string
      icon?: string
      isActive?: boolean
      metadata?: Record<string, any>
    }
  ): Promise<DiscoveredPage> {
    this.logger.log(`Updating discovered page: ${id}`)

    try {
      const updateData: any = {}

      if (data.path !== undefined) updateData.path = data.path
      if (data.title !== undefined) updateData.title = data.title
      if (data.description !== undefined) updateData.description = data.description
      if (data.category !== undefined) updateData.category = data.category
      if (data.icon !== undefined) updateData.icon = data.icon
      if (data.isActive !== undefined) updateData.isActive = data.isActive
      if (data.metadata !== undefined) updateData.metadata = data.metadata as Prisma.InputJsonValue

      const page = await this.prisma.discoveredPage.update({
        where: { id },
        data: updateData,
      })

      this.logger.log(`Discovered page updated: ${id}`)
      return page
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error updating discovered page: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Activer/désactiver une page
   */
  async setActive(id: string, isActive: boolean): Promise<DiscoveredPage> {
    this.logger.log(`Setting discovered page active: ${id} -> ${isActive}`)

    return this.updateDiscoveredPage(id, { isActive })
  }

  /**
   * Mettre à jour la catégorie
   */
  async updateCategory(id: string, category: string): Promise<DiscoveredPage> {
    this.logger.log(`Updating category for discovered page ${id}: ${category}`)

    return this.updateDiscoveredPage(id, { category })
  }

  /**
   * Mettre à jour les métadonnées
   */
  async updateMetadata(id: string, metadata: Record<string, any>): Promise<DiscoveredPage> {
    this.logger.log(`Updating metadata for discovered page: ${id}`)

    return this.updateDiscoveredPage(id, { metadata })
  }

  /**
   * Fusionner des métadonnées (merge)
   */
  async mergeMetadata(id: string, partialMetadata: Record<string, any>): Promise<DiscoveredPage> {
    this.logger.log(`Merging metadata for discovered page: ${id}`)

    try {
      const page = await this.getDiscoveredPageById(id)
      if (!page) {
        throw new Error(`Discovered page not found: ${id}`)
      }

      const currentMetadata = (page.metadata as Record<string, any>) || {}
      const mergedMetadata = {
        ...currentMetadata,
        ...partialMetadata,
      }

      return this.updateMetadata(id, mergedMetadata)
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error merging metadata: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Créer ou mettre à jour une page (upsert)
   */
  async upsertDiscoveredPage(data: {
    path: string
    title: string
    description?: string
    category?: string
    icon?: string
    isActive?: boolean
    metadata?: Record<string, any>
  }): Promise<DiscoveredPage> {
    this.logger.log(`Upserting discovered page: ${data.path}`)

    try {
      const page = await this.prisma.discoveredPage.upsert({
        where: { path: data.path },
        create: {
          path: data.path,
          title: data.title,
          description: data.description || null,
          category: data.category || null,
          icon: data.icon || null,
          isActive: data.isActive !== undefined ? data.isActive : true,
          metadata: data.metadata ? (data.metadata as Prisma.InputJsonValue) : undefined,
        },
        update: {
          title: data.title,
          description: data.description,
          category: data.category,
          icon: data.icon,
          isActive: data.isActive,
          metadata: data.metadata ? (data.metadata as Prisma.InputJsonValue) : undefined,
        },
      })

      this.logger.log(`Discovered page upserted: ${page.id}`)
      return page
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error upserting discovered page: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Enregistrer plusieurs pages découvertes (batch)
   */
  async bulkUpsertDiscoveredPages(
    pages: Array<{
      path: string
      title: string
      description?: string
      category?: string
      icon?: string
      isActive?: boolean
      metadata?: Record<string, any>
    }>
  ): Promise<void> {
    this.logger.log(`Bulk upserting ${pages.length} discovered pages`)

    try {
      for (const page of pages) {
        await this.upsertDiscoveredPage(page)
      }

      this.logger.log('Discovered pages bulk upserted successfully')
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error bulk upserting discovered pages: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Supprimer une page découverte
   */
  async deleteDiscoveredPage(id: string): Promise<void> {
    this.logger.log(`Deleting discovered page: ${id}`)

    try {
      await this.prisma.discoveredPage.delete({
        where: { id },
      })

      this.logger.log(`Discovered page deleted: ${id}`)
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error deleting discovered page: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Supprimer toutes les pages inactives
   */
  async deleteInactivePages(): Promise<number> {
    this.logger.log('Deleting all inactive discovered pages')

    try {
      const result = await this.prisma.discoveredPage.deleteMany({
        where: { isActive: false },
      })

      this.logger.log(`Deleted ${result.count} inactive discovered pages`)
      return result.count
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error deleting inactive pages: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Rechercher des pages par titre ou description
   */
  async searchDiscoveredPages(searchTerm: string): Promise<DiscoveredPage[]> {
    this.logger.debug(`Searching discovered pages: ${searchTerm}`)

    try {
      return await this.prisma.discoveredPage.findMany({
        where: {
          OR: [
            {
              title: {
                contains: searchTerm,
                mode: 'insensitive',
              },
            },
            {
              description: {
                contains: searchTerm,
                mode: 'insensitive',
              },
            },
            {
              path: {
                contains: searchTerm,
                mode: 'insensitive',
              },
            },
          ],
          isActive: true,
        },
        orderBy: [{ category: 'asc' }, { title: 'asc' }],
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error searching discovered pages: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Compter les pages découvertes
   */
  async countDiscoveredPages(includeInactive = false): Promise<number> {
    this.logger.debug('Counting discovered pages')

    try {
      return await this.prisma.discoveredPage.count({
        where: includeInactive ? {} : { isActive: true },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error counting discovered pages: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Compter les pages par catégorie
   */
  async countByCategory(category: string): Promise<number> {
    this.logger.debug(`Counting discovered pages by category: ${category}`)

    try {
      return await this.prisma.discoveredPage.count({
        where: {
          category,
          isActive: true,
        },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error counting pages by category: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Vérifier si un path existe
   */
  async existsByPath(path: string): Promise<boolean> {
    this.logger.debug(`Checking if discovered page exists: ${path}`)

    try {
      const page = await this.getDiscoveredPageByPath(path)
      return page !== null
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error checking discovered page existence: ${err.message}`, err.stack)
      return false
    }
  }
}
