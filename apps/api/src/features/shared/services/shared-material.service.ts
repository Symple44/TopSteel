import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { IsNull, type Repository } from 'typeorm'
import type { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity'
import { type MaterialType, SharedMaterial } from '../entities/shared-material.entity'


@Injectable()
export class SharedMaterialService {
  constructor(
    @InjectRepository(SharedMaterial, 'shared')
    private _sharedMaterialRepository: Repository<SharedMaterial>
  ) {}

  async findAll(): Promise<SharedMaterial[]> {
    return this._sharedMaterialRepository.find({
      where: { deletedAt: IsNull() },
    })
  }

  async findByCode(code: string): Promise<SharedMaterial | null> {
    return this._sharedMaterialRepository.findOne({
      where: { code, deletedAt: IsNull() },
    })
  }

  async findByType(type: string): Promise<SharedMaterial[]> {
    return this._sharedMaterialRepository.find({
      where: { type: type as MaterialType, deletedAt: IsNull() },
    })
  }

  async create(materialData: Partial<SharedMaterial>): Promise<SharedMaterial> {
    const material = this._sharedMaterialRepository.create(materialData)
    return this._sharedMaterialRepository.save(material)
  }

  async update(
    id: string,
    materialData: QueryDeepPartialEntity<SharedMaterial>
  ): Promise<SharedMaterial> {
    await this._sharedMaterialRepository.update(id, materialData)
    const material = await this._sharedMaterialRepository.findOne({ where: { id } })
    if (!material) {
      throw new NotFoundException(`Material with ID ${id} not found`)
    }
    return material
  }

  async delete(id: string): Promise<void> {
    await this._sharedMaterialRepository.softDelete(id)
  }
}
