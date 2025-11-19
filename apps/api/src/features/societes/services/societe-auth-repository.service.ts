import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import type {
  ISocieteRepository,
  ISocieteUserRepository,
} from '../../../domains/auth/core/interfaces/societe-repository.interface'
import { Societe, SocieteStatus } from '../entities/societe.entity'
import { SocieteUser } from '../entities/societe-user.entity'
import { Societe, SocieteUser } from '@prisma/client'


/**
 * Implémentation du repository société pour l'authentification
 */
@Injectable()
export class SocieteAuthRepositoryService implements ISocieteRepository {
  constructor(
    @InjectRepository(Societe, 'auth')
    private readonly societeRepository: Repository<Societe>
  ) {}

  async findById(id: string): Promise<Societe | null> {
    return await this.societeRepository.findOne({
      where: { id },
      select: ['id', 'nom', 'code', 'status'],
    })
  }

  async findByCode(code: string): Promise<Societe | null> {
    return await this.societeRepository.findOne({
      where: { code },
      select: ['id', 'nom', 'code', 'status'],
    })
  }

  async findActiveSocietes(): Promise<Societe[]> {
    return await this.societeRepository.find({
      where: { status: SocieteStatus.ACTIVE },
      select: ['id', 'nom', 'code', 'status'],
      order: { nom: 'ASC' },
    })
  }
}

/**
 * Implémentation du repository relation utilisateur-société pour l'authentification
 */
@Injectable()
export class SocieteUserAuthRepositoryService implements ISocieteUserRepository {
  constructor(
    @InjectRepository(SocieteUser, 'auth')
    private readonly societeUserRepository: Repository<SocieteUser>
  ) {}

  async findByUserId(userId: string): Promise<SocieteUser[]> {
    return await this.societeUserRepository.find({
      where: { userId },
      relations: ['societe'],
      select: {
        id: true,
        userId: true,
        societeId: true,
        isDefault: true,
        actif: true,
        societe: {
          id: true,
          nom: true,
          code: true,
          status: true,
        },
      },
    })
  }

  async findByUserAndSociete(userId: string, societeId: string): Promise<SocieteUser | null> {
    return await this.societeUserRepository.findOne({
      where: { userId, societeId },
      relations: ['societe'],
      select: {
        id: true,
        userId: true,
        societeId: true,
        isDefault: true,
        actif: true,
        societe: {
          id: true,
          nom: true,
          code: true,
          status: true,
        },
      },
    })
  }

  async userBelongsToSociete(userId: string, societeId: string): Promise<boolean> {
    const count = await this.societeUserRepository.count({
      where: { userId, societeId },
    })
    return count > 0
  }

  async updateDefaultSociete(userId: string, societeId: string): Promise<void> {
    // Retirer le défaut de toutes les sociétés de l'utilisateur
    await this.societeUserRepository.update({ userId }, { isDefault: false })

    // Définir la nouvelle société par défaut
    await this.societeUserRepository.update({ userId, societeId }, { isDefault: true })
  }
}

