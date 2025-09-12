import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { IsNull, type Repository } from 'typeorm'
import type { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity'
import { SharedSupplier, type SupplierType } from '../entities/shared-supplier.entity'


@Injectable()
export class SharedSupplierService {
  constructor(
    @InjectRepository(SharedSupplier, 'shared')
    private _sharedSupplierRepository: Repository<SharedSupplier>
  ) {}

  async findAll(): Promise<SharedSupplier[]> {
    return this._sharedSupplierRepository.find({
      where: { deletedAt: IsNull() },
    })
  }

  async findByCode(code: string): Promise<SharedSupplier | null> {
    return this._sharedSupplierRepository.findOne({
      where: { code, deletedAt: IsNull() },
    })
  }

  async findByType(type: string): Promise<SharedSupplier[]> {
    return this._sharedSupplierRepository.find({
      where: { type: type as SupplierType, deletedAt: IsNull() },
    })
  }

  async create(supplierData: Partial<SharedSupplier>): Promise<SharedSupplier> {
    const supplier = this._sharedSupplierRepository.create(supplierData)
    return this._sharedSupplierRepository.save(supplier)
  }

  async update(
    id: string,
    supplierData: QueryDeepPartialEntity<SharedSupplier>
  ): Promise<SharedSupplier> {
    await this._sharedSupplierRepository.update(id, supplierData)
    const supplier = await this._sharedSupplierRepository.findOne({ where: { id } })
    if (!supplier) {
      throw new NotFoundException(`Supplier with ID ${id} not found`)
    }
    return supplier
  }

  async delete(id: string): Promise<void> {
    await this._sharedSupplierRepository.softDelete(id)
  }
}
