import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common'
import { PageBuilderService } from '../services/page-builder.service'
import { CreatePageTemplateDto, UpdatePageTemplateDto } from '../dto'
import { TenantGuard } from '../../../shared/guards/tenant.guard'

@Controller('page-builder')
@UseGuards(TenantGuard)
export class PageBuilderController {
  constructor(private readonly pageBuilderService: PageBuilderService) {}

  @Post('templates')
  async createTemplate(@Request() req: any, @Body() createDto: CreatePageTemplateDto) {
    return this.pageBuilderService.createTemplate(req.tenant.societeId, createDto)
  }

  @Get('templates')
  async findTemplates(@Request() req: any) {
    return this.pageBuilderService.findTemplatesBySociete(req.tenant.societeId)
  }

  @Get('templates/:id')
  async findTemplate(@Param('id') id: string) {
    return this.pageBuilderService.findTemplateById(id)
  }

  @Get('templates/by-slug/:slug')
  async findTemplateBySlug(@Request() req: any, @Param('slug') slug: string) {
    return this.pageBuilderService.findTemplateBySlug(req.tenant.societeId, slug)
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
    @Request() req: any,
    @Query('type') type?: string,
    @Query('category') category?: string,
    @Query('public') includePublic?: boolean
  ) {
    const societeId = includePublic ? undefined : req.tenant.societeId
    return this.pageBuilderService.findSectionPresets(societeId, type, category)
  }

  @Post('section-presets')
  async createSectionPreset(@Request() req: any, @Body() presetData: any) {
    return this.pageBuilderService.createSectionPreset(req.tenant.societeId, presetData)
  }

  @Post('section-presets/:id/use')
  async useSectionPreset(@Param('id') id: string) {
    await this.pageBuilderService.incrementPresetUsage(id)
    return { message: 'Usage incrémenté' }
  }
}
