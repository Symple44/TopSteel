// apps/api/src/app.service.ts
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class AppService {
  constructor(private readonly configService: ConfigService) {}

  getHello(): string {
    return "Hello World!";
  }

  getHealth() {
    return {
      status: "ok",
      message: "ERP TOPSTEEL API is running",
      timestamp: new Date().toISOString(),
      version: this.configService.get("app.version"),
      environment: this.configService.get("app.env"),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    };
  }

  getInfo() {
    return {
      name: this.configService.get("app.name"),
      version: this.configService.get("app.version"),
      description: "API Backend pour ERP TOPSTEEL - Gestion métallurgique",
      environment: this.configService.get("app.env"),
      nodeVersion: process.version,
      platform: process.platform,
    };
  }
}