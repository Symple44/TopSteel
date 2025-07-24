import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, IsNull } from 'typeorm'
import { SharedQualityStandard } from '../entities/shared-quality-standard.entity'

@Injectable()
export class SharedQualityStandardService {
  constructor(
    @InjectRepository(SharedQualityStandard, 'shared')
    private sharedQualityStandardRepository: Repository<SharedQualityStandard>,
  ) {}

  async findAll(): Promise<SharedQualityStandard[]> {
    return this.sharedQualityStandardRepository.find({
      where: { deletedAt: IsNull() }
    })
  }

  async findByCode(code: string): Promise<SharedQualityStandard | null> {
    return this.sharedQualityStandardRepository.findOne({
      where: { code, deletedAt: IsNull() }
    })
  }

  async findByType(type: string): Promise<SharedQualityStandard[]> {
    return this.sharedQualityStandardRepository.find({
      where: { type: type as any, deletedAt: IsNull() }
    })
  }

  async create(standardData: Partial<SharedQualityStandard>): Promise<SharedQualityStandard> {
    const standard = this.sharedQualityStandardRepository.create(standardData)
    return this.sharedQualityStandardRepository.save(standard)
  }

  async update(id: string, standardData: Partial<SharedQualityStandard>): Promise<SharedQualityStandard> {
    await this.sharedQualityStandardRepository.update(id, standardData)
    const standard = await this.sharedQualityStandardRepository.findOne({ where: { id } })
    if (!standard) {
      throw new NotFoundException(`Quality standard with ID ${id} not found`)
    }
    return standard
  }

  async delete(id: string): Promise<void> {
    await this.sharedQualityStandardRepository.softDelete(id)
  }
}