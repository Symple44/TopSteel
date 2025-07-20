import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { EmailTemplate } from '../entities/email-template.entity'
import * as Handlebars from 'handlebars'

export interface TemplateData {
  [key: string]: any
}

export interface CreateTemplateDto {
  name: string
  subject: string
  htmlContent: string
  textContent?: string
  description?: string
  variables?: string[]
  category?: string
}

export interface UpdateTemplateDto {
  subject?: string
  htmlContent?: string
  textContent?: string
  description?: string
  variables?: string[]
  category?: string
  enabled?: boolean
}

@Injectable()
export class EmailTemplateService {
  private readonly logger = new Logger(EmailTemplateService.name)
  private compiledTemplates: Map<string, Handlebars.TemplateDelegate> = new Map()

  constructor(
    @InjectRepository(EmailTemplate)
    private templateRepository: Repository<EmailTemplate>,
  ) {
    this.registerHelpers()
  }

  /**
   * Créer un nouveau template
   */
  async createTemplate(dto: CreateTemplateDto): Promise<EmailTemplate> {
    const template = new EmailTemplate()
    template.name = dto.name
    template.subject = dto.subject
    template.htmlContent = dto.htmlContent
    template.textContent = dto.textContent || null
    template.description = dto.description || null
    template.variables = dto.variables || []
    template.category = dto.category || null
    template.enabled = true

    // Valider le template Handlebars
    try {
      Handlebars.compile(dto.subject)
      Handlebars.compile(dto.htmlContent)
      if (dto.textContent) {
        Handlebars.compile(dto.textContent)
      }
    } catch (error) {
      throw new Error(`Template invalide: ${(error as Error).message}`)
    }

    const saved = await this.templateRepository.save(template)
    this.logger.log(`Template créé: ${template.name}`)
    
    return saved
  }

  /**
   * Mettre à jour un template existant
   */
  async updateTemplate(id: string, dto: UpdateTemplateDto): Promise<EmailTemplate> {
    const template = await this.templateRepository.findOne({ where: { id } })
    
    if (!template) {
      throw new NotFoundException(`Template avec l'ID ${id} introuvable`)
    }

    // Valider les nouveaux templates Handlebars si fournis
    try {
      if (dto.subject) {
        Handlebars.compile(dto.subject)
        template.subject = dto.subject
      }
      if (dto.htmlContent) {
        Handlebars.compile(dto.htmlContent)
        template.htmlContent = dto.htmlContent
      }
      if (dto.textContent) {
        Handlebars.compile(dto.textContent)
        template.textContent = dto.textContent || null
      }
    } catch (error) {
      throw new Error(`Template invalide: ${(error as Error).message}`)
    }

    if (dto.description !== undefined) template.description = dto.description || null
    if (dto.variables !== undefined) template.variables = dto.variables
    if (dto.category !== undefined) template.category = dto.category || null
    if (dto.enabled !== undefined) template.enabled = dto.enabled

    template.updatedAt = new Date()

    // Supprimer de la cache si désactivé ou modifié
    if (!template.enabled || dto.htmlContent || dto.textContent || dto.subject) {
      this.compiledTemplates.delete(template.name)
    }

    const saved = await this.templateRepository.save(template)
    this.logger.log(`Template mis à jour: ${template.name}`)
    
    return saved
  }

  /**
   * Supprimer un template
   */
  async deleteTemplate(id: string): Promise<void> {
    const template = await this.templateRepository.findOne({ where: { id } })
    
    if (!template) {
      throw new NotFoundException(`Template avec l'ID ${id} introuvable`)
    }

    this.compiledTemplates.delete(template.name)
    await this.templateRepository.remove(template)
    
    this.logger.log(`Template supprimé: ${template.name}`)
  }

  /**
   * Récupérer un template par son nom
   */
  async getTemplate(name: string): Promise<EmailTemplate> {
    const template = await this.templateRepository.findOne({ 
      where: { name, enabled: true } 
    })
    
    if (!template) {
      throw new NotFoundException(`Template '${name}' introuvable ou désactivé`)
    }
    
    return template
  }

  /**
   * Récupérer tous les templates
   */
  async getAllTemplates(category?: string): Promise<EmailTemplate[]> {
    const query = this.templateRepository.createQueryBuilder('template')
      .orderBy('template.category', 'ASC')
      .addOrderBy('template.name', 'ASC')

    if (category) {
      query.where('template.category = :category', { category })
    }

    return await query.getMany()
  }

  /**
   * Générer un email à partir d'un template
   */
  async renderTemplate(templateName: string, data: TemplateData): Promise<{
    subject: string
    html: string
    text?: string
  }> {
    const template = await this.getTemplate(templateName)

    try {
      const subjectTemplate = this.getCompiledTemplate(`${templateName}_subject`, template.subject)
      const htmlTemplate = this.getCompiledTemplate(`${templateName}_html`, template.htmlContent)
      
      const rendered = {
        subject: subjectTemplate(data),
        html: htmlTemplate(data),
        text: undefined as string | undefined,
      }

      if (template.textContent) {
        const textTemplate = this.getCompiledTemplate(`${templateName}_text`, template.textContent)
        rendered.text = textTemplate(data)
      }

      return rendered
    } catch (error) {
      this.logger.error(`Erreur lors du rendu du template ${templateName}:`, error)
      throw new Error(`Erreur lors du rendu du template: ${(error as Error).message}`)
    }
  }

  /**
   * Prévisualiser un template avec des données de test
   */
  async previewTemplate(templateName: string, testData?: TemplateData): Promise<{
    subject: string
    html: string
    text?: string
  }> {
    const template = await this.getTemplate(templateName)
    
    // Générer des données de test si aucune n'est fournie
    const data = testData || this.generateTestData(template.variables || [])
    
    return await this.renderTemplate(templateName, data)
  }

  /**
   * Valider un template Handlebars
   */
  validateTemplate(content: string): { valid: boolean; error?: string } {
    try {
      Handlebars.compile(content)
      return { valid: true }
    } catch (error) {
      return { valid: false, error: (error as Error).message }
    }
  }

  /**
   * Obtenir les variables utilisées dans un template
   */
  extractVariables(content: string): string[] {
    const variables = new Set<string>()
    const regex = /\{\{\s*([^}]+)\s*\}\}/g
    let match

    while ((match = regex.exec(content)) !== null) {
      const variable = match[1].trim().split(/\s+/)[0].replace(/^[#^]/, '')
      if (variable && !this.isHandlebarsHelper(variable)) {
        variables.add(variable)
      }
    }

    return Array.from(variables).sort()
  }

  /**
   * Dupliquer un template
   */
  async duplicateTemplate(id: string, newName: string): Promise<EmailTemplate> {
    const original = await this.templateRepository.findOne({ where: { id } })
    
    if (!original) {
      throw new NotFoundException(`Template avec l'ID ${id} introuvable`)
    }

    const duplicate = new EmailTemplate()
    duplicate.name = newName
    duplicate.subject = original.subject
    duplicate.htmlContent = original.htmlContent
    duplicate.textContent = original.textContent
    duplicate.description = `Copie de ${original.name}`
    duplicate.variables = [...(original.variables || [])]
    duplicate.category = original.category
    duplicate.enabled = false // Désactivé par défaut

    const saved = await this.templateRepository.save(duplicate)
    this.logger.log(`Template dupliqué: ${original.name} -> ${newName}`)
    
    return saved
  }

  /**
   * Obtenir les statistiques d'utilisation des templates
   */
  async getTemplateUsageStats(): Promise<any[]> {
    // Cette méthode nécessiterait une relation avec les logs d'emails
    // Pour l'instant, retourner les templates avec leurs informations de base
    return await this.templateRepository
      .createQueryBuilder('template')
      .select([
        'template.id',
        'template.name',
        'template.category',
        'template.enabled',
        'template.createdAt',
        'template.updatedAt',
      ])
      .orderBy('template.name', 'ASC')
      .getMany()
  }

  /**
   * Obtenir un template compilé depuis la cache ou le compiler
   */
  private getCompiledTemplate(cacheKey: string, content: string): Handlebars.TemplateDelegate {
    if (this.compiledTemplates.has(cacheKey)) {
      return this.compiledTemplates.get(cacheKey)!
    }

    const compiled = Handlebars.compile(content)
    this.compiledTemplates.set(cacheKey, compiled)
    return compiled
  }

  /**
   * Générer des données de test pour les variables
   */
  private generateTestData(variables: string[]): TemplateData {
    const testData: TemplateData = {}

    for (const variable of variables) {
      switch (variable.toLowerCase()) {
        case 'name':
        case 'firstname':
        case 'prenom':
          testData[variable] = 'Jean Dupont'
          break
        case 'email':
          testData[variable] = 'jean.dupont@example.com'
          break
        case 'company':
        case 'entreprise':
          testData[variable] = 'TopSteel ERP'
          break
        case 'date':
          testData[variable] = new Date().toLocaleDateString('fr-FR')
          break
        case 'url':
        case 'link':
        case 'lien':
          testData[variable] = 'https://example.com'
          break
        case 'amount':
        case 'montant':
          testData[variable] = '1 234,56 €'
          break
        default:
          testData[variable] = `[${variable}]`
      }
    }

    return testData
  }

  /**
   * Vérifier si un nom est un helper Handlebars
   */
  private isHandlebarsHelper(name: string): boolean {
    const helpers = ['if', 'unless', 'each', 'with', 'lookup', 'log', 'blockHelperMissing', 'helperMissing']
    return helpers.includes(name)
  }

  /**
   * Enregistrer des helpers Handlebars personnalisés
   */
  private registerHelpers(): void {
    // Helper pour formater les dates
    Handlebars.registerHelper('formatDate', (date: Date, format?: string) => {
      if (!date) return ''
      
      const d = new Date(date)
      
      switch (format) {
        case 'short':
          return d.toLocaleDateString('fr-FR')
        case 'long':
          return d.toLocaleDateString('fr-FR', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })
        case 'time':
          return d.toLocaleTimeString('fr-FR')
        default:
          return d.toLocaleString('fr-FR')
      }
    })

    // Helper pour formater les montants
    Handlebars.registerHelper('formatMoney', (amount: number, currency = '€') => {
      if (typeof amount !== 'number') return ''
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: currency === '€' ? 'EUR' : currency,
      }).format(amount)
    })

    // Helper pour les conditions
    Handlebars.registerHelper('eq', (a: any, b: any) => a === b)
    Handlebars.registerHelper('ne', (a: any, b: any) => a !== b)
    Handlebars.registerHelper('gt', (a: number, b: number) => a > b)
    Handlebars.registerHelper('lt', (a: number, b: number) => a < b)

    // Helper pour les URLs
    Handlebars.registerHelper('url', (path: string, baseUrl?: string) => {
      const base = baseUrl || process.env.APP_URL || 'http://localhost:3000'
      return new URL(path, base).toString()
    })

    this.logger.log('Helpers Handlebars enregistrés')
  }
}