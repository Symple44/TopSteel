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
import { MachinesService } from './machines.service';
import { CreateMachinesDto } from './dto/create-machines.dto';
import { UpdateMachinesDto } from './dto/update-machines.dto';
import { MachinesQueryDto } from './dto/machines-query.dto';

@Controller('machines')
@ApiTags('machines')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class MachinesController {
  constructor(private readonly machinesService: MachinesService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Créer un nouveau machines' })
  @ApiResponse({ status: 201, description: 'Machines créé avec succès' })
  async create(@Body() createDto: CreateMachinesDto) {
    return this.machinesService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lister les machines avec pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  async findAll(@Query() query: MachinesQueryDto) {
    return this.machinesService.findAll(query);
  }

  @Get('stats')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Statistiques des machines' })
  async getStats() {
    return this.machinesService.getStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un machines par ID' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.machinesService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Mettre à jour un machines' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateMachinesDto
  ) {
    return this.machinesService.update(id, updateDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer un machines' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.machinesService.remove(id);
  }
}
