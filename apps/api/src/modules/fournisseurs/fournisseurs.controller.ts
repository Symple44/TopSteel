import {
  Body, Controller, Delete, Get, HttpCode, HttpStatus,
  Param, ParseUUIDPipe, Patch, Post, Query, UseGuards
} from '@nestjs/common';
import {
  ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags
} from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../users/entities/user.entity';
import { CreateFournisseursDto } from './dto/create-fournisseurs.dto';
import { FournisseursQueryDto } from './dto/fournisseurs-query.dto';
import { UpdateFournisseursDto } from './dto/update-fournisseurs.dto';
import { FournisseursService } from './fournisseurs.service';

@Controller('fournisseurs')
@ApiTags('🚚 Fournisseurs')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')

export class FournisseursController {
  constructor(private readonly fournisseursService: FournisseursService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Créer un nouveau fournisseurs' })
  @ApiResponse({ status: 201, description: 'Fournisseurs créé avec succès' })
  async create(@Body() createDto: CreateFournisseursDto) {
    return this.fournisseursService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lister les fournisseurs avec pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  async findAll(@Query() query: FournisseursQueryDto) {
    return this.fournisseursService.findAll(query);
  }

  @Get('stats')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Statistiques des fournisseurs' })
  async getStats() {
    return this.fournisseursService.getStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un fournisseurs par ID' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.fournisseursService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Mettre à jour un fournisseurs' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateFournisseursDto
  ) {
    return this.fournisseursService.update(id, updateDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer un fournisseurs' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.fournisseursService.remove(id);
  }
}

