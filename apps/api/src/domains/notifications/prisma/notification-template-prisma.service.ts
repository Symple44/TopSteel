import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '../../../core/database/prisma/prisma.service'
import type { NotificationTemplate, Prisma } from '@prisma/client'

/**
 * NotificationTemplatePrismaService - Phase 2.5
 *
 * Service pour gestion des templates de notification avec Prisma
 *
 * NotificationTemplate = Template réutilisable pour notifications
 * Permet de créer des messages standardisés avec variables
 *
 * Fonctionnalités:
 * - CRUD templates de notification
 * - Templates avec variables (Json)
 * - Types variés (email, push, sms, in-app)
 * - Activation/désactivation
 * - Rendu de templates avec données
 */
@Injectable()
export class NotificationTemplatePrismaService {
  private readonly logger = new Logger(NotificationTemplatePrismaService.name)

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Créer un template de notification
   */
  async createNotificationTemplate(data: {
    code: string
    name: string
    description?: string
    type: string
    template: string
    variables?: Record<string, any>
    isActive?: boolean
  }): Promise<NotificationTemplate> {
    this.logger.log(`Creating notification template: ${data.code}`)

    try {
      const template = await this.prisma.notificationTemplate.create({
        data: {
          code: data.code,
          name: data.name,
          description: data.description || null,
          type: data.type,
          template: data.template,
          variables: data.variables ? (data.variables as Prisma.InputJsonValue) : undefined,
          isActive: data.isActive !== undefined ? data.isActive : true,
        },
      })

      this.logger.log(`Notification template created: ${template.id}`)
      return template
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error creating notification template: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer un template par ID
   */
  async getNotificationTemplateById(id: string): Promise<NotificationTemplate | null> {
    this.logger.debug(`Getting notification template: ${id}`)

    try {
      return await this.prisma.notificationTemplate.findUnique({
        where: { id },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting notification template: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer un template par code
   */
  async getNotificationTemplateByCode(code: string): Promise<NotificationTemplate | null> {
    this.logger.debug(`Getting notification template by code: ${code}`)

    try {
      return await this.prisma.notificationTemplate.findUnique({
        where: { code },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting notification template by code: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Lister tous les templates
   */
  async getAllNotificationTemplates(includeInactive = false): Promise<NotificationTemplate[]> {
    this.logger.debug('Getting all notification templates')

    try {
      return await this.prisma.notificationTemplate.findMany({
        where: includeInactive ? {} : { isActive: true },
        orderBy: { name: 'asc' },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting all notification templates: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer les templates actifs
   */
  async getActiveNotificationTemplates(): Promise<NotificationTemplate[]> {
    this.logger.debug('Getting active notification templates')

    return this.getAllNotificationTemplates(false)
  }

  /**
   * Récupérer les templates par type
   */
  async getTemplatesByType(type: string, includeInactive = false): Promise<NotificationTemplate[]> {
    this.logger.debug(`Getting notification templates by type: ${type}`)

    try {
      return await this.prisma.notificationTemplate.findMany({
        where: {
          type,
          ...(includeInactive ? {} : { isActive: true }),
        },
        orderBy: { name: 'asc' },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting notification templates by type: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Mettre à jour un template
   */
  async updateNotificationTemplate(
    id: string,
    data: {
      name?: string
      description?: string
      type?: string
      template?: string
      variables?: Record<string, any>
      isActive?: boolean
    }
  ): Promise<NotificationTemplate> {
    this.logger.log(`Updating notification template: ${id}`)

    try {
      const updateData: any = {}

      if (data.name !== undefined) updateData.name = data.name
      if (data.description !== undefined) updateData.description = data.description
      if (data.type !== undefined) updateData.type = data.type
      if (data.template !== undefined) updateData.template = data.template
      if (data.variables !== undefined) updateData.variables = data.variables as Prisma.InputJsonValue
      if (data.isActive !== undefined) updateData.isActive = data.isActive

      const template = await this.prisma.notificationTemplate.update({
        where: { id },
        data: updateData,
      })

      this.logger.log(`Notification template updated: ${id}`)
      return template
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error updating notification template: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Activer/désactiver un template
   */
  async setActive(id: string, isActive: boolean): Promise<NotificationTemplate> {
    this.logger.log(`Setting notification template active: ${id} -> ${isActive}`)

    return this.updateNotificationTemplate(id, { isActive })
  }

  /**
   * Créer ou mettre à jour un template (upsert)
   */
  async upsertNotificationTemplate(data: {
    code: string
    name: string
    description?: string
    type: string
    template: string
    variables?: Record<string, any>
    isActive?: boolean
  }): Promise<NotificationTemplate> {
    this.logger.log(`Upserting notification template: ${data.code}`)

    try {
      const template = await this.prisma.notificationTemplate.upsert({
        where: { code: data.code },
        create: {
          code: data.code,
          name: data.name,
          description: data.description || null,
          type: data.type,
          template: data.template,
          variables: data.variables ? (data.variables as Prisma.InputJsonValue) : undefined,
          isActive: data.isActive !== undefined ? data.isActive : true,
        },
        update: {
          name: data.name,
          description: data.description,
          type: data.type,
          template: data.template,
          variables: data.variables ? (data.variables as Prisma.InputJsonValue) : undefined,
          isActive: data.isActive,
        },
      })

      this.logger.log(`Notification template upserted: ${template.id}`)
      return template
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error upserting notification template: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Supprimer un template
   */
  async deleteNotificationTemplate(id: string): Promise<void> {
    this.logger.log(`Deleting notification template: ${id}`)

    try {
      await this.prisma.notificationTemplate.delete({
        where: { id },
      })

      this.logger.log(`Notification template deleted: ${id}`)
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error deleting notification template: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Rechercher des templates
   */
  async searchNotificationTemplates(searchTerm: string): Promise<NotificationTemplate[]> {
    this.logger.debug(`Searching notification templates: ${searchTerm}`)

    try {
      return await this.prisma.notificationTemplate.findMany({
        where: {
          OR: [
            { code: { contains: searchTerm, mode: 'insensitive' } },
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { description: { contains: searchTerm, mode: 'insensitive' } },
          ],
          isActive: true,
        },
        orderBy: { name: 'asc' },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error searching notification templates: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Compter les templates
   */
  async countNotificationTemplates(includeInactive = false): Promise<number> {
    this.logger.debug('Counting notification templates')

    try {
      return await this.prisma.notificationTemplate.count({
        where: includeInactive ? {} : { isActive: true },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error counting notification templates: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Compter par type
   */
  async countByType(type: string): Promise<number> {
    this.logger.debug(`Counting notification templates by type: ${type}`)

    try {
      return await this.prisma.notificationTemplate.count({
        where: {
          type,
          isActive: true,
        },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error counting notification templates by type: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Vérifier si un code existe
   */
  async existsByCode(code: string): Promise<boolean> {
    this.logger.debug(`Checking if notification template exists: ${code}`)

    try {
      const template = await this.getNotificationTemplateByCode(code)
      return template !== null
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error checking notification template existence: ${err.message}`, err.stack)
      return false
    }
  }

  /**
   * Rendre un template avec des données
   */
  renderTemplate(template: NotificationTemplate, data: Record<string, any>): string {
    this.logger.debug(`Rendering template: ${template.code}`)

    let rendered = template.template

    // Remplacer les variables dans le template
    // Format: {{variableName}}
    Object.entries(data).forEach(([key, value]) => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g')
      rendered = rendered.replace(regex, String(value))
    })

    return rendered
  }

  /**
   * Extraire les variables d'un template
   */
  extractVariables(templateString: string): string[] {
    this.logger.debug('Extracting variables from template')

    const regex = /{{\\s*([a-zA-Z0-9_]+)\\s*}}/g
    const variables: string[] = []
    let match

    while ((match = regex.exec(templateString)) !== null) {
      if (!variables.includes(match[1])) {
        variables.push(match[1])
      }
    }

    return variables
  }

  /**
   * Valider un template
   */
  validateTemplate(templateString: string, expectedVariables?: string[]): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    // Vérifier la syntaxe des variables
    const variablePattern = /{{[^}]+}}/g
    const matches = templateString.match(variablePattern)

    if (matches) {
      matches.forEach((match) => {
        // Vérifier que les variables sont bien formées
        if (!/{{\\s*[a-zA-Z0-9_]+\\s*}}/.test(match)) {
          errors.push(`Invalid variable syntax: ${match}`)
        }
      })
    }

    // Vérifier les variables attendues
    if (expectedVariables) {
      const actualVariables = this.extractVariables(templateString)
      expectedVariables.forEach((expectedVar) => {
        if (!actualVariables.includes(expectedVar)) {
          errors.push(`Missing expected variable: ${expectedVar}`)
        }
      })
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }

  /**
   * Récupérer tous les types de templates
   */
  async getAllTemplateTypes(): Promise<string[]> {
    this.logger.debug('Getting all template types')

    try {
      const templates = await this.prisma.notificationTemplate.findMany({
        select: { type: true },
        distinct: ['type'],
        orderBy: { type: 'asc' },
      })

      return templates.map((t) => t.type)
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting all template types: ${err.message}`, err.stack)
      throw error
    }
  }
}
