import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, IsNull } from 'typeorm'
import { SharedSupplier } from '../entities/shared-supplier.entity'

@Injectable()
export class SharedSupplierService {
  constructor(
    @InjectRepository(SharedSupplier, 'shared')
    private sharedSupplierRepository: Repository<SharedSupplier>,
  ) {}

  async findAll(): Promise<SharedSupplier[]> {
    return this.sharedSupplierRepository.find({
      where: { deletedAt: IsNull() }
    })
  }

  async findByCode(code: string): Promise<SharedSupplier | null> {
    return this.sharedSupplierRepository.findOne({
      where: { code, deletedAt: IsNull() }
    })
  }

  async findByType(type: string): Promise<SharedSupplier[]> {
    return this.sharedSupplierRepository.find({
      where: { type: type as any, deletedAt: IsNull() }
    })
  }

  async create(supplierData: Partial<SharedSupplier>): Promise<SharedSupplier> {
    const supplier = this.sharedSupplierRepository.create(supplierData)
    return this.sharedSupplierRepository.save(supplier)
  }

  async update(id: string, supplierData: Partial<SharedSupplier>): Promise<SharedSupplier> {
    await this.sharedSupplierRepository.update(id, supplierData)
    const supplier = await this.sharedSupplierRepository.findOne({ where: { id } })
    if (!supplier) {
      throw new NotFoundException(`Supplier with ID ${id} not found`)
    }
    return supplier
  }

  async delete(id: string): Promise<void> {
    await this.sharedSupplierRepository.softDelete(id)
  }
}