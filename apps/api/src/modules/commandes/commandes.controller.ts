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
import { CommandesService } from "./commandes.service";
import { CommandesQueryDto } from "./dto/commandes-query.dto";
import { CreateCommandeDto } from "./dto/create-commande.dto";
import { UpdateCommandeDto } from "./dto/update-commande.dto";

@Controller("commandes")
@ApiTags("🛒 Commandes")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth("JWT-auth")
export class CommandesController {
  constructor(private readonly commandesService: CommandesService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.COMMERCIAL)
  @ApiOperation({ summary: "Créer une nouvelle commande" })
  @ApiResponse({ status: 201, description: "Commande créée avec succès" })
  async create(@Body() createDto: CreateCommandeDto) {
    return this.commandesService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: "Lister les commandes avec pagination" })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "search", required: false, type: String })
  @ApiQuery({ name: "fournisseur", required: false, type: Number })
  @ApiQuery({ name: "montantMin", required: false, type: Number })
  @ApiQuery({ name: "montantMax", required: false, type: Number })
  async findAll(@Query() query: CommandesQueryDto) {
    return this.commandesService.findAll(query);
  }

  @Get("stats")
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: "Statistiques des commandes" })
  async getStats() {
    return this.commandesService.getStats();
  }

  @Get(":id")
  @ApiOperation({ summary: "Récupérer une commande par ID" })
  async findOne(@Param("id", ParseIntPipe) id: number) {
    return this.commandesService.findOne(id);
  }

  @Patch(":id")
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.COMMERCIAL)
  @ApiOperation({ summary: "Mettre à jour une commande" })
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateDto: UpdateCommandeDto,
  ) {
    return this.commandesService.update(id, updateDto);
  }

  @Delete(":id")
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Supprimer une commande" })
  async remove(@Param("id", ParseIntPipe) id: number) {
    return this.commandesService.remove(id);
  }

  @Get("fournisseur/:fournisseurId")
  @ApiOperation({ summary: "Récupérer les commandes d'un fournisseur" })
  async findByFournisseur(
    @Param("fournisseurId", ParseIntPipe) fournisseurId: number,
  ) {
    return this.commandesService.findByFournisseur(fournisseurId);
  }
}
