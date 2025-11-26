import { ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../core/database/prisma/prisma.service'
import type {
  CreateSystemParameterDto,
  SystemParameterQueryDto,
  UpdateSystemParameterDto,
  ParameterCategory,
  ParameterType,
} from './dto/system-parameter.dto'
import type { SystemParameter } from '@prisma/client'

@Injectable()
export class SystemParametersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDto: CreateSystemParameterDto): Promise<SystemParameter> {
    const existingParameter = await this.prisma.systemParameter.findFirst({
      where: { key: createDto.key },
    })

    if (existingParameter) {
      throw new ConflictException(`Parameter with key '${createDto.key}' already exists`)
    }

    return this.prisma.systemParameter.create({
      data: createDto,
    })
  }

  async findAll(query?: SystemParameterQueryDto): Promise<SystemParameter[]> {
    const where: any = {}

    if (query?.category) {
      where.category = query.category
    }

    if (query?.search) {
      where.OR = [
        { key: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ]
    }

    return this.prisma.systemParameter.findMany({
      where,
      orderBy: [
        { category: 'asc' },
        { key: 'asc' },
      ],
    })
  }

  async findByKey(key: string): Promise<SystemParameter> {
    const parameter = await this.prisma.systemParameter.findFirst({
      where: { key },
    })

    if (!parameter) {
      throw new NotFoundException(`Parameter with key '${key}' not found`)
    }

    return parameter
  }

  async findByCategory(category: ParameterCategory): Promise<SystemParameter[]> {
    return this.prisma.systemParameter.findMany({
      where: { category },
      orderBy: { key: 'asc' },
    })
  }

  async update(key: string, updateDto: UpdateSystemParameterDto): Promise<SystemParameter> {
    const parameter = await this.findByKey(key)

    if (!parameter.isEditable) {
      throw new ConflictException(`Parameter '${key}' is not editable`)
    }

    return this.prisma.systemParameter.update({
      where: { id: parameter.id },
      data: updateDto,
    })
  }

  async remove(key: string): Promise<void> {
    const parameter = await this.findByKey(key)

    if (!parameter.isEditable) {
      throw new ConflictException(`Parameter '${key}' cannot be deleted`)
    }

    await this.prisma.systemParameter.delete({
      where: { id: parameter.id },
    })
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
        const category = param.category || 'GENERAL'
        if (!acc[category]) {
          acc[category] = []
        }
        acc[category].push(param)
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
        } catch (_createError) {
          // Ignore creation errors
        }
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
