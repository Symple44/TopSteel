import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ControleQualite } from './entities/qualite.entity';
import { QualiteController } from './qualite.controller';
import { QualiteService } from './qualite.service';

@Module({
  imports: [TypeOrmModule.forFeature([ControleQualite])],
  controllers: [QualiteController],
  providers: [QualiteService],
  exports: [QualiteService],
})
export class QualiteModule {}