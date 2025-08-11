import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { PartnerGroup, GroupStatus } from '../entities/partner-group.entity'
import type { IPartnerGroupRepository } from '../services/partner.service'

@Injectable()
export class PartnerGroupRepository implements IPartnerGroupRepository {
  constructor(
    @InjectRepository(PartnerGroup, 'tenant')
    private readonly repository: Repository<PartnerGroup>
  ) {}

  async create(data: Partial<PartnerGroup>): Promise<PartnerGroup> {
    const entity = this.repository.create(data)
    return await this.repository.save(entity)
  }

  async findById(id: string): Promise<PartnerGroup | null> {
    return await this.repository.findOne({ where: { id } })
  }

  async findBySociete(societeId: string): Promise<PartnerGroup[]> {
    return await this.repository.find({
      where: { societeId, status: GroupStatus.ACTIVE },
      order: { priority: 'ASC', name: 'ASC' }
    })
  }

  async findByCode(code: string, societeId: string): Promise<PartnerGroup | null> {
    return await this.repository.findOne({ 
      where: { code, societeId } 
    })
  }

  async save(entity: PartnerGroup): Promise<PartnerGroup> {
    return await this.repository.save(entity)
  }

  async delete(id: string): Promise<void> {
    await this.repository.softDelete(id)
  }
}