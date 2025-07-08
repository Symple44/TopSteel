import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Tracabilite } from './entities/tracabilite.entity'
import { TracabiliteController } from './tracabilite.controller'
import { TracabiliteService } from './tracabilite.service'

@Module({
  imports: [TypeOrmModule.forFeature([Tracabilite])],
  controllers: [TracabiliteController],
  providers: [TracabiliteService],
  exports: [TracabiliteService],
})
export class TracabiliteModule {}
