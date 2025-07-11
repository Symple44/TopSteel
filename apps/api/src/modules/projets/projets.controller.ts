import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger'
import { Roles } from '../../common/decorators/roles.decorator'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { UserRole } from '../users/entities/user.entity'
import type { CreateProjetsDto } from './dto/create-projets.dto'
import type { ProjetsQueryDto } from './dto/projets-query.dto'
import type { UpdateProjetsDto } from './dto/update-projets.dto'
import type { ProjetsService } from './projets.service'

@Controller('projets')
@ApiTags('📁 Projets')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class ProjetsController {
  constructor(private readonly projetsService: ProjetsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Créer un nouveau projets' })
  @ApiResponse({ status: 201, description: 'Projets créé avec succès' })
  async create(@Body() createDto: CreateProjetsDto) {
    return this.projetsService.create(createDto)
  }

  @Get()
  @ApiOperation({ summary: 'Lister les projets avec pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  async findAll(@Query() query: ProjetsQueryDto) {
    return this.projetsService.findAll(query)
  }

  @Get('stats')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Statistiques des projets' })
  async getStats() {
    return this.projetsService.getStats()
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.projetsService.findOne(id)
  }

  @Patch(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() updateDto: UpdateProjetsDto) {
    return this.projetsService.update(id, updateDto)
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.projetsService.remove(id)
  }
}
