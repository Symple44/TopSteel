import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ParametersController } from './parameters.controller'
import { TestParametersController } from './test-parameters.controller'
import { ParameterService } from './services/parameter.service'
import { ParameterSystem } from './entities/parameter-system.entity'
import { ParameterApplication } from './entities/parameter-application.entity'
import { ParameterClient } from './entities/parameter-client.entity'

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ParameterSystem,
      ParameterApplication,
      ParameterClient,
    ], 'auth'),
  ],
  controllers: [ParametersController, TestParametersController],
  providers: [ParameterService],
  exports: [ParameterService],
})
export class ParametersModule {}