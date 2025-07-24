import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, IsNull } from 'typeorm'
import { SharedDataRegistry } from '../entities/shared-data-registry.entity'

@Injectable()
export class SharedDataRegistryService {
  constructor(
    @InjectRepository(SharedDataRegistry, 'auth')
    private sharedDataRegistryRepository: Repository<SharedDataRegistry>,
  ) {}

  async findAll(): Promise<SharedDataRegistry[]> {
    return this.sharedDataRegistryRepository.find({
      where: { deletedAt: IsNull() }
    })
  }

  async findByOwner(ownerSocieteId: string): Promise<SharedDataRegistry[]> {
    return this.sharedDataRegistryRepository.find({
      where: { ownerSocieteId, deletedAt: IsNull() }
    })
  }

  async findSharedWith(societeId: string): Promise<SharedDataRegistry[]> {
    return this.sharedDataRegistryRepository
      .createQueryBuilder('registry')
      .where('registry.deleted_at IS NULL')
      .andWhere(`
        registry.share_scope = 'PUBLIC' 
        OR registry.owner_societe_id = :societeId 
        OR :societeId = ANY(registry.shared_with_societe_ids)
      `, { societeId })
      .getMany()
  }

  async findByType(type: string, societeId?: string): Promise<SharedDataRegistry[]> {
    const query = this.sharedDataRegistryRepository
      .createQueryBuilder('registry')
      .where('registry.type = :type', { type })
      .andWhere('registry.deleted_at IS NULL')

    if (societeId) {
      query.andWhere(`
        registry.share_scope = 'PUBLIC' 
        OR registry.owner_societe_id = :societeId 
        OR :societeId = ANY(registry.shared_with_societe_ids)
      `, { societeId })
    }

    return query.getMany()
  }

  async create(registryData: Partial<SharedDataRegistry>): Promise<SharedDataRegistry> {
    const registry = this.sharedDataRegistryRepository.create(registryData)
    return this.sharedDataRegistryRepository.save(registry)
  }

  async update(id: string, registryData: Partial<SharedDataRegistry>): Promise<SharedDataRegistry> {
    await this.sharedDataRegistryRepository.update(id, registryData)
    const registry = await this.sharedDataRegistryRepository.findOne({ where: { id } })
    if (!registry) {
      throw new NotFoundException(`Registry with ID ${id} not found`)
    }
    return registry
  }

  async shareWith(id: string, societeIds: string[]): Promise<void> {
    const registry = await this.sharedDataRegistryRepository.findOne({ where: { id } })
    if (!registry) {
      throw new NotFoundException(`Registry with ID ${id} not found`)
    }
    
    const existingIds = registry.sharedWithSocieteIds || []
    const newIds = [...new Set([...existingIds, ...societeIds])]
    
    await this.sharedDataRegistryRepository.update(id, {
      sharedWithSocieteIds: newIds
    })
  }

  async revokeShare(id: string, societeIds: string[]): Promise<void> {
    const registry = await this.sharedDataRegistryRepository.findOne({ where: { id } })
    if (!registry) {
      throw new NotFoundException(`Registry with ID ${id} not found`)
    }
    
    const existingIds = registry.sharedWithSocieteIds || []
    const newIds = existingIds.filter(sid => !societeIds.includes(sid))
    
    await this.sharedDataRegistryRepository.update(id, {
      sharedWithSocieteIds: newIds
    })
  }

  async incrementUsage(id: string): Promise<void> {
    await this.sharedDataRegistryRepository.update(id, {
      usageCount: () => 'usage_count + 1',
      lastUsedAt: new Date()
    })
  }

  async delete(id: string): Promise<void> {
    await this.sharedDataRegistryRepository.softDelete(id)
  }
}