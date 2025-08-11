import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { PartnerAddress, AddressType, AddressStatus } from '../entities/partner-address.entity'
import type { IPartnerAddressRepository } from '../services/partner.service'

@Injectable()
export class PartnerAddressRepository implements IPartnerAddressRepository {
  constructor(
    @InjectRepository(PartnerAddress, 'tenant')
    private readonly repository: Repository<PartnerAddress>
  ) {}

  async create(data: Partial<PartnerAddress>): Promise<PartnerAddress> {
    const entity = this.repository.create(data)
    return await this.repository.save(entity)
  }

  async findById(id: string): Promise<PartnerAddress | null> {
    return await this.repository.findOne({ where: { id } })
  }

  async findByPartner(partnerId: string): Promise<PartnerAddress[]> {
    return await this.repository.find({
      where: { partnerId, status: AddressStatus.ACTIVE },
      order: { isDefault: 'DESC', type: 'ASC', libelle: 'ASC' }
    })
  }

  async findByType(partnerId: string, type: AddressType): Promise<PartnerAddress[]> {
    return await this.repository.find({
      where: { partnerId, type, status: AddressStatus.ACTIVE },
      order: { isDefault: 'DESC', libelle: 'ASC' }
    })
  }

  async findDefaultAddress(partnerId: string, type?: AddressType): Promise<PartnerAddress | null> {
    const where: any = { partnerId, isDefault: true, status: AddressStatus.ACTIVE }
    if (type) {
      where.type = type
    }
    return await this.repository.findOne({ where })
  }

  async save(entity: PartnerAddress): Promise<PartnerAddress> {
    return await this.repository.save(entity)
  }

  async delete(id: string): Promise<void> {
    await this.repository.softDelete(id)
  }
}