import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common'
import { TenantGuard } from '../../../shared/tenant/tenant.guard'
import type { CreatePageTemplateDto, UpdatePageTemplateDto } from '../dto'
import type { SectionPreset } from '../entities'
import type { PageBuilderService } from '../services/page-builder.service'

@Controller('page-builder')
@UseGuards(TenantGuard)
export class PageBuilderController {
  constructor(private readonly pageBuilderService: PageBuilderService) {}

  @Post('templates')
  async createTemplate(@Request() req: unknown, @Body() createDto: CreatePageTemplateDto) {
    return this.pageBuilderService.createTemplate(
      (req as { tenant: { societeId: string } }).tenant.societeId,
      createDto
    )
  }

  @Get('templates')
  async findTemplates(@Request() req: unknown) {
    return this.pageBuilderService.findTemplatesBySociete(
      (req as { tenant: { societeId: string } }).tenant.societeId
    )
  }

  @Get('templates/:id')
  async findTemplate(@Param('id') id: string) {
    return this.pageBuilderService.findTemplateById(id)
  }

  @Get('templates/by-slug/:slug')
  async findTemplateBySlug(@Request() req: unknown, @Param('slug') slug: string) {
    return this.pageBuilderService.findTemplateBySlug(
      (req as { tenant: { societeId: string } }).tenant.societeId,
      slug
    )
  }

  @Put('templates/:id')
  async updateTemplate(@Param('id') id: string, @Body() updateDto: UpdatePageTemplateDto) {
    return this.pageBuilderService.updateTemplate(id, updateDto)
  }

  @Delete('templates/:id')
  async deleteTemplate(@Param('id') id: string) {
    await this.pageBuilderService.deleteTemplate(id)
    return { message: 'Template supprimé avec succès' }
  }

  @Post('templates/:id/publish')
  async publishTemplate(@Param('id') id: string) {
    return this.pageBuilderService.publishTemplate(id)
  }

  @Post('templates/:id/duplicate')
  async duplicateTemplate(@Param('id') id: string, @Body() body: { name: string; slug: string }) {
    return this.pageBuilderService.duplicateTemplate(id, body.name, body.slug)
  }

  @Get('section-presets')
  async findSectionPresets(
    @Request() req: unknown,
    @Query('type') type?: string,
    @Query('category') category?: string,
    @Query('public') includePublic?: boolean
  ) {
    const societeId = includePublic
      ? undefined
      : (req as { tenant: { societeId: string } }).tenant.societeId
    return this.pageBuilderService.findSectionPresets(societeId, type, category)
  }

  @Post('section-presets')
  async createSectionPreset(@Request() req: unknown, @Body() presetData: unknown) {
    return this.pageBuilderService.createSectionPreset(
      (req as { tenant: { societeId: string } }).tenant.societeId,
      presetData as Partial<SectionPreset>
    )
  }

  @Post('section-presets/:id/use')
  async useSectionPreset(@Param('id') id: string) {
    await this.pageBuilderService.incrementPresetUsage(id)
    return { message: 'Usage incrémenté' }
  }
}
