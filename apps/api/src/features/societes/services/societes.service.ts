import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../../core/database/prisma/prisma.service'
import type { Societe, Prisma } from '@prisma/client'

/**
 * Service de gestion des sociétés
 * Migrated from TypeORM to Prisma
 */
@Injectable()
export class SocietesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Récupère toutes les sociétés non supprimées
   */
  async findAll(): Promise<Societe[]> {
    return this.prisma.societe.findMany({
      where: { deletedAt: null },
      include: { sites: true },
    })
  }

  /**
   * Trouve une société par son ID
   */
  async findById(id: string): Promise<Societe | null> {
    const societe = await this.prisma.societe.findUnique({
      where: { id },
    })

    // Retourne null si la société est supprimée
    if (societe?.deletedAt) {
      return null
    }

    return societe
  }

  /**
   * Trouve une société par son code
   */
  async findByCode(code: string): Promise<Societe | null> {
    return this.prisma.societe.findFirst({
      where: {
        code,
        deletedAt: null,
      },
      include: { sites: true },
    })
  }

  /**
   * Récupère toutes les sociétés actives (isActive = true)
   */
  async findActive(): Promise<Societe[]> {
    return this.prisma.societe.findMany({
      where: {
        isActive: true,
        deletedAt: null,
      },
      include: { sites: true },
    })
  }

  /**
   * Crée une nouvelle société
   */
  async create(societeData: Prisma.SocieteCreateInput): Promise<Societe> {
    // Générer le nom de la base de données si non fourni
    const databaseName =
      societeData.databaseName ||
      `erp_topsteel_${(typeof societeData === 'object' && 'code' in societeData ? societeData.code : '').toLowerCase()}`

    return this.prisma.societe.create({
      data: {
        ...societeData,
        databaseName,
      },
      include: { sites: true },
    })
  }

  /**
   * Met à jour une société
   */
  async update(id: string, societeData: Prisma.SocieteUpdateInput): Promise<Societe> {
    const societe = await this.prisma.societe.update({
      where: { id },
      data: societeData,
      include: { sites: true },
    })

    if (!societe) {
      throw new NotFoundException(`Société avec l'ID ${id} non trouvée`)
    }

    return societe
  }

  /**
   * Supprime une société (soft delete)
   */
  async delete(id: string): Promise<void> {
    await this.prisma.societe.update({
      where: { id },
      data: { deletedAt: new Date() },
    })
  }

  /**
   * Active une société
   * Note: Le schéma Prisma n'a pas de champ 'status' ou 'dateActivation'
   * Cette méthode active simplement le flag isActive
   */
  async activate(id: string): Promise<Societe> {
    const societe = await this.prisma.societe.update({
      where: { id },
      data: {
        isActive: true,
        updatedAt: new Date(),
      },
    })

    if (!societe) {
      throw new NotFoundException(`Société avec l'ID ${id} non trouvée`)
    }

    return societe
  }

  /**
   * Suspend une société
   * Note: Le schéma Prisma n'a pas de champ 'status'
   * Cette méthode désactive simplement le flag isActive
   */
  async suspend(id: string): Promise<Societe> {
    const societe = await this.prisma.societe.update({
      where: { id },
      data: {
        isActive: false,
      },
    })

    if (!societe) {
      throw new NotFoundException(`Société avec l'ID ${id} non trouvée`)
    }

    return societe
  }

  /**
   * Récupère les statistiques des sociétés
   * Note: Le schéma Prisma n'a pas de champ 'status', donc on se base sur isActive
   */
  async getStatistics(): Promise<{
    total: number
    active: number
    inactive: number
  }> {
    const total = await this.prisma.societe.count({
      where: { deletedAt: null },
    })

    const active = await this.prisma.societe.count({
      where: {
        isActive: true,
        deletedAt: null,
      },
    })

    return {
      total,
      active,
      inactive: total - active,
    }
  }
}
