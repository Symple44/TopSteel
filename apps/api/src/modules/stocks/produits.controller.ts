import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { UserRole } from "../users/entities/user.entity";
import { CreateProduitDto } from "./dto/create-produit.dto";
import { ProduitsQueryDto } from "./dto/produits-query.dto";
import { UpdateProduitDto } from "./dto/update-produit.dto";
import { ProduitsService } from "./produits.service";

@Controller("produits")
@ApiTags("📦 Produits")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth("JWT-auth")
export class ProduitsController {
  constructor(private readonly produitsService: ProduitsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: "Créer un nouveau produit" })
  @ApiResponse({ status: 201, description: "Produit créé avec succès" })
  async create(@Body() createDto: CreateProduitDto) {
    return this.produitsService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: "Lister les produits avec pagination" })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "search", required: false, type: String })
  @ApiQuery({ name: "fournisseurPrincipal", required: false, type: Number })
  @ApiQuery({ name: "prixMin", required: false, type: Number })
  @ApiQuery({ name: "prixMax", required: false, type: Number })
  async findAll(@Query() query: ProduitsQueryDto) {
    return this.produitsService.findAll(query);
  }

  @Get("stats")
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: "Statistiques des produits" })
  async getStats() {
    return this.produitsService.getStats();
  }

  @Get("references")
  @ApiOperation({ summary: "Rechercher des produits par référence" })
  @ApiQuery({
    name: "q",
    required: true,
    type: String,
    description: "Terme de recherche pour la référence",
  })
  async searchByReference(@Query("q") searchTerm: string) {
    return this.produitsService.searchByReference(searchTerm);
  }

  @Get(":id")
  @ApiOperation({ summary: "Récupérer un produit par ID" })
  async findOne(@Param("id", ParseIntPipe) id: number) {
    return this.produitsService.findOne(id);
  }

  @Patch(":id")
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: "Mettre à jour un produit" })
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateDto: UpdateProduitDto,
  ) {
    return this.produitsService.update(id, updateDto);
  }

  @Delete(":id")
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Supprimer un produit" })
  async remove(@Param("id", ParseIntPipe) id: number) {
    return this.produitsService.remove(id);
  }

  @Get("reference/:reference")
  @ApiOperation({ summary: "Récupérer un produit par sa référence" })
  async findByReference(@Param("reference") reference: string) {
    return this.produitsService.findByReference(reference);
  }

  @Get("fournisseur/:fournisseurId")
  @ApiOperation({ summary: "Récupérer les produits d'un fournisseur" })
  async findByFournisseur(
    @Param("fournisseurId", ParseIntPipe) fournisseurId: number,
  ) {
    return this.produitsService.findByFournisseur(fournisseurId);
  }
}
