import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MachinesService } from './machines.service';
import { MachinesController } from './machines.controller';
import { Machines } from './entities/machines.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Machines])],
  controllers: [MachinesController],
  providers: [MachinesService],
  exports: [MachinesService],
})
export class MachinesModule {}
