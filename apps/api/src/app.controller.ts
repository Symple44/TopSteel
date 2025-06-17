// apps/api/src/app.controller.ts
import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";

@Controller()
@ApiTags("health")
export class AppController {
  @Get("health")
  @ApiOperation({ summary: "Health check" })
  getHealth() {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    };
  }
}
