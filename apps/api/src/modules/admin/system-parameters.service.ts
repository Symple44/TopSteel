import { Injectable, NotFoundException, ConflictException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { SystemParameter, ParameterType, ParameterCategory } from './entitites/system-parameter.entity'
import { 
  CreateSystemParameterDto, 
  UpdateSystemParameterDto, 
  SystemParameterQueryDto 
} from './dto/system-parameter.dto'

@Injectable()
export class SystemParametersService {
  constructor(
    @InjectRepository(SystemParameter)
    private readonly systemParameterRepository: Repository<SystemParameter>,
  ) {}

  async create(createDto: CreateSystemParameterDto): Promise<SystemParameter> {
    const existingParameter = await this.systemParameterRepository.findOne({
      where: { key: createDto.key },
    })

    if (existingParameter) {
      throw new ConflictException(`Parameter with key '${createDto.key}' already exists`)
    }

    const parameter = this.systemParameterRepository.create(createDto)
    return this.systemParameterRepository.save(parameter)
  }

  async findAll(query?: SystemParameterQueryDto): Promise<SystemParameter[]> {
    const queryBuilder = this.systemParameterRepository
      .createQueryBuilder('parameter')
      .orderBy('parameter.category', 'ASC')
      .addOrderBy('parameter.key', 'ASC')

    if (query?.category) {
      queryBuilder.andWhere('parameter.category = :category', { category: query.category })
    }

    if (query?.search) {
      queryBuilder.andWhere(
        '(parameter.key ILIKE :search OR parameter.description ILIKE :search)',
        { search: `%${query.search}%` }
      )
    }

    return queryBuilder.getMany()
  }

  async findByKey(key: string): Promise<SystemParameter> {
    const parameter = await this.systemParameterRepository.findOne({
      where: { key },
    })

    if (!parameter) {
      throw new NotFoundException(`Parameter with key '${key}' not found`)
    }

    return parameter
  }

  async findByCategory(category: ParameterCategory): Promise<SystemParameter[]> {
    return this.systemParameterRepository.find({
      where: { category },
      order: { key: 'ASC' },
    })
  }

  async update(key: string, updateDto: UpdateSystemParameterDto): Promise<SystemParameter> {
    const parameter = await this.findByKey(key)

    if (!parameter.isEditable) {
      throw new ConflictException(`Parameter '${key}' is not editable`)
    }

    Object.assign(parameter, updateDto)
    return this.systemParameterRepository.save(parameter)
  }

  async remove(key: string): Promise<void> {
    const parameter = await this.findByKey(key)

    if (!parameter.isEditable) {
      throw new ConflictException(`Parameter '${key}' cannot be deleted`)
    }

    await this.systemParameterRepository.remove(parameter)
  }

  // Méthodes utilitaires pour récupérer des valeurs typées
  async getStringValue(key: string, defaultValue?: string): Promise<string> {
    try {
      const parameter = await this.findByKey(key)
      return parameter.value || defaultValue || parameter.defaultValue || ''
    } catch {
      return defaultValue || ''
    }
  }

  async getNumberValue(key: string, defaultValue?: number): Promise<number> {
    try {
      const parameter = await this.findByKey(key)
      const value = parseFloat(parameter.value || parameter.defaultValue || '0')
      return isNaN(value) ? (defaultValue || 0) : value
    } catch {
      return defaultValue || 0
    }
  }

  async getBooleanValue(key: string, defaultValue?: boolean): Promise<boolean> {
    try {
      const parameter = await this.findByKey(key)
      const value = parameter.value || parameter.defaultValue || 'false'
      return value.toLowerCase() === 'true'
    } catch {
      return defaultValue || false
    }
  }

  async getJsonValue<T>(key: string, defaultValue?: T): Promise<T> {
    try {
      const parameter = await this.findByKey(key)
      const value = parameter.value || parameter.defaultValue || '{}'
      return JSON.parse(value) as T
    } catch {
      return defaultValue as T
    }
  }

  // Méthode pour obtenir tous les paramètres par catégorie (pour l'interface)
  async getParametersByCategory(): Promise<Record<string, SystemParameter[]>> {
    const parameters = await this.findAll()
    
    return parameters.reduce((acc, param) => {
      if (!acc[param.category]) {
        acc[param.category] = []
      }
      acc[param.category].push(param)
      return acc
    }, {} as Record<string, SystemParameter[]>)
  }

  // Méthode pour mettre à jour plusieurs paramètres en une fois
  async updateMultiple(updates: Array<{ key: string; value: string }>): Promise<SystemParameter[]> {
    const results: SystemParameter[] = []

    for (const update of updates) {
      try {
        const parameter = await this.update(update.key, { value: update.value })
        results.push(parameter)
      } catch (error) {
        // Log l'erreur mais continue avec les autres paramètres
        console.error(`Failed to update parameter ${update.key}:`, error)
      }
    }

    return results
  }
}