import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Qualite } from './entities/qualite.entity'
import { QualiteController } from './qualite.controller'
import { QualiteService } from './qualite.service'

@Module({
  imports: [TypeOrmModule.forFeature([Qualite])],
  controllers: [QualiteController],
  providers: [QualiteService],
  exports: [QualiteService],
})
export class QualiteModule {}
