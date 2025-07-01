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
import { CreateFacturationDto } from "./dto/create-facturation.dto";
import { FacturationQueryDto } from "./dto/facturation-query.dto";
import { UpdateFacturationDto } from "./dto/update-facturation.dto";
import { FacturationService } from "./facturation.service";

@Controller("facturation")
@ApiTags("🧾 Facturation")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth("JWT-auth")
export class FacturationController {
  constructor(private readonly facturationService: FacturationService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: "Créer un nouveau facturation" })
  @ApiResponse({ status: 201, description: "Facturation créé avec succès" })
  async create(@Body() createDto: CreateFacturationDto) {
    return this.facturationService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: "Lister les facturation avec pagination" })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "search", required: false, type: String })
  async findAll(@Query() query: FacturationQueryDto) {
    return this.facturationService.findAll(query);
  }

  @Get("stats")
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: "Statistiques des facturation" })
  async getStats() {
    return this.facturationService.getStats();
  }

  @Get(":id")
  @ApiOperation({ summary: "Récupérer un facturation par ID" })
  async findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.facturationService.findOne(id);
  }

  @Patch(":id")
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: "Mettre à jour un facturation" })
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateFacturationDto,
  ) {
    return this.facturationService.update(id, updateDto);
  }

  @Delete(":id")
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Supprimer un facturation" })
  async remove(@Param("id", ParseUUIDPipe) id: string) {
    return this.facturationService.remove(id);
  }
}
