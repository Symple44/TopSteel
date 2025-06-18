// apps/api/src/app.controller.ts
import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { AppService } from "./app.service";

@ApiTags("App")
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: "Message de bienvenue" })
  @ApiResponse({ status: 200, description: "Message de bienvenue" })
  getHello(): string {
    return this.appService.getHello();
  }

  @Get("health")
  @ApiOperation({ summary: "Health check de l'API" })
  @ApiResponse({ status: 200, description: "Statut de santé de l'API" })
  getHealth() {
    return this.appService.getHealth();
  }

  @Get("info")
  @ApiOperation({ summary: "Informations sur l'API" })
  @ApiResponse({ status: 200, description: "Informations détaillées sur l'API" })
  getInfo() {
    return this.appService.getInfo();
  }
}