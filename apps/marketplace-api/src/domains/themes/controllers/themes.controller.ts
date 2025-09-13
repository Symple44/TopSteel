import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger'
import type { Request } from 'express'

import { TenantGuard } from '../../../shared/tenant/tenant.guard'
import type {
  CreateThemeDto,
  MarketplaceThemesService,
  ThemePreviewDto,
  UpdateThemeDto,
} from '../services/marketplace-themes.service'

@ApiTags('themes')
@Controller('themes')
@UseGuards(TenantGuard)
@ApiBearerAuth()
export class ThemesController {
  constructor(private themesService: MarketplaceThemesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all themes for the company' })
  @ApiResponse({ status: 200, description: 'List of themes' })
  @ApiQuery({ name: 'active', required: false, description: 'Filter by active status' })
  async findAll(@Req() req: Request, @Query('active') active?: string) {
    const { tenant } = req as unknown as { tenant: { societeId: string } }

    if (active === 'true') {
      const activeTheme = await this.themesService.findActive(tenant.societeId)
      return activeTheme ? [activeTheme] : []
    }

    return await this.themesService.findAll(tenant.societeId)
  }

  @Get('active')
  @ApiOperation({ summary: 'Get the currently active theme' })
  @ApiResponse({ status: 200, description: 'Active theme' })
  @ApiResponse({ status: 404, description: 'No active theme found' })
  async findActive(@Req() req: Request) {
    const { tenant } = req as unknown as { tenant: { societeId: string } }

    const activeTheme = await this.themesService.findActive(tenant.societeId)
    if (!activeTheme) {
      return { message: 'Aucun thème actif trouvé' }
    }

    return activeTheme
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get theme usage statistics' })
  @ApiResponse({ status: 200, description: 'Theme statistics' })
  async getStats(@Req() req: Request) {
    const { tenant } = req as unknown as { tenant: { societeId: string } }
    return await this.themesService.getThemeStats(tenant.societeId)
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get theme by ID' })
  @ApiResponse({ status: 200, description: 'Theme found' })
  @ApiResponse({ status: 404, description: 'Theme not found' })
  async findOne(@Req() req: Request, @Param('id') id: string) {
    const { tenant } = req as unknown as { tenant: { societeId: string } }
    return await this.themesService.findById(id, tenant.societeId)
  }

  @Post()
  @ApiOperation({ summary: 'Create a new theme' })
  @ApiResponse({ status: 201, description: 'Theme created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  @HttpCode(HttpStatus.CREATED)
  async create(@Req() req: Request, @Body() createDto: CreateThemeDto) {
    const { tenant } = req as unknown as { tenant: { societeId: string } }
    return await this.themesService.create(tenant.societeId, createDto)
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an existing theme' })
  @ApiResponse({ status: 200, description: 'Theme updated successfully' })
  @ApiResponse({ status: 404, description: 'Theme not found' })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  async update(@Req() req: Request, @Param('id') id: string, @Body() updateDto: UpdateThemeDto) {
    const { tenant } = req as unknown as { tenant: { societeId: string } }
    return await this.themesService.update(id, tenant.societeId, updateDto)
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a theme' })
  @ApiResponse({ status: 200, description: 'Theme deleted successfully' })
  @ApiResponse({ status: 404, description: 'Theme not found' })
  @ApiResponse({ status: 400, description: 'Cannot delete active or default theme' })
  @HttpCode(HttpStatus.OK)
  async delete(@Req() req: Request, @Param('id') id: string) {
    const { tenant } = req as unknown as { tenant: { societeId: string } }
    await this.themesService.delete(id, tenant.societeId)
    return { message: 'Thème supprimé avec succès' }
  }

  @Post(':id/activate')
  @ApiOperation({ summary: 'Activate a theme' })
  @ApiResponse({ status: 200, description: 'Theme activated successfully' })
  @ApiResponse({ status: 404, description: 'Theme not found' })
  @HttpCode(HttpStatus.OK)
  async activate(@Req() req: Request, @Param('id') id: string) {
    const { tenant } = req as unknown as { tenant: { societeId: string } }
    const activatedTheme = await this.themesService.activate(id, tenant.societeId)

    return {
      message: 'Thème activé avec succès',
      theme: activatedTheme,
    }
  }

  @Post(':id/clone')
  @ApiOperation({ summary: 'Clone an existing theme' })
  @ApiResponse({ status: 201, description: 'Theme cloned successfully' })
  @ApiResponse({ status: 404, description: 'Theme not found' })
  @ApiResponse({ status: 400, description: 'Theme name already exists' })
  @HttpCode(HttpStatus.CREATED)
  async clone(@Req() req: Request, @Param('id') id: string, @Body() body: { name: string }) {
    const { tenant } = req as unknown as { tenant: { societeId: string } }
    const clonedTheme = await this.themesService.clone(id, tenant.societeId, body.name)

    return {
      message: 'Thème cloné avec succès',
      theme: clonedTheme,
    }
  }

  @Get(':id/css')
  @ApiOperation({ summary: 'Generate CSS for a theme' })
  @ApiResponse({ status: 200, description: 'CSS generated successfully' })
  @ApiResponse({ status: 404, description: 'Theme not found' })
  async generateCSS(@Req() req: Request, @Param('id') id: string) {
    const { tenant } = req as unknown as { tenant: { societeId: string } }
    const css = await this.themesService.generateCSS(id, tenant.societeId)

    return {
      css,
      contentType: 'text/css',
    }
  }

  @Post(':id/preview')
  @ApiOperation({ summary: 'Preview theme changes without saving' })
  @ApiResponse({ status: 200, description: 'Preview generated successfully' })
  @ApiResponse({ status: 404, description: 'Theme not found' })
  @HttpCode(HttpStatus.OK)
  async previewTheme(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() previewDto: ThemePreviewDto
  ) {
    const { tenant } = req as unknown as { tenant: { societeId: string } }
    return await this.themesService.previewTheme(id, tenant.societeId, previewDto)
  }

  @Post(':id/reset')
  @ApiOperation({ summary: 'Reset theme to default configuration' })
  @ApiResponse({ status: 200, description: 'Theme reset successfully' })
  @ApiResponse({ status: 404, description: 'Theme not found' })
  @HttpCode(HttpStatus.OK)
  async resetToDefault(@Req() req: Request, @Param('id') id: string) {
    const { tenant } = req as unknown as { tenant: { societeId: string } }
    const resetTheme = await this.themesService.resetToDefault(id, tenant.societeId)

    return {
      message: 'Thème remis à zéro avec succès',
      theme: resetTheme,
    }
  }

  @Get(':id/export')
  @ApiOperation({ summary: 'Export theme configuration' })
  @ApiResponse({ status: 200, description: 'Theme exported successfully' })
  @ApiResponse({ status: 404, description: 'Theme not found' })
  async exportTheme(@Req() req: Request, @Param('id') id: string) {
    const { tenant } = req as unknown as { tenant: { societeId: string } }
    const theme = await this.themesService.findById(id, tenant.societeId)

    // Return theme configuration without sensitive data
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const {
      id: _id,
      societeId: _societeId,
      createdAt: _createdAt,
      updatedAt: _updatedAt,
      ...exportableData
    } = theme

    return {
      exported_at: new Date(),
      theme: exportableData,
      format_version: '1.0',
      export_type: 'full',
    }
  }

  @Post('import')
  @ApiOperation({ summary: 'Import theme from configuration' })
  @ApiResponse({ status: 201, description: 'Theme imported successfully' })
  @ApiResponse({ status: 400, description: 'Invalid theme configuration' })
  @HttpCode(HttpStatus.CREATED)
  async importTheme(
    @Req() req: Request,
    @Body() importData: {
      name: string
      theme: CreateThemeDto
      overwrite_existing?: boolean
    }
  ) {
    const { tenant } = req as unknown as { tenant: { societeId: string } }

    try {
      // Create theme from imported data
      const { name: _, ...themeWithoutName } = importData.theme
      const importedTheme = await this.themesService.create(tenant.societeId, {
        name: importData.name,
        ...themeWithoutName,
        metadata: {
          ...importData.theme.metadata,
          imported: true,
          importedAt: new Date().toISOString(),
        },
      })

      return {
        message: 'Thème importé avec succès',
        theme: importedTheme,
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      if (errorMessage.includes('existe déjà') && importData.overwrite_existing) {
        // If overwrite is allowed, delete existing and create new
        const existingThemes = await this.themesService.findAll(tenant.societeId)
        const existingTheme = existingThemes.find((t) => t.name === importData.name)

        if (existingTheme && !existingTheme.isActive && !existingTheme.isDefault) {
          await this.themesService.delete(existingTheme.id, tenant.societeId)

          const { name: __, ...themeWithoutName2 } = importData.theme
          const importedTheme = await this.themesService.create(tenant.societeId, {
            name: importData.name,
            ...themeWithoutName2,
            metadata: {
              ...importData.theme.metadata,
              imported: true,
              importedAt: new Date().toISOString(),
              overwritten: true,
            },
          })

          return {
            message: 'Thème importé et remplacé avec succès',
            theme: importedTheme,
          }
        }
      }

      throw error
    }
  }

  @Get(':id/versions')
  @ApiOperation({ summary: 'Get theme version history' })
  @ApiResponse({ status: 200, description: 'Version history' })
  @ApiResponse({ status: 404, description: 'Theme not found' })
  async getVersionHistory(@Req() req: Request, @Param('id') id: string) {
    const { tenant } = req as unknown as { tenant: { societeId: string } }
    const theme = await this.themesService.findById(id, tenant.societeId)

    return {
      current_version: theme.version,
      changelog: theme.metadata?.changelog || [],
      last_updated: theme.updatedAt,
      created: theme.createdAt,
    }
  }
}
