// apps/api/src/modules/projets/projets.controller.ts
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
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { UserRole } from "../users/entities/user.entity";
import { CreateProjetDto } from "./dto/create-projet.dto";
import { ProjetQueryDto } from "./dto/projet-query.dto";
import { UpdateProjetDto } from "./dto/update-projet.dto";
import { ProjetsService } from "./projets.service";

@Controller("projets")
@ApiTags("projets")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ProjetsController {
  constructor(private readonly projetsService: ProjetsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.COMMERCIAL)
  @ApiOperation({ summary: "Créer un nouveau projet" })
  @ApiResponse({ status: 201, description: "Projet créé avec succès" })
  async create(
    @Body() createProjetDto: CreateProjetDto,
    @CurrentUser() user: any
  ) {
    return this.projetsService.create(createProjetDto, user.id);
  }

  @Get()
  @ApiOperation({ summary: "Lister tous les projets" })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "search", required: false, type: String })
  @ApiQuery({ name: "statut", required: false, enum: ProjetStatut })
  @ApiQuery({ name: "clientId", required: false, type: String })
  async findAll(@Query() query: ProjetQueryDto) {
    return this.projetsService.findAll(query);
  }

  @Get("stats")
  @ApiOperation({ summary: "Statistiques des projets" })
  async getStats(@CurrentUser() user: any) {
    return this.projetsService.getStats(user);
  }

  @Get(":id")
  @ApiOperation({ summary: "Récupérer un projet par ID" })
  async findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.projetsService.findOne(id);
  }

  @Patch(":id")
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.COMMERCIAL)
  @ApiOperation({ summary: "Mettre à jour un projet" })
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updateProjetDto: UpdateProjetDto,
    @CurrentUser() user: any
  ) {
    return this.projetsService.update(id, updateProjetDto, user.id);
  }

  @Patch(":id/statut")
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: "Changer le statut d'un projet" })
  async updateStatut(
    @Param("id", ParseUUIDPipe) id: string,
    @Body("statut") statut: ProjetStatut,
    @CurrentUser() user: any
  ) {
    return this.projetsService.updateStatut(id, statut, user.id);
  }

  @Patch(":id/avancement")
  @ApiOperation({ summary: "Mettre à jour l'avancement" })
  async updateAvancement(
    @Param("id", ParseUUIDPipe) id: string,
    @Body("avancement") avancement: number
  ) {
    return this.projetsService.updateAvancement(id, avancement);
  }

  @Delete(":id")
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Supprimer un projet" })
  async remove(@Param("id", ParseUUIDPipe) id: string) {
    return this.projetsService.remove(id);
  }

  @Post(":id/documents")
  @ApiOperation({ summary: "Ajouter un document au projet" })
  async addDocument(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() documentData: any
  ) {
    return this.projetsService.addDocument(id, documentData);
  }

  @Get(":id/timeline")
  @ApiOperation({ summary: "Timeline du projet" })
  async getTimeline(@Param("id", ParseUUIDPipe) id: string) {
    return this.projetsService.getTimeline(id);
  }
}
