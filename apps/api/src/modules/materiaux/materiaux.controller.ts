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
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { UserRole } from "../users/entities/user.entity";
import type { CreateMateriauxDto } from "./dto/create-materiaux.dto";
import type { MateriauxQueryDto } from "./dto/materiaux-query.dto";
import type { UpdateMateriauxDto } from "./dto/update-materiaux.dto";
import type { MateriauxService } from "./materiaux.service";

@Controller("materiaux")
@ApiTags("🧱 Matériaux")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth("JWT-auth")
export class MateriauxController {
  constructor(private readonly materiauxService: MateriauxService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: "Créer un nouveau materiaux" })
  @ApiResponse({ status: 201, description: "Materiaux créé avec succès" })
  async create(@Body() createDto: CreateMateriauxDto) {
    return this.materiauxService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: "Lister les materiaux avec pagination" })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "search", required: false, type: String })
  async findAll(@Query() query: MateriauxQueryDto) {
    return this.materiauxService.findAll(query);
  }

  @Get("stats")
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: "Statistiques des materiaux" })
  async getStats() {
    return this.materiauxService.getStats();
  }

  @Get(":id")
  @ApiOperation({ summary: "Récupérer un materiaux par ID" })
  async findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.materiauxService.findOne(id);
  }

  @Patch(":id")
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: "Mettre à jour un materiaux" })
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateMateriauxDto,
  ) {
    return this.materiauxService.update(id, updateDto);
  }

  @Delete(":id")
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Supprimer un materiaux" })
  async remove(@Param("id", ParseUUIDPipe) id: string) {
    return this.materiauxService.remove(id);
  }
}
