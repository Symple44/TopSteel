import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Facturation } from './entities/facturation.entity'
import { FacturationController } from './facturation.controller'
import { FacturationService } from './facturation.service'

@Module({
  imports: [TypeOrmModule.forFeature([Facturation])],
  controllers: [FacturationController],
  providers: [FacturationService],
  exports: [FacturationService],
})
export class FacturationModule {}
