import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, IsNull } from 'typeorm'
import { Site } from '../entities/site.entity'

@Injectable()
export class SitesService {
  constructor(
    @InjectRepository(Site, 'auth')
    private siteRepository: Repository<Site>,
  ) {}

  async findAll(): Promise<Site[]> {
    return this.siteRepository.find({
      where: { deletedAt: IsNull() },
      relations: ['societe']
    })
  }

  async findBySociete(societeId: string): Promise<Site[]> {
    return this.siteRepository.find({
      where: { 
        societeId,
        deletedAt: IsNull() 
      },
      relations: ['societe']
    })
  }

  async findById(id: string): Promise<Site | null> {
    return this.siteRepository.findOne({
      where: { id, deletedAt: IsNull() },
      relations: ['societe']
    })
  }

  async findPrincipal(societeId: string): Promise<Site | null> {
    return this.siteRepository.findOne({
      where: { 
        societeId,
        isPrincipal: true,
        deletedAt: IsNull() 
      },
      relations: ['societe']
    })
  }

  async create(siteData: Partial<Site>): Promise<Site> {
    const site = this.siteRepository.create(siteData)
    return this.siteRepository.save(site)
  }

  async update(id: string, siteData: Partial<Site>): Promise<Site> {
    await this.siteRepository.update(id, siteData)
    const site = await this.siteRepository.findOne({ 
      where: { id },
      relations: ['societe']
    })
    if (!site) {
      throw new NotFoundException(`Site with ID ${id} not found`)
    }
    return site
  }

  async delete(id: string): Promise<void> {
    await this.siteRepository.softDelete(id)
  }

  async setPrincipal(id: string, societeId: string): Promise<Site> {
    // D'abord, retirer le statut principal des autres sites
    await this.siteRepository.update(
      { societeId },
      { isPrincipal: false }
    )

    // Puis définir le nouveau site principal
    await this.siteRepository.update(id, { isPrincipal: true })
    
    const site = await this.findById(id)
    if (!site) {
      throw new NotFoundException(`Site with ID ${id} not found`)
    }
    return site
  }

  async activate(id: string): Promise<Site> {
    await this.siteRepository.update(id, { actif: true })
    const site = await this.findById(id)
    if (!site) {
      throw new NotFoundException(`Site with ID ${id} not found`)
    }
    return site
  }

  async deactivate(id: string): Promise<Site> {
    await this.siteRepository.update(id, { actif: false })
    const site = await this.findById(id)
    if (!site) {
      throw new NotFoundException(`Site with ID ${id} not found`)
    }
    return site
  }
}