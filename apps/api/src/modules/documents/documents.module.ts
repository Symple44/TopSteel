import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentsService } from './documents.service';
import { DocumentsController } from './documents.controller';
import { Document } from './entities/document.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Document])],
  controllers: [DocumentsController],
  providers: [DocumentsService],
  exports: [DocumentsService],
})
export class DocumentsModule {}


