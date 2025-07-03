import type { Repository, FindOptionsWhere, DeepPartial } from 'typeorm'

export interface IBaseRepository<T> {
  findAll(options?: any): Promise<T[]>
  findById(id: number | string): Promise<T | null>
  create(data: DeepPartial<T>): Promise<T>
  update(id: number | string, data: DeepPartial<T>): Promise<T>
  delete(id: number | string): Promise<void>
}

export abstract class BaseRepository<T> implements IBaseRepository<T> {
  constructor(protected readonly repository: Repository<T>) {}

  async findAll(options?: any): Promise<T[]> {
    return this.repository.find(options)
  }

  async findById(id: number | string): Promise<T | null> {
    const where = { id } as FindOptionsWhere<T>
    return this.repository.findOne({ where })
  }

  async create(data: DeepPartial<T>): Promise<T> {
    const entity = this.repository.create(data)
    return this.repository.save(entity as T)
  }

  async update(id: number | string, data: DeepPartial<T>): Promise<T> {
    await this.repository.update(id, data)
    const updated = await this.findById(id)
    if (!updated) throw new Error(`Entity with id ${id} not found`)
    return updated
  }

  async delete(id: number | string): Promise<void> {
    await this.repository.delete(id)
  }
}
