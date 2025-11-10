import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Contact, ContactStatus } from '../entities/contact.entity'
import { IContactRepository } from '../services/partner.service'

@Injectable()
export class ContactRepository implements IContactRepository {
  constructor(
    @InjectRepository(Contact, 'tenant')
    private readonly repository: Repository<Contact>
  ) {}

  async create(data: Partial<Contact>): Promise<Contact> {
    const entity = this.repository.create(data)
    return await this.repository.save(entity)
  }

  async findById(id: string): Promise<Contact | null> {
    return await this.repository.findOne({ where: { id } })
  }

  async findByPartner(partnerId: string): Promise<Contact[]> {
    return await this.repository.find({
      where: { partnerId, status: ContactStatus.ACTIF },
      order: { isPrincipal: 'DESC', nom: 'ASC' },
    })
  }

  async findPrincipalContact(partnerId: string): Promise<Contact | null> {
    return await this.repository.findOne({
      where: { partnerId, isPrincipal: true, status: ContactStatus.ACTIF },
    })
  }

  async findByEmail(email: string, societeId: string): Promise<Contact[]> {
    return await this.repository.find({
      where: { email, societeId },
    })
  }

  async save(entity: Contact): Promise<Contact> {
    return await this.repository.save(entity)
  }

  async delete(id: string): Promise<void> {
    await this.repository.softDelete(id)
  }
}
