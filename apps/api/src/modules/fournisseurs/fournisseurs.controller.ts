// apps/api/src/modules/fournisseurs/fournisseurs.controller.ts
import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseUUIDPipe,
    Patch,
    Post,
    Query,
    UseGuards,
} from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiOperation,
    ApiQuery,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../users/entities/user.entity';
import { CreateFournisseurDto } from './dto/create-fournisseur.dto';
import { UpdateFournisseurDto } from './dto/update-fournisseur.dto';
import { FournisseursService } from './fournisseurs.service';
  
  @Controller('fournisseurs')
  @ApiTags('fournisseurs')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  export class FournisseursController {
    constructor(private readonly fournisseursService: FournisseursService) {}
  
    @Post()
    @Roles(UserRole.ADMIN, UserRole.MANAGER)
    @ApiOperation({ summary: 'Créer un nouveau fournisseur' })
    @ApiResponse({ status: 201, description: 'Fournisseur créé avec succès' })
    create(@Body() createFournisseurDto: CreateFournisseurDto) {
      return this.fournisseursService.create(createFournisseurDto);
    }
  
    @Get()
    @ApiOperation({ summary: 'Lister tous les fournisseurs' })
    @ApiQuery({ name: 'search', required: false })
    @ApiQuery({ name: 'categorie', required: false })
    @ApiQuery({ name: 'actif', required: false, type: Boolean })
    findAll(
      @Query('search') search?: string,
      @Query('categorie') categorie?: string,
      @Query('actif') actif?: boolean,
    ) {
      return this.fournisseursService.findAll({ search, categorie, actif });
    }
  
    @Get('stats')
    @ApiOperation({ summary: 'Statistiques des fournisseurs' })
    getStats() {
      return this.fournisseursService.getStats();
    }
  
    @Get(':id')
    @ApiOperation({ summary: 'Récupérer un fournisseur par ID' })
    findOne(@Param('id', ParseUUIDPipe) id: string) {
      return this.fournisseursService.findOne(+id);
    }
  
    @Get(':id/produits')
    @ApiOperation({ summary: 'Lister les produits d\'un fournisseur' })
    getProduits(@Param('id', ParseUUIDPipe) id: string) {
      return this.fournisseursService.getProduits(+id);
    }
  
    @Get(':id/commandes')
    @ApiOperation({ summary: 'Historique des commandes' })
    getCommandes(@Param('id', ParseUUIDPipe) id: string) {
      return this.fournisseursService.getCommandes(+id);
    }
  
    @Patch(':id')
    @Roles(UserRole.ADMIN, UserRole.MANAGER)
    @ApiOperation({ summary: 'Mettre à jour un fournisseur' })
    update(
      @Param('id', ParseUUIDPipe) id: string,
      @Body() updateFournisseurDto: UpdateFournisseurDto,
    ) {
      return this.fournisseursService.update(+id, updateFournisseurDto);
    }
  
    @Patch(':id/toggle-actif')
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Activer/Désactiver un fournisseur' })
    toggleActif(@Param('id', ParseUUIDPipe) id: string) {
      return this.fournisseursService.toggleActif(+id);
    }
  
    @Delete(':id')
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Supprimer un fournisseur' })
    remove(@Param('id', ParseUUIDPipe) id: string) {
      return this.fournisseursService.remove(+id);
    }
  }

