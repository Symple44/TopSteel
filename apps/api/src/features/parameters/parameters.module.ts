import { DatabaseModule } from '../../core/database/database.module'
import { Module } from '@nestjs/common'
import { ParametersPrismaModule } from '../../domains/parameters/prisma/parameters-prisma.module'
import { ParametersController } from '../../domains/parameters/parameters.controller'

@Module({
  imports: [
    DatabaseModule,
    ParametersPrismaModule, // Prisma-based parameter services (System/Application/Client)
    // TypeORM repositories disabled - using Prisma services
  ],
  controllers: [
    ParametersController, // Clean - uses pure Prisma (ParameterSystemPrismaService)
    // TestParametersController, // Disabled - depends on TypeORM @InjectRepository
  ],
  providers: [
    // ParameterService, // Disabled - uses TypeORM @InjectRepository
  ],
  exports: [
    ParametersPrismaModule, // Export Prisma services for other modules
  ],
})
export class ParametersModule {}
