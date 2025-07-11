import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
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
import type { CreatePlanningDto } from './dto/create-planning.dto'
import type { PlanningQueryDto } from './dto/planning-query.dto'
import type { UpdatePlanningDto } from './dto/update-planning.dto'
import type { PlanningService } from './planning.service'

@Controller('planning')
@ApiTags('📅 Planning')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class PlanningController {
  constructor(private readonly planningService: PlanningService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Créer un nouveau planning' })
  @ApiResponse({ status: 201, description: 'Planning créé avec succès' })
  async create(@Body() createDto: CreatePlanningDto) {
    return this.planningService.create(createDto)
  }

  @Get()
  @ApiOperation({ summary: 'Lister les planning avec pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  async findAll(@Query() query: PlanningQueryDto) {
    return this.planningService.findAll(query)
  }

  @Get('stats')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Statistiques des planning' })
  async getStats() {
    return this.planningService.getStats()
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un planning par ID' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.planningService.findOne(id)
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Mettre à jour un planning' })
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() updateDto: UpdatePlanningDto) {
    return this.planningService.update(id, updateDto)
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer un planning' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.planningService.remove(id)
  }
}
