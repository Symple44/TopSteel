import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { IsNull, type Repository } from 'typeorm'
import type { DeepPartial } from 'typeorm'
import {
  type QualityStandardType,
  SharedQualityStandard,
} from '../entities/shared-quality-standard.entity'

@Injectable()
export class SharedQualityStandardService {
  constructor(
    @InjectRepository(SharedQualityStandard, 'shared')
    private _sharedQualityStandardRepository: Repository<SharedQualityStandard>
  ) {}

  async findAll(): Promise<SharedQualityStandard[]> {
    return this._sharedQualityStandardRepository.find({
      where: { deletedAt: IsNull() },
    })
  }

  async findByCode(code: string): Promise<SharedQualityStandard | null> {
    return this._sharedQualityStandardRepository.findOne({
      where: { code, deletedAt: IsNull() },
    })
  }

  async findByType(type: string): Promise<SharedQualityStandard[]> {
    return this._sharedQualityStandardRepository.find({
      where: { type: type as QualityStandardType, deletedAt: IsNull() },
    })
  }

  async create(standardData: Partial<SharedQualityStandard>): Promise<SharedQualityStandard> {
    const standard = this._sharedQualityStandardRepository.create(standardData)
    return this._sharedQualityStandardRepository.save(standard)
  }

  async update(
    id: string,
    standardData: Partial<SharedQualityStandard>
  ): Promise<SharedQualityStandard> {
    await this._sharedQualityStandardRepository.update(id, standardData as unknown as DeepPartial<any>)
    const standard = await this._sharedQualityStandardRepository.findOne({ where: { id } })
    if (!standard) {
      throw new NotFoundException(`Quality standard with ID ${id} not found`)
    }
    return standard
  }

  async delete(id: string): Promise<void> {
    await this._sharedQualityStandardRepository.softDelete(id)
  }
}
