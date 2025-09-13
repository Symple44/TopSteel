import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import type { Repository } from 'typeorm'
import type { CreatePageTemplateDto, UpdatePageTemplateDto } from '../dto'
import { PageSection, PageTemplate, SectionPreset } from '../entities'
import { PageStatus } from '../entities/page-template.entity'
import type { SectionContent, SectionStyles, SectionType } from '../entities/types'

@Injectable()
export class PageBuilderService {
  constructor(
    @InjectRepository(PageTemplate, 'marketplace')
    private pageTemplateRepository: Repository<PageTemplate>,

    @InjectRepository(PageSection, 'marketplace')
    private pageSectionRepository: Repository<PageSection>,

    @InjectRepository(SectionPreset, 'marketplace')
    private sectionPresetRepository: Repository<SectionPreset>
  ) {}

  async createTemplate(societeId: string, createDto: CreatePageTemplateDto): Promise<PageTemplate> {
    // Vérifier l'unicité du slug
    const existingTemplate = await this.pageTemplateRepository.findOne({
      where: { societeId, slug: createDto.slug },
    })

    if (existingTemplate) {
      throw new BadRequestException(`Un template avec le slug "${createDto.slug}" existe déjà`)
    }

    const templateData = {
      name: createDto.name,
      slug: createDto.slug,
      pageType: createDto.pageType,
      status: createDto.status,
      description: createDto.description,
      metadata: createDto.metadata as Record<string, unknown> | undefined,
      settings: createDto.settings as Record<string, unknown> | undefined,
      societeId,
      version: 1,
    }
    const template = this.pageTemplateRepository.create(templateData)

    const savedTemplate = await this.pageTemplateRepository.save(template) as PageTemplate

    // Créer les sections si fournies
    if (createDto.sections && createDto.sections.length > 0) {
      const sections = createDto.sections.map((sectionDto, index) =>
        this.pageSectionRepository.create({
          type: sectionDto.type as SectionType,
          name: sectionDto.name,
          content: (sectionDto.content || {}) as SectionContent,
          styles: (sectionDto.styles || {}) as SectionStyles,
          responsive: sectionDto.responsive || {},
          settings: sectionDto.settings || {},
          pageTemplateId: savedTemplate.id,
          order: index,
          isVisible: true,
        })
      )

      await this.pageSectionRepository.save(sections)
    }

    return this.findTemplateById(savedTemplate.id)
  }

  async findTemplateById(id: string): Promise<PageTemplate> {
    const template = await this.pageTemplateRepository.findOne({
      where: { id },
      relations: ['sections'],
    })

    if (!template) {
      throw new NotFoundException(`Template avec l'ID ${id} introuvable`)
    }

    return template
  }

  async findTemplateBySlug(societeId: string, slug: string): Promise<PageTemplate> {
    const template = await this.pageTemplateRepository.findOne({
      where: { societeId, slug },
      relations: ['sections'],
    })

    if (!template) {
      throw new NotFoundException(`Template avec le slug "${slug}" introuvable`)
    }

    return template
  }

  async findTemplatesBySociete(societeId: string): Promise<PageTemplate[]> {
    return this.pageTemplateRepository.find({
      where: { societeId },
      relations: ['sections'],
      order: { updatedAt: 'DESC' },
    })
  }

  async updateTemplate(id: string, updateDto: UpdatePageTemplateDto): Promise<PageTemplate> {
    const template = await this.findTemplateById(id)

    // Incrémenter la version si le contenu change
    if (updateDto.sections) {
      template.version += 1
    }

    Object.assign(template, updateDto)
    await this.pageTemplateRepository.save(template)

    // Mettre à jour les sections si fournies
    if (updateDto.sections) {
      // Supprimer les anciennes sections
      await this.pageSectionRepository.delete({ pageTemplateId: id })

      // Créer les nouvelles sections
      const sections = updateDto.sections.map((sectionDto, index) =>
        this.pageSectionRepository.create({
          type: sectionDto.type as SectionType,
          name: sectionDto.name,
          content: (sectionDto.content || {}) as SectionContent,
          styles: (sectionDto.styles || {}) as SectionStyles,
          responsive: sectionDto.responsive || {},
          settings: sectionDto.settings || {},
          pageTemplateId: id,
          order: index,
          isVisible: true,
        })
      )

      await this.pageSectionRepository.save(sections)
    }

    return this.findTemplateById(id)
  }

  async deleteTemplate(id: string): Promise<void> {
    const template = await this.findTemplateById(id)
    await this.pageTemplateRepository.remove(template)
  }

  async publishTemplate(id: string): Promise<PageTemplate> {
    const template = await this.findTemplateById(id)
    template.status = PageStatus.PUBLISHED
    template.publishedAt = new Date()

    return this.pageTemplateRepository.save(template)
  }

  async duplicateTemplate(id: string, newName: string, newSlug: string): Promise<PageTemplate> {
    const originalTemplate = await this.findTemplateById(id)

    const duplicatedTemplateData = {
      name: newName,
      slug: newSlug,
      pageType: originalTemplate.pageType,
      status: PageStatus.DRAFT,
      description: originalTemplate.description,
      metadata: originalTemplate.metadata,
      settings: originalTemplate.settings,
      societeId: originalTemplate.societeId,
      publishedAt: undefined, // Use undefined instead of null
      version: 1,
    }
    const duplicatedTemplate = this.pageTemplateRepository.create(duplicatedTemplateData)

    const savedTemplate = await this.pageTemplateRepository.save(duplicatedTemplate)

    // Dupliquer les sections
    if (originalTemplate.sections.length > 0) {
      const duplicatedSections = originalTemplate.sections.map((section) =>
        this.pageSectionRepository.create({
          type: section.type,
          name: section.name,
          content: section.content,
          styles: section.styles,
          responsive: section.responsive,
          settings: section.settings,
          pageTemplateId: savedTemplate.id,
          order: section.order,
          isVisible: section.isVisible,
        })
      )

      await this.pageSectionRepository.save(duplicatedSections)
    }

    return this.findTemplateById(savedTemplate.id)
  }

  // Gestion des presets de sections
  async createSectionPreset(
    societeId: string | null,
    presetData: Partial<SectionPreset>
  ): Promise<SectionPreset> {
    const presetData2 = {
      ...presetData,
      societeId: societeId || undefined, // Handle null properly
      usageCount: 0,
    }
    const preset = this.sectionPresetRepository.create(presetData2)

    return this.sectionPresetRepository.save(preset)
  }

  async findSectionPresets(
    societeId?: string,
    type?: string,
    category?: string
  ): Promise<SectionPreset[]> {
    const where: Record<string, unknown> = {}

    if (societeId) {
      where.societeId = societeId
    } else {
      where.isPublic = true
    }

    if (type) {
      where.type = type
    }

    if (category) {
      where.category = category
    }

    return this.sectionPresetRepository.find({
      where,
      order: { usageCount: 'DESC', createdAt: 'DESC' },
    })
  }

  async incrementPresetUsage(presetId: string): Promise<void> {
    await this.sectionPresetRepository.increment({ id: presetId }, 'usageCount', 1)
  }
}
