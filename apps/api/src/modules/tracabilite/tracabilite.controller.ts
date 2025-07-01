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
import { TracabiliteService } from './tracabilite.service';
import { CreateTracabiliteDto } from './dto/create-tracabilite.dto';
import { UpdateTracabiliteDto } from './dto/update-tracabilite.dto';
import { TracabiliteQueryDto } from './dto/tracabilite-query.dto';

@Controller('tracabilite')
@ApiTags('tracabilite')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class TracabiliteController {
  constructor(private readonly tracabiliteService: TracabiliteService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Créer un nouveau tracabilite' })
  @ApiResponse({ status: 201, description: 'Tracabilite créé avec succès' })
  async create(@Body() createDto: CreateTracabiliteDto) {
    return this.tracabiliteService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lister les tracabilite avec pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  async findAll(@Query() query: TracabiliteQueryDto) {
    return this.tracabiliteService.findAll(query);
  }

  @Get('stats')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Statistiques des tracabilite' })
  async getStats() {
    return this.tracabiliteService.getStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un tracabilite par ID' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.tracabiliteService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Mettre à jour un tracabilite' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateTracabiliteDto
  ) {
    return this.tracabiliteService.update(id, updateDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer un tracabilite' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.tracabiliteService.remove(id);
  }
}
