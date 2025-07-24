import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { DocumentsController } from './documents.controller'
import { DocumentsService } from './documents.service'
import { Document } from './entities/document.entity'

@Module({
  imports: [TypeOrmModule.forFeature([Document], 'tenant')],
  controllers: [DocumentsController],
  providers: [DocumentsService],
  exports: [DocumentsService],
})
export class DocumentsModule {}
