import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '../../../core/database/prisma/prisma.service'
import type { Societe } from '@prisma/client'

/**
 * SocietePrismaService - Phase 2.2
 *
 * Service pour gestion des sociétés avec Prisma
 *
 * Fonctionnalités:
 * - CRUD Sociétés
 * - Gestion activité et soft delete
 * - Recherche et filtrage
 * - Relations avec licences, utilisateurs, sites
 */
@Injectable()
export class SocietePrismaService {
  private readonly logger = new Logger(SocietePrismaService.name)

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Créer une societe
   */
  async createSociete(data: {
    code: string
    name: string
    databaseName: string
    legalName?: string
    siret?: string
    address?: string
    city?: string
    postalCode?: string
    country?: string
    phone?: string
    email?: string
    website?: string
    isActive?: boolean
  }): Promise<Societe> {
    this.logger.log(`Creating societe: ${data.code}`)

    try {
      const societe = await this.prisma.societe.create({
        data: {
          code: data.code,
          name: data.name,
          databaseName: data.databaseName,
          legalName: data.legalName || null,
          siret: data.siret || null,
          address: data.address || null,
          city: data.city || null,
          postalCode: data.postalCode || null,
          country: data.country || null,
          phone: data.phone || null,
          email: data.email || null,
          website: data.website || null,
          isActive: data.isActive !== undefined ? data.isActive : true,
        },
      })

      this.logger.log(`Societe created: ${societe.id}`)
      return societe
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error creating societe: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer une societe par ID
   */
  async getSocieteById(id: string): Promise<Societe | null> {
    this.logger.debug(`Getting societe: ${id}`)

    try {
      return await this.prisma.societe.findUnique({
        where: { id },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting societe: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer une societe par code
   */
  async getSocieteByCode(code: string): Promise<Societe | null> {
    this.logger.debug(`Getting societe by code: ${code}`)

    try {
      return await this.prisma.societe.findUnique({
        where: { code },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting societe by code: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Lister toutes les societes
   */
  async getAllSocietes(includeInactive = false): Promise<Societe[]> {
    this.logger.debug(`Getting all societes (includeInactive: ${includeInactive})`)

    try {
      return await this.prisma.societe.findMany({
        where: includeInactive ? {} : { isActive: true, deletedAt: null },
        orderBy: { name: 'asc' },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting all societes: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer une societe avec toutes ses relations
   */
  async getSocieteWithRelations(id: string) {
    this.logger.debug(`Getting societe with relations: ${id}`)

    try {
      return await this.prisma.societe.findUnique({
        where: { id },
        include: {
          license: true,
          users: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  nom: true,
                  prenom: true,
                  role: true,
                  actif: true,
                },
              },
            },
          },
          sites: {
            where: { isActive: true },
          },
          userSocieteRoles: {
            where: { isActive: true },
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  nom: true,
                  prenom: true,
                  role: true,
                },
              },
              role: {
                select: {
                  id: true,
                  name: true,
                  label: true,
                },
              },
            },
          },
        },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting societe with relations: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Mettre à jour une societe
   */
  async updateSociete(
    id: string,
    data: Partial<Omit<Societe, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>>
  ): Promise<Societe> {
    this.logger.log(`Updating societe: ${id}`)

    try {
      const societe = await this.prisma.societe.update({
        where: { id },
        data,
      })

      this.logger.log(`Societe updated: ${id}`)
      return societe
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error updating societe: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Désactiver une societe
   */
  async deactivateSociete(id: string): Promise<Societe> {
    this.logger.log(`Deactivating societe: ${id}`)

    try {
      const societe = await this.prisma.societe.update({
        where: { id },
        data: {
          isActive: false,
        },
      })

      this.logger.log(`Societe deactivated: ${id}`)
      return societe
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error deactivating societe: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Supprimer une societe (soft delete)
   */
  async deleteSociete(id: string): Promise<Societe> {
    this.logger.log(`Deleting societe (soft): ${id}`)

    try {
      const societe = await this.prisma.societe.update({
        where: { id },
        data: {
          isActive: false,
          deletedAt: new Date(),
        },
      })

      this.logger.log(`Societe deleted (soft): ${id}`)
      return societe
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error deleting societe: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Supprimer une societe (hard delete)
   */
  async hardDeleteSociete(id: string): Promise<void> {
    this.logger.log(`Deleting societe (hard): ${id}`)

    try {
      // Les relations seront supprimées en cascade grâce au schema
      await this.prisma.societe.delete({
        where: { id },
      })

      this.logger.log(`Societe deleted (hard): ${id}`)
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error hard deleting societe: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Rechercher des societes par critères
   */
  async searchSocietes(filters: {
    name?: string
    code?: string
    city?: string
    country?: string
    isActive?: boolean
  }): Promise<Societe[]> {
    this.logger.debug('Searching societes with filters')

    try {
      const where: any = {}

      if (filters.name) {
        where.name = { contains: filters.name, mode: 'insensitive' }
      }
      if (filters.code) {
        where.code = { contains: filters.code, mode: 'insensitive' }
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

      // Always exclude soft-deleted
      where.deletedAt = null

      return await this.prisma.societe.findMany({
        where,
        orderBy: { name: 'asc' },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error searching societes: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Compter les societes
   */
  async countSocietes(includeInactive = false): Promise<number> {
    this.logger.debug('Counting societes')

    try {
      return await this.prisma.societe.count({
        where: includeInactive
          ? { deletedAt: null }
          : { isActive: true, deletedAt: null },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error counting societes: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Vérifier si une societe existe par code
   */
  async societeExists(code: string): Promise<boolean> {
    this.logger.debug(`Checking if societe exists: ${code}`)

    try {
      const societe = await this.getSocieteByCode(code)
      return societe !== null && societe.deletedAt === null
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error checking societe existence: ${err.message}`, err.stack)
      return false
    }
  }
}
