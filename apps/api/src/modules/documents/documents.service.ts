import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Document } from './entities/document.entity';

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(Document)
    private documentsRepository: Repository<Document>,
  ) {}

  async findAll(): Promise<Document[]> {
    return this.documentsRepository.find();
  }

  async findOne(id: number): Promise<Document> {
    return this.documentsRepository.findOne({ where: { id } });
  }

  async create(data: Partial<Document>): Promise<Document> {
    const entity = this.documentsRepository.create(data);
    return this.documentsRepository.save(entity);
  }

  async update(id: number, data: Partial<Document>): Promise<Document> {
    await this.documentsRepository.update(id, data);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.documentsRepository.delete(id);
  }
}



