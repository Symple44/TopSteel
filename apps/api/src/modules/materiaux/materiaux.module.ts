import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Materiau } from './entities/materiaux.entity';
import { MateriauxController } from './materiaux.controller';
import { MateriauxService } from './materiaux.service';

@Module({
  imports: [TypeOrmModule.forFeature([Materiau])],
  controllers: [MateriauxController],
  providers: [MateriauxService],
  exports: [MateriauxService],
})
export class MateriauxModule {}