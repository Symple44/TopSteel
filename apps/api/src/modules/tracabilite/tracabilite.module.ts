import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TracabiliteService } from './tracabilite.service';
import { TracabiliteController } from './tracabilite.controller';
import { Tracabilite } from './entities/tracabilite.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Tracabilite])],
  controllers: [TracabiliteController],
  providers: [TracabiliteService],
  exports: [TracabiliteService],
})
export class TracabiliteModule {}
