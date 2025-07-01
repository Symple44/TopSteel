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
import { CreateMaintenanceDto } from "./dto/create-maintenance.dto";
import { MaintenanceQueryDto } from "./dto/maintenance-query.dto";
import { UpdateMaintenanceDto } from "./dto/update-maintenance.dto";
import { MaintenanceService } from "./maintenance.service";

@Controller("maintenance")
@ApiTags("⚙️ Maintenance")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth("JWT-auth")
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: "Créer un nouveau maintenance" })
  @ApiResponse({ status: 201, description: "Maintenance créé avec succès" })
  async create(@Body() createDto: CreateMaintenanceDto) {
    return this.maintenanceService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: "Lister les maintenance avec pagination" })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "search", required: false, type: String })
  async findAll(@Query() query: MaintenanceQueryDto) {
    return this.maintenanceService.findAll(query);
  }

  @Get("stats")
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: "Statistiques des maintenance" })
  async getStats() {
    return this.maintenanceService.getStats();
  }

  @Get(":id")
  @ApiOperation({ summary: "Récupérer un maintenance par ID" })
  async findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.maintenanceService.findOne(id);
  }

  @Patch(":id")
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: "Mettre à jour un maintenance" })
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateMaintenanceDto,
  ) {
    return this.maintenanceService.update(id, updateDto);
  }

  @Delete(":id")
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Supprimer un maintenance" })
  async remove(@Param("id", ParseUUIDPipe) id: string) {
    return this.maintenanceService.remove(id);
  }
}
