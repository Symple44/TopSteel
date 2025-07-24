import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, IsNull } from 'typeorm'
import { SharedMaterial } from '../entities/shared-material.entity'

@Injectable()
export class SharedMaterialService {
  constructor(
    @InjectRepository(SharedMaterial, 'shared')
    private sharedMaterialRepository: Repository<SharedMaterial>,
  ) {}

  async findAll(): Promise<SharedMaterial[]> {
    return this.sharedMaterialRepository.find({
      where: { deletedAt: IsNull() }
    })
  }

  async findByCode(code: string): Promise<SharedMaterial | null> {
    return this.sharedMaterialRepository.findOne({
      where: { code, deletedAt: IsNull() }
    })
  }

  async findByType(type: string): Promise<SharedMaterial[]> {
    return this.sharedMaterialRepository.find({
      where: { type: type as any, deletedAt: IsNull() }
    })
  }

  async create(materialData: Partial<SharedMaterial>): Promise<SharedMaterial> {
    const material = this.sharedMaterialRepository.create(materialData)
    return this.sharedMaterialRepository.save(material)
  }

  async update(id: string, materialData: Partial<SharedMaterial>): Promise<SharedMaterial> {
    await this.sharedMaterialRepository.update(id, materialData)
    const material = await this.sharedMaterialRepository.findOne({ where: { id } })
    if (!material) {
      throw new NotFoundException(`Material with ID ${id} not found`)
    }
    return material
  }

  async delete(id: string): Promise<void> {
    await this.sharedMaterialRepository.softDelete(id)
  }
}