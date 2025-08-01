import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ParameterApplication } from './entities/parameter-application.entity'
import { ParameterClient } from './entities/parameter-client.entity'
import { ParameterSystem } from './entities/parameter-system.entity'
import { ParametersController } from './parameters.controller'
import { ParameterService } from './services/parameter.service'
import { TestParametersController } from './test-parameters.controller'

@Module({
  imports: [
    TypeOrmModule.forFeature([ParameterSystem, ParameterApplication, ParameterClient], 'auth'),
  ],
  controllers: [ParametersController, TestParametersController],
  providers: [ParameterService],
  exports: [ParameterService],
})
export class ParametersModule {}
