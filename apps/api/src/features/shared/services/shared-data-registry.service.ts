import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { IsNull, type Repository } from 'typeorm'
import { SharedDataRegistry } from '../entities/shared-data-registry.entity'

@Injectable()
export class SharedDataRegistryService {
  constructor(
    @InjectRepository(SharedDataRegistry, 'auth')
    private _sharedDataRegistryRepository: Repository<SharedDataRegistry>
  ) {}

  async findAll(): Promise<SharedDataRegistry[]> {
    return this._sharedDataRegistryRepository.find({
      where: { deletedAt: IsNull() },
    })
  }

  async findByOwner(ownerSocieteId: string): Promise<SharedDataRegistry[]> {
    return this._sharedDataRegistryRepository.find({
      where: { ownerSocieteId, deletedAt: IsNull() },
    })
  }

  async findSharedWith(societeId: string): Promise<SharedDataRegistry[]> {
    return this._sharedDataRegistryRepository
      .createQueryBuilder('registry')
      .where('registry.deleted_at IS NULL')
      .andWhere(
        `
        registry.share_scope = 'PUBLIC' 
        OR registry.owner_societe_id = :societeId 
        OR :societeId = ANY(registry.shared_with_societe_ids)
      `,
        { societeId }
      )
      .getMany()
  }

  async findByType(type: string, societeId?: string): Promise<SharedDataRegistry[]> {
    const query = this._sharedDataRegistryRepository
      .createQueryBuilder('registry')
      .where('registry.type = :type', { type })
      .andWhere('registry.deleted_at IS NULL')

    if (societeId) {
      query.andWhere(
        `
        registry.share_scope = 'PUBLIC' 
        OR registry.owner_societe_id = :societeId 
        OR :societeId = ANY(registry.shared_with_societe_ids)
      `,
        { societeId }
      )
    }

    return query.getMany()
  }

  async create(registryData: Partial<SharedDataRegistry>): Promise<SharedDataRegistry> {
    const registry = this._sharedDataRegistryRepository.create(registryData)
    return this._sharedDataRegistryRepository.save(registry)
  }

  async update(id: string, registryData: Partial<SharedDataRegistry>): Promise<SharedDataRegistry> {
    // Use type assertion to bypass strict TypeORM type checking for update operations
    await this._sharedDataRegistryRepository.update(id, registryData as Parameters<Repository<SharedDataRegistry>['update']>[1])
    const registry = await this._sharedDataRegistryRepository.findOne({ where: { id } })
    if (!registry) {
      throw new NotFoundException(`Registry with ID ${id} not found`)
    }
    return registry
  }

  async shareWith(id: string, societeIds: string[]): Promise<void> {
    const registry = await this._sharedDataRegistryRepository.findOne({ where: { id } })
    if (!registry) {
      throw new NotFoundException(`Registry with ID ${id} not found`)
    }

    const existingIds = registry.sharedWithSocieteIds || []
    const newIds = [...new Set([...existingIds, ...societeIds])]

    await this._sharedDataRegistryRepository.update(id, {
      sharedWithSocieteIds: newIds,
    } as Parameters<Repository<SharedDataRegistry>['update']>[1])
  }

  async revokeShare(id: string, societeIds: string[]): Promise<void> {
    const registry = await this._sharedDataRegistryRepository.findOne({ where: { id } })
    if (!registry) {
      throw new NotFoundException(`Registry with ID ${id} not found`)
    }

    const existingIds = registry.sharedWithSocieteIds || []
    const newIds = existingIds.filter((sid) => !societeIds.includes(sid))

    await this._sharedDataRegistryRepository.update(id, {
      sharedWithSocieteIds: newIds,
    } as Parameters<Repository<SharedDataRegistry>['update']>[1])
  }

  async incrementUsage(id: string): Promise<void> {
    await this._sharedDataRegistryRepository.update(id, {
      usageCount: (() => 'usage_count + 1') as unknown,
      lastUsedAt: new Date(),
    } as Parameters<Repository<SharedDataRegistry>['update']>[1])
  }

  async delete(id: string): Promise<void> {
    await this._sharedDataRegistryRepository.softDelete(id)
  }
}
