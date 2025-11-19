import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'



import { ParametersController } from './parameters.controller'
import { ParameterService } from './services/parameter.service'
import { TestParametersController } from './test-parameters.controller'
import { ParametersPrismaModule } from '../../domains/parameters/prisma/parameters-prisma.module'

@Module({
  imports: [
    ParametersPrismaModule, // Prisma-based parameter services (System/Application/Client)
    TypeOrmModule.forFeature([ParameterSystem, ParameterApplication, ParameterClient], 'auth'),
  ],
  controllers: [ParametersController, TestParametersController],
  providers: [ParameterService],
  exports: [ParameterService],
})
export class ParametersModule {}
import { ParameterApplication } from '../../features/parameters/entities/parameter-application.entity'
import { ParameterClient } from '../../features/parameters/entities/parameter-client.entity'
import { ParameterSystem } from '../../features/parameters/entities/parameter-system.entity'
