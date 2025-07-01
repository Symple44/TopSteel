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
import { DevisService } from "./devis.service";
import { CreateDevisDto } from "./dto/create-devis.dto";
import { DevisQueryDto } from "./dto/devis-query.dto";
import { UpdateDevisDto } from "./dto/update-devis.dto";

@Controller("devis")
@ApiTags("💰 Devis")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth("JWT-auth")
export class DevisController {
  constructor(private readonly devisService: DevisService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: "Créer un nouveau devis" })
  @ApiResponse({ status: 201, description: "Devis créé avec succès" })
  async create(@Body() createDto: CreateDevisDto) {
    return this.devisService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: "Lister les devis avec pagination" })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "search", required: false, type: String })
  async findAll(@Query() query: DevisQueryDto) {
    return this.devisService.findAll(query);
  }

  @Get("stats")
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: "Statistiques des devis" })
  async getStats() {
    return this.devisService.getStats();
  }

  @Get(":id")
  @ApiOperation({ summary: "Récupérer un devis par ID" })
  async findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.devisService.findOne(id);
  }

  @Patch(":id")
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: "Mettre à jour un devis" })
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateDevisDto,
  ) {
    return this.devisService.update(id, updateDto);
  }

  @Delete(":id")
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Supprimer un devis" })
  async remove(@Param("id", ParseUUIDPipe) id: string) {
    return this.devisService.remove(id);
  }
}
