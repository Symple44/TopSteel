import type {
  DeepPartial,
  FindManyOptions,
  FindOptionsWhere,
  ObjectLiteral,
  Repository,
} from 'typeorm'

export interface IBaseRepository<T extends ObjectLiteral> {
  findAll(options?: FindManyOptions<T>): Promise<T[]>
  findById(id: string | number): Promise<T | null>
  create(data: DeepPartial<T>): Promise<T>
  update(id: string | number, data: DeepPartial<T>): Promise<T>
  delete(id: string | number): Promise<void>
}

export abstract class BaseRepository<T extends ObjectLiteral> implements IBaseRepository<T> {
  constructor(protected readonly repository: Repository<T>) {}

  async findAll(options?: FindManyOptions<T>): Promise<T[]> {
    return this.repository.find(options)
  }

  async findById(id: string | number): Promise<T | null> {
    const where: FindOptionsWhere<T> = { id } as unknown as FindOptionsWhere<T>
    return this.repository.findOne({ where })
  }

  async create(data: DeepPartial<T>): Promise<T> {
    const entity = this.repository.create(data)
    return this.repository.save(entity)
  }

  async update(id: string | number, data: DeepPartial<T>): Promise<T> {
    await this.repository.update(id, data as DeepPartial<T>)
    const updated = await this.findById(id)
    if (!updated) throw new Error(`Entity with id ${id} not found`)
    return updated
  }

  async delete(id: string | number): Promise<void> {
    await this.repository.delete(id)
  }

  async findBy(criteria: FindOptionsWhere<T>): Promise<T[]> {
    return this.repository.findBy(criteria)
  }

  async findOneBy(criteria: FindOptionsWhere<T>): Promise<T | null> {
    return this.repository.findOneBy(criteria)
  }

  async count(options?: FindManyOptions<T>): Promise<number> {
    return this.repository.count(options)
  }

  async exists(criteria: FindOptionsWhere<T>): Promise<boolean> {
    const count = await this.repository.countBy(criteria)
    return count > 0
  }

  getRepository(): Repository<T> {
    return this.repository
  }
}
