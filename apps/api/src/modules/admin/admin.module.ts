import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { SystemParameter } from './entitites/system-parameter.entity'
import { SystemParametersController } from './system-parameters.controller'
import { SystemParametersService } from './system-parameters.service'

@Module({
  imports: [TypeOrmModule.forFeature([SystemParameter])],
  controllers: [SystemParametersController],
  providers: [SystemParametersService],
  exports: [SystemParametersService],
})
export class AdminModule {}