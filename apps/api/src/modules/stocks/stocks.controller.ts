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
import { StocksService } from './stocks.service';
import { CreateStocksDto } from './dto/create-stocks.dto';
import { UpdateStocksDto } from './dto/update-stocks.dto';
import { StocksQueryDto } from './dto/stocks-query.dto';

@Controller('stocks')
@ApiTags('stocks')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class StocksController {
  constructor(private readonly stocksService: StocksService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Créer un nouveau stocks' })
  @ApiResponse({ status: 201, description: 'Stocks créé avec succès' })
  async create(@Body() createDto: CreateStocksDto) {
    return this.stocksService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lister les stocks avec pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  async findAll(@Query() query: StocksQueryDto) {
    return this.stocksService.findAll(query);
  }

  @Get('stats')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Statistiques des stocks' })
  async getStats() {
    return this.stocksService.getStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un stocks par ID' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.stocksService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Mettre à jour un stocks' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateStocksDto
  ) {
    return this.stocksService.update(id, updateDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer un stocks' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.stocksService.remove(id);
  }
}
