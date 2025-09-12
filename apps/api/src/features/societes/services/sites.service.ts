import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import type { DeepPartial } from 'typeorm'
import { IsNull, type Repository } from 'typeorm'
import { Site } from '../entities/site.entity'

@Injectable()
export class SitesService {
  constructor(
    @InjectRepository(Site, 'auth')
    private _siteRepository: Repository<Site>
  ) {}

  async findAll(): Promise<Site[]> {
    return this._siteRepository.find({
      where: { deletedAt: IsNull() },
      relations: ['societe'],
    })
  }

  async findBySociete(societeId: string): Promise<Site[]> {
    return this._siteRepository.find({
      where: {
        societeId,
        deletedAt: IsNull(),
      },
      relations: ['societe'],
    })
  }

  async findById(id: string): Promise<Site | null> {
    return this._siteRepository.findOne({
      where: { id, deletedAt: IsNull() },
      relations: ['societe'],
    })
  }

  async findPrincipal(societeId: string): Promise<Site | null> {
    return this._siteRepository.findOne({
      where: {
        societeId,
        isPrincipal: true,
        deletedAt: IsNull(),
      },
      relations: ['societe'],
    })
  }

  async create(siteData: Partial<Site>): Promise<Site> {
    const site = this._siteRepository.create(siteData)
    return this._siteRepository.save(site)
  }

  async update(id: string, siteData: Partial<Site>): Promise<Site> {
    await this._siteRepository.update(id, siteData as DeepPartial<Site>)
    const site = await this._siteRepository.findOne({
      where: { id },
      relations: ['societe'],
    })
    if (!site) {
      throw new NotFoundException(`Site with ID ${id} not found`)
    }
    return site
  }

  async delete(id: string): Promise<void> {
    await this._siteRepository.softDelete(id)
  }

  async setPrincipal(id: string, societeId: string): Promise<Site> {
    // D'abord, retirer le statut principal des autres sites
    await this._siteRepository.update({ societeId }, { isPrincipal: false } as DeepPartial<Site>)

    // Puis définir le nouveau site principal
    await this._siteRepository.update(id, { isPrincipal: true } as DeepPartial<Site>)

    const site = await this.findById(id)
    if (!site) {
      throw new NotFoundException(`Site with ID ${id} not found`)
    }
    return site
  }

  async activate(id: string): Promise<Site> {
    await this._siteRepository.update(id, { actif: true } as DeepPartial<Site>)
    const site = await this.findById(id)
    if (!site) {
      throw new NotFoundException(`Site with ID ${id} not found`)
    }
    return site
  }

  async deactivate(id: string): Promise<Site> {
    await this._siteRepository.update(id, { actif: false } as DeepPartial<Site>)
    const site = await this.findById(id)
    if (!site) {
      throw new NotFoundException(`Site with ID ${id} not found`)
    }
    return site
  }
}
