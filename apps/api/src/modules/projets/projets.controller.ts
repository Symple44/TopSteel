import {
  Body, Controller, Delete, Get, HttpCode, HttpStatus,
  Param, ParseUUIDPipe, Patch, Post, Query, UseGuards
} from '@nestjs/common';
import {
  ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../users/entities/user.entity';
import { ProjetsService } from './projets.service';
import { CreateProjetsDto } from './dto/create-projets.dto';
import { UpdateProjetsDto } from './dto/update-projets.dto';
import { ProjetsQueryDto } from './dto/projets-query.dto';

@Controller('projets')
@ApiTags('projets')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ProjetsController {
  constructor(private readonly projetsService: ProjetsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Créer un nouveau projets' })
  @ApiResponse({ status: 201, description: 'Projets créé avec succès' })
  async create(@Body() createDto: CreateProjetsDto) {
    return this.projetsService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lister les projets avec pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  async findAll(@Query() query: ProjetsQueryDto) {
    return this.projetsService.findAll(query);
  }

  @Get('stats')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Statistiques des projets' })
  async getStats() {
    return this.projetsService.getStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un projets par ID' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.projetsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Mettre à jour un projets' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateProjetsDto
  ) {
    return this.projetsService.update(id, updateDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer un projets' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.projetsService.remove(id);
  }
}
