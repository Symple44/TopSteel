import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { DeepPartial, IsNull, type Repository } from 'typeorm'
import type { DeepPartial } from 'typeorm'
import { Societe, SocieteStatus } from '../entities/societe.entity'

@Injectable()
export class SocietesService {
  constructor(
    @InjectRepository(Societe, 'auth')
    private _societeRepository: Repository<Societe>
  ) {}

  async findAll(): Promise<Societe[]> {
    return this._societeRepository.find({
      where: { deletedAt: IsNull() },
      relations: ['sites'],
    })
  }

  async findById(id: string): Promise<Societe | null> {
    return this._societeRepository.findOne({
      where: { id, deletedAt: IsNull() },
    })
  }

  async findByCode(code: string): Promise<Societe | null> {
    return this._societeRepository.findOne({
      where: { code, deletedAt: IsNull() },
      relations: ['sites'],
    })
  }

  async findActive(): Promise<Societe[]> {
    return this._societeRepository.find({
      where: {
        status: SocieteStatus.ACTIVE,
        deletedAt: IsNull(),
      },
      relations: ['sites'],
    })
  }

  async create(societeData: Partial<Societe>): Promise<Societe> {
    // Générer le nom de la base de données
    if (!societeData.databaseName && societeData.code) {
      societeData.databaseName = `erp_topsteel_${societeData.code.toLowerCase()}`
    }

    const societe = this._societeRepository.create(societeData)
    return this._societeRepository.save(societe)
  }

  async update(id: string, societeData: Partial<Societe>): Promise<Societe> {
    await this._societeRepository.update(id, societeData as DeepPartial<Societe> as DeepPartial<any>)
    const societe = await this._societeRepository.findOne({
      where: { id },
      relations: ['sites'],
    })
    if (!societe) {
      throw new NotFoundException(`Société avec l'ID ${id} non trouvée`)
    }
    return societe
  }

  async delete(id: string): Promise<void> {
    await this._societeRepository.softDelete(id)
  }

  async activate(id: string): Promise<Societe> {
    await this._societeRepository.update(id, {
      status: SocieteStatus.ACTIVE,
      dateActivation: new Date(),
    } as DeepPartial<any>)
    const societe = await this.findById(id)
    if (!societe) {
      throw new NotFoundException(`Société avec l'ID ${id} non trouvée`)
    }
    return societe
  }

  async suspend(id: string): Promise<Societe> {
    await this._societeRepository.update(id, {
      status: SocieteStatus.SUSPENDED,
    } as DeepPartial<any>)
    const societe = await this.findById(id)
    if (!societe) {
      throw new NotFoundException(`Société avec l'ID ${id} non trouvée`)
    }
    return societe
  }

  async getStatistics(): Promise<{
    total: number
    active: number
    trial: number
    inactive: number
  }> {
    const total = await this._societeRepository.count({
      where: { deletedAt: IsNull() },
    })

    const active = await this._societeRepository.count({
      where: {
        status: SocieteStatus.ACTIVE,
        deletedAt: IsNull(),
      },
    })

    const trial = await this._societeRepository.count({
      where: {
        status: SocieteStatus.TRIAL,
        deletedAt: IsNull(),
      },
    })

    return {
      total,
      active,
      trial,
      inactive: total - active - trial,
    }
  }
}
