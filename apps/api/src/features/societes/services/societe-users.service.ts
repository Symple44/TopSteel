import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { IsNull, type Repository } from 'typeorm'
import type { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity'
import { SocieteUser, type UserSocieteRole } from '../entities/societe-user.entity'



@Injectable()
export class SocieteUsersService {
  constructor(
    @InjectRepository(SocieteUser, 'auth')
    private _societeUserRepository: Repository<SocieteUser>
  ) {}

  async findAll(): Promise<SocieteUser[]> {
    return this._societeUserRepository.find({
      where: { deletedAt: IsNull() },
      relations: ['societe'],
    })
  }

  async findByUser(userId: string): Promise<SocieteUser[]> {
    return this._societeUserRepository
      .createQueryBuilder('su')
      .leftJoinAndSelect('su.societe', 'societe')
      .leftJoinAndSelect('societe.sites', 'sites')
      .select([
        'su.id',
        'su.user_id',
        'su.societe_id',
        'su.role',
        'su.actif',
        'su.is_default',
        'su.permissions',
        'su.restricted_permissions',
        'societe.id',
        'societe.nom',
        'societe.code',
        'sites.id',
        'sites.nom',
        'sites.code',
        'sites.is_principal',
      ])
      .where('su.user_id = :userId', { userId })
      .andWhere('su.deleted_at IS NULL')
      .getMany()
  }

  async findBySociete(societeId: string): Promise<SocieteUser[]> {
    return this._societeUserRepository.find({
      where: {
        societeId,
        deletedAt: IsNull(),
      },
      relations: ['societe'],
    })
  }

  async findUserSociete(userId: string, societeId: string): Promise<SocieteUser | null> {
    return this._societeUserRepository.findOne({
      where: {
        userId,
        societeId,
        deletedAt: IsNull(),
      },
      relations: ['societe'],
    })
  }

  async findDefaultSociete(userId: string): Promise<SocieteUser | null> {
    return this._societeUserRepository.findOne({
      where: {
        userId,
        isDefault: true,
        actif: true,
        deletedAt: IsNull(),
      },
      relations: ['societe'],
    })
  }

  async create(associationData: Partial<SocieteUser>): Promise<SocieteUser> {
    const association = this._societeUserRepository.create(associationData)
    return this._societeUserRepository.save(association)
  }

  async update(
    id: string,
    associationData: QueryDeepPartialEntity<SocieteUser>
  ): Promise<SocieteUser> {
    await this._societeUserRepository.update(id, associationData)
    const association = await this._societeUserRepository.findOne({
      where: { id },
      relations: ['societe'],
    })
    if (!association) {
      throw new NotFoundException(`SocieteUser with ID ${id} not found`)
    }
    return association
  }

  async delete(id: string): Promise<void> {
    await this._societeUserRepository.softDelete(id)
  }

  async setDefault(userId: string, societeId: string): Promise<SocieteUser> {
    // D'abord, retirer le statut par défaut des autres associations
    await this._societeUserRepository.update({ userId }, { isDefault: false })

    // Puis définir la nouvelle association par défaut
    const association = await this.findUserSociete(userId, societeId)
    if (association) {
      await this._societeUserRepository.update(association.id, {
        isDefault: true,
      })
      const updatedAssociation = await this._societeUserRepository.findOne({
        where: { id: association.id },
        relations: ['societe'],
      })
      if (!updatedAssociation) {
        throw new NotFoundException(`SocieteUser with ID ${association.id} not found`)
      }
      return updatedAssociation
    }

    throw new Error('Association utilisateur-société non trouvée')
  }

  async activate(id: string): Promise<SocieteUser> {
    await this._societeUserRepository.update(id, { actif: true })
    const association = await this._societeUserRepository.findOne({
      where: { id },
      relations: ['societe'],
    })
    if (!association) {
      throw new NotFoundException(`SocieteUser with ID ${id} not found`)
    }
    return association
  }

  async deactivate(id: string): Promise<SocieteUser> {
    await this._societeUserRepository.update(id, { actif: false })
    const association = await this._societeUserRepository.findOne({
      where: { id },
      relations: ['societe'],
    })
    if (!association) {
      throw new NotFoundException(`SocieteUser with ID ${id} not found`)
    }
    return association
  }

  async updateLastActivity(userId: string, societeId: string): Promise<void> {
    const association = await this.findUserSociete(userId, societeId)
    if (association) {
      await this._societeUserRepository.update(association.id, {
        lastActivityAt: new Date(),
      })
    }
  }

  async grantPermissions(id: string, permissions: string[]): Promise<SocieteUser> {
    const association = await this._societeUserRepository.findOne({ where: { id } })
    if (association) {
      const existingPermissions = association.permissions || []
      const newPermissions = [...new Set([...existingPermissions, ...permissions])]

      await this._societeUserRepository.update(id, {
        permissions: newPermissions,
      })
    }

    const updatedAssociation = await this._societeUserRepository.findOne({
      where: { id },
      relations: ['societe'],
    })
    if (!updatedAssociation) {
      throw new NotFoundException(`SocieteUser with ID ${id} not found`)
    }
    return updatedAssociation
  }

  async revokePermissions(id: string, permissions: string[]): Promise<SocieteUser> {
    const association = await this._societeUserRepository.findOne({ where: { id } })
    if (association) {
      const existingPermissions = association.permissions || []
      const newPermissions = existingPermissions.filter((p) => !permissions.includes(p))

      await this._societeUserRepository.update(id, {
        permissions: newPermissions,
      })
    }

    const updatedAssociation = await this._societeUserRepository.findOne({
      where: { id },
      relations: ['societe'],
    })
    if (!updatedAssociation) {
      throw new NotFoundException(`SocieteUser with ID ${id} not found`)
    }
    return updatedAssociation
  }

  async getUserCompanies(userId: string): Promise<SocieteUser[]> {
    return await this._societeUserRepository.find({
      where: { userId },
      relations: ['societe'],
    })
  }

  async getCompanyUsers(societeId: string): Promise<SocieteUser[]> {
    return await this._societeUserRepository.find({
      where: { societeId },
      relations: ['user'],
    })
  }

  async grantUserAccess(
    societeId: string,
    userId: string,
    role: string,
    permissions: string[] = [],
    isActive: boolean = true
  ): Promise<SocieteUser> {
    const roleEnum = role as UserSocieteRole
    const existingAccess = await this.findUserSociete(userId, societeId)

    if (existingAccess) {
      // Update existing access
      await this._societeUserRepository.update(existingAccess.id, {
        role: roleEnum,
        permissions,
        actif: isActive,
      })
      const updated = await this._societeUserRepository.findOne({
        where: { id: existingAccess.id },
        relations: ['societe'],
      })
      if (!updated) {
        throw new NotFoundException(`SocieteUser with ID ${existingAccess.id} not found`)
      }
      return updated
    } else {
      // Create new access
      const newAccess = this._societeUserRepository.create({
        userId,
        societeId,
        role: roleEnum,
        permissions,
        actif: isActive,
      })
      return await this._societeUserRepository.save(newAccess)
    }
  }

  async updateUserAccess(
    societeUserId: string,
    updates: {
      role?: string
      permissions?: string[]
      isActive?: boolean
    }
  ): Promise<SocieteUser> {
    const updateData: Partial<SocieteUser> = {}
    if (updates.role !== undefined) updateData.role = updates.role as UserSocieteRole
    if (updates.permissions !== undefined) updateData.permissions = updates.permissions
    if (updates.isActive !== undefined) updateData.actif = updates.isActive

    await this._societeUserRepository.update(
      societeUserId,
      updateData as QueryDeepPartialEntity<SocieteUser>
    )

    const updated = await this._societeUserRepository.findOne({
      where: { id: societeUserId },
      relations: ['societe'],
    })

    if (!updated) {
      throw new NotFoundException(`SocieteUser with ID ${societeUserId} not found`)
    }

    return updated
  }

  async updateUserPermissions(societeUserId: string, permissions: string[]): Promise<SocieteUser> {
    await this._societeUserRepository.update(societeUserId, {
      permissions,
    } as QueryDeepPartialEntity<SocieteUser>)

    const updated = await this._societeUserRepository.findOne({
      where: { id: societeUserId },
      relations: ['societe'],
    })

    if (!updated) {
      throw new NotFoundException(`SocieteUser with ID ${societeUserId} not found`)
    }

    return updated
  }

  async revokeUserAccess(societeUserId: string): Promise<void> {
    const result = await this._societeUserRepository.delete(societeUserId)
    if (result.affected === 0) {
      throw new NotFoundException(`SocieteUser with ID ${societeUserId} not found`)
    }
  }

  async setDefaultSociete(userId: string, societeId: string): Promise<void> {
    // D'abord, enlever le statut par défaut de toutes les sociétés de l'utilisateur
    await this._societeUserRepository.update({ userId }, { isDefault: false })

    // Ensuite, définir la société spécifiée comme par défaut
    const result = await this._societeUserRepository.update(
      { userId, societeId },
      {
        isDefault: true,
      }
    )

    if (result.affected === 0) {
      throw new NotFoundException(`No access found for user ${userId} to company ${societeId}`)
    }
  }
}

