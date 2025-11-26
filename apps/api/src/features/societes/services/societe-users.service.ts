import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../../core/database/prisma/prisma.service'
import type { SocieteUser, Prisma } from '@prisma/client'

/**
 * Service de gestion des associations utilisateur-société
 * Migrated from TypeORM to Prisma
 *
 * Note: Le schéma Prisma SocieteUser n'a pas certains champs de l'ancienne entité TypeORM:
 * - pas de champ 'deletedAt' (soft delete désactivé)
 * - 'actif' renommé en 'isActive'
 * - pas de champ 'role', 'isDefault', 'lastActivityAt', 'restrictedPermissions'
 */
@Injectable()
export class SocieteUsersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Récupère toutes les associations utilisateur-société
   */
  async findAll(): Promise<SocieteUser[]> {
    return this.prisma.societeUser.findMany({
      include: { societe: true, user: true },
    })
  }

  /**
   * Récupère toutes les sociétés d'un utilisateur
   */
  async findByUser(userId: string): Promise<SocieteUser[]> {
    return this.prisma.societeUser.findMany({
      where: { userId },
      include: {
        societe: {
          include: {
            sites: true,
          },
        },
      },
    })
  }

  /**
   * Récupère tous les utilisateurs d'une société
   */
  async findBySociete(societeId: string): Promise<SocieteUser[]> {
    return this.prisma.societeUser.findMany({
      where: { societeId },
      include: { societe: true, user: true },
    })
  }

  /**
   * Trouve l'association entre un utilisateur et une société
   */
  async findUserSociete(userId: string, societeId: string): Promise<SocieteUser | null> {
    return this.prisma.societeUser.findFirst({
      where: {
        userId,
        societeId,
      },
      include: { societe: true, user: true },
    })
  }

  /**
   * Récupère toutes les sociétés actives d'un utilisateur
   */
  async findActiveBySociete(userId: string): Promise<SocieteUser[]> {
    return this.prisma.societeUser.findMany({
      where: {
        userId,
        isActive: true,
      },
      include: { societe: true },
    })
  }

  /**
   * Crée une nouvelle association utilisateur-société
   */
  async create(associationData: Prisma.SocieteUserCreateInput): Promise<SocieteUser> {
    return this.prisma.societeUser.create({
      data: associationData,
      include: { societe: true, user: true },
    })
  }

  /**
   * Met à jour une association utilisateur-société
   */
  async update(id: string, associationData: Prisma.SocieteUserUpdateInput): Promise<SocieteUser> {
    const association = await this.prisma.societeUser.update({
      where: { id },
      data: associationData,
      include: { societe: true, user: true },
    })

    if (!association) {
      throw new NotFoundException(`SocieteUser with ID ${id} not found`)
    }

    return association
  }

  /**
   * Supprime une association utilisateur-société
   * Note: Le schéma Prisma n'a pas de soft delete pour SocieteUser
   */
  async delete(id: string): Promise<void> {
    await this.prisma.societeUser.delete({
      where: { id },
    })
  }

  /**
   * Active une association utilisateur-société
   */
  async activate(id: string): Promise<SocieteUser> {
    const association = await this.prisma.societeUser.update({
      where: { id },
      data: { isActive: true },
      include: { societe: true, user: true },
    })

    if (!association) {
      throw new NotFoundException(`SocieteUser with ID ${id} not found`)
    }

    return association
  }

  /**
   * Désactive une association utilisateur-société
   */
  async deactivate(id: string): Promise<SocieteUser> {
    const association = await this.prisma.societeUser.update({
      where: { id },
      data: { isActive: false, leftAt: new Date() },
      include: { societe: true, user: true },
    })

    if (!association) {
      throw new NotFoundException(`SocieteUser with ID ${id} not found`)
    }

    return association
  }

  /**
   * Accorde des permissions à un utilisateur pour une société
   */
  async grantPermissions(id: string, permissions: string[]): Promise<SocieteUser> {
    const association = await this.prisma.societeUser.findUnique({ where: { id } })

    if (!association) {
      throw new NotFoundException(`SocieteUser with ID ${id} not found`)
    }

    const existingPermissions = (association.permissions as string[]) || []
    const newPermissions = [...new Set([...existingPermissions, ...permissions])]

    return this.prisma.societeUser.update({
      where: { id },
      data: { permissions: newPermissions },
      include: { societe: true, user: true },
    })
  }

  /**
   * Révoque des permissions à un utilisateur pour une société
   */
  async revokePermissions(id: string, permissions: string[]): Promise<SocieteUser> {
    const association = await this.prisma.societeUser.findUnique({ where: { id } })

    if (!association) {
      throw new NotFoundException(`SocieteUser with ID ${id} not found`)
    }

    const existingPermissions = (association.permissions as string[]) || []
    const newPermissions = existingPermissions.filter((p) => !permissions.includes(p))

    return this.prisma.societeUser.update({
      where: { id },
      data: { permissions: newPermissions },
      include: { societe: true, user: true },
    })
  }

  /**
   * Récupère toutes les sociétés d'un utilisateur
   */
  async getUserCompanies(userId: string): Promise<SocieteUser[]> {
    return this.prisma.societeUser.findMany({
      where: { userId },
      include: { societe: true },
    })
  }

  /**
   * Récupère tous les utilisateurs d'une société
   */
  async getCompanyUsers(societeId: string): Promise<SocieteUser[]> {
    return this.prisma.societeUser.findMany({
      where: { societeId },
      include: { user: true },
    })
  }

  /**
   * Accorde l'accès à une société pour un utilisateur
   */
  async grantUserAccess(
    societeId: string,
    userId: string,
    permissions: string[] = [],
    isActive: boolean = true
  ): Promise<SocieteUser> {
    const existingAccess = await this.findUserSociete(userId, societeId)

    if (existingAccess) {
      // Update existing access
      return this.prisma.societeUser.update({
        where: { id: existingAccess.id },
        data: {
          permissions,
          isActive,
        },
        include: { societe: true, user: true },
      })
    }

    // Create new access
    return this.prisma.societeUser.create({
      data: {
        user: { connect: { id: userId } },
        societe: { connect: { id: societeId } },
        permissions,
        isActive,
      },
      include: { societe: true, user: true },
    })
  }

  /**
   * Met à jour l'accès d'un utilisateur à une société
   */
  async updateUserAccess(
    societeUserId: string,
    updates: {
      permissions?: string[]
      isActive?: boolean
    }
  ): Promise<SocieteUser> {
    const updateData: Prisma.SocieteUserUpdateInput = {}
    if (updates.permissions !== undefined) updateData.permissions = updates.permissions
    if (updates.isActive !== undefined) updateData.isActive = updates.isActive

    const updated = await this.prisma.societeUser.update({
      where: { id: societeUserId },
      data: updateData,
      include: { societe: true, user: true },
    })

    if (!updated) {
      throw new NotFoundException(`SocieteUser with ID ${societeUserId} not found`)
    }

    return updated
  }

  /**
   * Met à jour les permissions d'un utilisateur pour une société
   */
  async updateUserPermissions(societeUserId: string, permissions: string[]): Promise<SocieteUser> {
    const updated = await this.prisma.societeUser.update({
      where: { id: societeUserId },
      data: { permissions },
      include: { societe: true, user: true },
    })

    if (!updated) {
      throw new NotFoundException(`SocieteUser with ID ${societeUserId} not found`)
    }

    return updated
  }

  /**
   * Révoque l'accès d'un utilisateur à une société
   */
  async revokeUserAccess(societeUserId: string): Promise<void> {
    try {
      await this.prisma.societeUser.delete({
        where: { id: societeUserId },
      })
    } catch (error) {
      throw new NotFoundException(`SocieteUser with ID ${societeUserId} not found`)
    }
  }
}
