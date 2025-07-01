import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QualiteService } from './qualite.service';
import { QualiteController } from './qualite.controller';
import { Qualite } from './entities/qualite.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Qualite])],
  controllers: [QualiteController],
  providers: [QualiteService],
  exports: [QualiteService],
})
export class QualiteModule {}
