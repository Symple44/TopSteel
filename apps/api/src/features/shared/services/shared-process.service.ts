import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { IsNull, type Repository } from 'typeorm'
import { SharedProcess } from '../entities/shared-process.entity'

@Injectable()
export class SharedProcessService {
  constructor(
    @InjectRepository(SharedProcess, 'shared')
    private _sharedProcessRepository: Repository<SharedProcess>,
  ) {}

  async findAll(): Promise<SharedProcess[]> {
    return this._sharedProcessRepository.find({
      where: { deletedAt: IsNull() },
    })
  }

  async findByCode(code: string): Promise<SharedProcess | null> {
    return this._sharedProcessRepository.findOne({
      where: { code, deletedAt: IsNull() },
    })
  }

  async findByType(type: string): Promise<SharedProcess[]> {
    return this._sharedProcessRepository.find({
      where: { type: type as any, deletedAt: IsNull() },
    })
  }

  async create(processData: Partial<SharedProcess>): Promise<SharedProcess> {
    const process = this._sharedProcessRepository.create(processData)
    return this._sharedProcessRepository.save(process)
  }

  async update(id: string, processData: Partial<SharedProcess>): Promise<SharedProcess> {
    await this._sharedProcessRepository.update(id, processData)
    const process = await this._sharedProcessRepository.findOne({ where: { id } })
    if (!process) {
      throw new NotFoundException(`Process with ID ${id} not found`)
    }
    return process
  }

  async delete(id: string): Promise<void> {
    await this._sharedProcessRepository.softDelete(id)
  }
}
