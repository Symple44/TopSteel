import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { PartnerSite, SiteStatus } from '../entities/partner-site.entity'
import { IPartnerSiteRepository } from '../services/partner.service'

@Injectable()
export class PartnerSiteRepository implements IPartnerSiteRepository {
  constructor(
    @InjectRepository(PartnerSite, 'tenant')
    private readonly repository: Repository<PartnerSite>
  ) {}

  async create(data: Partial<PartnerSite>): Promise<PartnerSite> {
    const entity = this.repository.create(data)
    return await this.repository.save(entity)
  }

  async findById(id: string): Promise<PartnerSite | null> {
    return await this.repository.findOne({ where: { id } })
  }

  async findByPartner(partnerId: string): Promise<PartnerSite[]> {
    return await this.repository.find({
      where: { partnerId, status: SiteStatus.ACTIF },
      order: { isPrincipal: 'DESC', nom: 'ASC' },
    })
  }

  async findPrincipalSite(partnerId: string): Promise<PartnerSite | null> {
    return await this.repository.findOne({
      where: { partnerId, isPrincipal: true, status: SiteStatus.ACTIF },
    })
  }

  async findByCode(code: string, partnerId: string): Promise<PartnerSite | null> {
    return await this.repository.findOne({
      where: { code, partnerId },
    })
  }

  async findDeliverySites(partnerId: string): Promise<PartnerSite[]> {
    return await this.repository.find({
      where: {
        partnerId,
        accepteLivraisons: true,
        status: SiteStatus.ACTIF,
      },
      order: { nom: 'ASC' },
    })
  }

  async save(entity: PartnerSite): Promise<PartnerSite> {
    return await this.repository.save(entity)
  }

  async delete(id: string): Promise<void> {
    await this.repository.softDelete(id)
  }
}
