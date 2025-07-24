import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, IsNull } from 'typeorm'
import { SocieteUser } from '../entities/societe-user.entity'

@Injectable()
export class SocieteUsersService {
  constructor(
    @InjectRepository(SocieteUser, 'auth')
    private societeUserRepository: Repository<SocieteUser>,
  ) {}

  async findAll(): Promise<SocieteUser[]> {
    return this.societeUserRepository.find({
      where: { deletedAt: IsNull() },
      relations: ['user', 'societe']
    })
  }

  async findByUser(userId: string): Promise<SocieteUser[]> {
    return this.societeUserRepository.find({
      where: { 
        userId,
        deletedAt: IsNull() 
      },
      relations: ['user', 'societe']
    })
  }

  async findBySociete(societeId: string): Promise<SocieteUser[]> {
    return this.societeUserRepository.find({
      where: { 
        societeId,
        deletedAt: IsNull() 
      },
      relations: ['user', 'societe']
    })
  }

  async findUserSociete(userId: string, societeId: string): Promise<SocieteUser | null> {
    return this.societeUserRepository.findOne({
      where: { 
        userId,
        societeId,
        deletedAt: IsNull() 
      },
      relations: ['user', 'societe']
    })
  }

  async findDefaultSociete(userId: string): Promise<SocieteUser | null> {
    return this.societeUserRepository.findOne({
      where: { 
        userId,
        isDefault: true,
        actif: true,
        deletedAt: IsNull() 
      },
      relations: ['user', 'societe']
    })
  }

  async create(associationData: Partial<SocieteUser>): Promise<SocieteUser> {
    const association = this.societeUserRepository.create(associationData)
    return this.societeUserRepository.save(association)
  }

  async update(id: string, associationData: Partial<SocieteUser>): Promise<SocieteUser> {
    await this.societeUserRepository.update(id, associationData)
    const association = await this.societeUserRepository.findOne({ 
      where: { id },
      relations: ['user', 'societe']
    })
    if (!association) {
      throw new NotFoundException(`SocieteUser with ID ${id} not found`)
    }
    return association
  }

  async delete(id: string): Promise<void> {
    await this.societeUserRepository.softDelete(id)
  }

  async setDefault(userId: string, societeId: string): Promise<SocieteUser> {
    // D'abord, retirer le statut par défaut des autres associations
    await this.societeUserRepository.update(
      { userId },
      { isDefault: false }
    )

    // Puis définir la nouvelle association par défaut
    const association = await this.findUserSociete(userId, societeId)
    if (association) {
      await this.societeUserRepository.update(association.id, { isDefault: true })
      const updatedAssociation = await this.societeUserRepository.findOne({
        where: { id: association.id },
        relations: ['user', 'societe']
      })
      if (!updatedAssociation) {
        throw new NotFoundException(`SocieteUser with ID ${association.id} not found`)
      }
      return updatedAssociation
    }
    
    throw new Error('Association utilisateur-société non trouvée')
  }

  async activate(id: string): Promise<SocieteUser> {
    await this.societeUserRepository.update(id, { actif: true })
    const association = await this.societeUserRepository.findOne({
      where: { id },
      relations: ['user', 'societe']
    })
    if (!association) {
      throw new NotFoundException(`SocieteUser with ID ${id} not found`)
    }
    return association
  }

  async deactivate(id: string): Promise<SocieteUser> {
    await this.societeUserRepository.update(id, { actif: false })
    const association = await this.societeUserRepository.findOne({
      where: { id },
      relations: ['user', 'societe']
    })
    if (!association) {
      throw new NotFoundException(`SocieteUser with ID ${id} not found`)
    }
    return association
  }

  async updateLastActivity(userId: string, societeId: string): Promise<void> {
    const association = await this.findUserSociete(userId, societeId)
    if (association) {
      await this.societeUserRepository.update(association.id, {
        lastActivityAt: new Date()
      })
    }
  }

  async grantPermissions(id: string, permissions: string[]): Promise<SocieteUser> {
    const association = await this.societeUserRepository.findOne({ where: { id } })
    if (association) {
      const existingPermissions = association.permissions || []
      const newPermissions = [...new Set([...existingPermissions, ...permissions])]
      
      await this.societeUserRepository.update(id, {
        permissions: newPermissions
      })
    }
    
    const updatedAssociation = await this.societeUserRepository.findOne({
      where: { id },
      relations: ['user', 'societe']
    })
    if (!updatedAssociation) {
      throw new NotFoundException(`SocieteUser with ID ${id} not found`)
    }
    return updatedAssociation
  }

  async revokePermissions(id: string, permissions: string[]): Promise<SocieteUser> {
    const association = await this.societeUserRepository.findOne({ where: { id } })
    if (association) {
      const existingPermissions = association.permissions || []
      const newPermissions = existingPermissions.filter(p => !permissions.includes(p))
      
      await this.societeUserRepository.update(id, {
        permissions: newPermissions
      })
    }
    
    const updatedAssociation = await this.societeUserRepository.findOne({
      where: { id },
      relations: ['user', 'societe']
    })
    if (!updatedAssociation) {
      throw new NotFoundException(`SocieteUser with ID ${id} not found`)
    }
    return updatedAssociation
  }
}