import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, IsNull } from 'typeorm'
import { Societe, SocieteStatus } from '../entities/societe.entity'

@Injectable()
export class SocietesService {
  constructor(
    @InjectRepository(Societe, 'auth')
    private societeRepository: Repository<Societe>,
  ) {}

  async findAll(): Promise<Societe[]> {
    return this.societeRepository.find({
      where: { deletedAt: IsNull() },
      relations: ['sites']
    })
  }

  async findById(id: string): Promise<Societe | null> {
    return this.societeRepository.findOne({
      where: { id, deletedAt: IsNull() },
      relations: ['sites']
    })
  }

  async findByCode(code: string): Promise<Societe | null> {
    return this.societeRepository.findOne({
      where: { code, deletedAt: IsNull() },
      relations: ['sites']
    })
  }

  async findActive(): Promise<Societe[]> {
    return this.societeRepository.find({
      where: { 
        status: SocieteStatus.ACTIVE,
        deletedAt: IsNull() 
      },
      relations: ['sites']
    })
  }

  async create(societeData: Partial<Societe>): Promise<Societe> {
    // Générer le nom de la base de données
    if (!societeData.databaseName && societeData.code) {
      societeData.databaseName = `erp_topsteel_${societeData.code.toLowerCase()}`
    }

    const societe = this.societeRepository.create(societeData)
    return this.societeRepository.save(societe)
  }

  async update(id: string, societeData: Partial<Societe>): Promise<Societe> {
    await this.societeRepository.update(id, societeData)
    const societe = await this.societeRepository.findOne({ 
      where: { id },
      relations: ['sites']
    })
    if (!societe) {
      throw new NotFoundException(`Société avec l'ID ${id} non trouvée`)
    }
    return societe
  }

  async delete(id: string): Promise<void> {
    await this.societeRepository.softDelete(id)
  }

  async activate(id: string): Promise<Societe> {
    await this.societeRepository.update(id, { 
      status: SocieteStatus.ACTIVE,
      dateActivation: new Date()
    })
    const societe = await this.findById(id)
    if (!societe) {
      throw new NotFoundException(`Société avec l'ID ${id} non trouvée`)
    }
    return societe
  }

  async suspend(id: string): Promise<Societe> {
    await this.societeRepository.update(id, { 
      status: SocieteStatus.SUSPENDED
    })
    const societe = await this.findById(id)
    if (!societe) {
      throw new NotFoundException(`Société avec l'ID ${id} non trouvée`)
    }
    return societe
  }

  async getStatistics(): Promise<any> {
    const total = await this.societeRepository.count({
      where: { deletedAt: IsNull() }
    })
    
    const active = await this.societeRepository.count({
      where: { 
        status: SocieteStatus.ACTIVE,
        deletedAt: IsNull() 
      }
    })
    
    const trial = await this.societeRepository.count({
      where: { 
        status: SocieteStatus.TRIAL,
        deletedAt: IsNull() 
      }
    })

    return {
      total,
      active,
      trial,
      inactive: total - active - trial
    }
  }
}