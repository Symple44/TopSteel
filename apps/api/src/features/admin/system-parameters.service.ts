import { ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import type {
  CreateSystemParameterDto,
  SystemParameterQueryDto,
  UpdateSystemParameterDto,
} from './dto/system-parameter.dto'
import { SystemParameter } from '@prisma/client'
import {
  type ParameterCategory,
  type ParameterType,
} from './entitites/system-parameter.entity'

@Injectable()
export class SystemParametersService {
  constructor(
    @InjectRepository(SystemParameter, 'auth')
    private readonly _systemParameterRepository: Repository<SystemParameter>
  ) {}

  async create(createDto: CreateSystemParameterDto): Promise<SystemParameter> {
    const existingParameter = await this._systemParameterRepository.findOne({
      where: { key: createDto.key },
    })

    if (existingParameter) {
      throw new ConflictException(`Parameter with key '${createDto.key}' already exists`)
    }

    const parameter = this._systemParameterRepository.create(createDto)
    return this._systemParameterRepository.save(parameter)
  }

  async findAll(query?: SystemParameterQueryDto): Promise<SystemParameter[]> {
    const queryBuilder = this._systemParameterRepository
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
    const parameter = await this._systemParameterRepository.findOne({
      where: { key },
    })

    if (!parameter) {
      throw new NotFoundException(`Parameter with key '${key}' not found`)
    }

    return parameter
  }

  async findByCategory(category: ParameterCategory): Promise<SystemParameter[]> {
    return this._systemParameterRepository.find({
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
    return this._systemParameterRepository.save(parameter)
  }

  async remove(key: string): Promise<void> {
    const parameter = await this.findByKey(key)

    if (!parameter.isEditable) {
      throw new ConflictException(`Parameter '${key}' cannot be deleted`)
    }

    await this._systemParameterRepository.remove(parameter)
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
      return Number.isNaN(value) ? defaultValue || 0 : value
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

    return parameters.reduce(
      (acc, param) => {
        if (!acc[param.category]) {
          acc[param.category] = []
        }
        acc[param.category].push(param)
        return acc
      },
      {} as Record<string, SystemParameter[]>
    )
  }

  // Méthode pour mettre à jour plusieurs paramètres en une fois

  async updateMultiple(updates: Array<{ key: string; value: string }>): Promise<SystemParameter[]> {
    const results: SystemParameter[] = []

    for (const update of updates) {
      try {
        // Essayer de mettre à jour le paramètre existant
        const parameter = await this.update(update.key, { value: update.value })
        results.push(parameter)
      } catch (_error) {
        // Si le paramètre n'existe pas, le créer
        try {
          const newParameter = await this.create({
            key: update.key,
            value: update.value,
            type: this.getTypeFromKey(update.key) as ParameterType,
            category: this.getCategoryFromKey(update.key) as ParameterCategory,
            description: this.getDescriptionFromKey(update.key),
            defaultValue: update.value,
            isEditable: true,
            isSecret: this.isSecretKey(update.key),
          })
          results.push(newParameter)
        } catch (_createError) {}
      }
    }

    return results
  }

  // Méthode utilitaire pour déterminer la catégorie à partir de la clé
  private getCategoryFromKey(key: string): string {
    if (key.startsWith('elasticsearch.')) return 'ELASTICSEARCH'
    if (key.startsWith('COMPANY_')) return 'GENERAL'
    if (key.startsWith('PROJECT_')) return 'PROJETS'
    if (key.startsWith('PRODUCTION_')) return 'PRODUCTION'
    if (key.startsWith('STOCK_')) return 'STOCKS'
    if (
      key.startsWith('PASSWORD_') ||
      key.startsWith('SESSION_') ||
      key.startsWith('TWO_FACTOR_') ||
      key.startsWith('GOOGLE_') ||
      key.startsWith('MICROSOFT_')
    )
      return 'SECURITY'
    return 'GENERAL'
  }

  // Méthode utilitaire pour générer une description à partir de la clé
  private getDescriptionFromKey(key: string): string {
    const descriptions: Record<string, string> = {
      'elasticsearch.url': 'URL du serveur Elasticsearch',
      'elasticsearch.username': "Nom d'utilisateur Elasticsearch",
      'elasticsearch.password': 'Mot de passe Elasticsearch',
      'elasticsearch.enableAuth': "Activer l'authentification Elasticsearch",
      'elasticsearch.indexPrefix': 'Préfixe des index Elasticsearch',
      'elasticsearch.maxRetries': 'Nombre maximum de tentatives de reconnexion',
      'elasticsearch.requestTimeout': 'Timeout des requêtes en millisecondes',
      'elasticsearch.batchSize': "Taille des lots pour l'indexation",
      'elasticsearch.enableLogging': 'Activer les logs détaillés Elasticsearch',
    }
    return descriptions[key] || `Paramètre ${key}`
  }

  // Méthode utilitaire pour déterminer le type à partir de la clé
  private getTypeFromKey(key: string): string {
    if (key.includes('enable') || key.includes('Enable')) return 'BOOLEAN'
    if (
      key.includes('retries') ||
      key.includes('timeout') ||
      key.includes('size') ||
      key.includes('Size')
    )
      return 'NUMBER'
    return 'STRING'
  }

  // Méthode utilitaire pour déterminer si une clé est secrète
  private isSecretKey(key: string): boolean {
    return key.includes('password') || key.includes('secret') || key.includes('token')
  }
}
