import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Documents } from './entities/documents.entity';

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(Documents)
    private documentsRepository: Repository<Documents>,
  ) {}

  async findAll(): Promise<Documents[]> {
    return this.documentsRepository.find();
  }

  async findOne(id: string): Promise<Documents> {
    return this.documentsRepository.findOne({ where: { id } });
  }

  async create(data: Partial<Documents>): Promise<Documents> {
    const entity = this.documentsRepository.create(data);
    return this.documentsRepository.save(entity);
  }

  async update(id: string, data: Partial<Documents>): Promise<Documents> {
    await this.documentsRepository.update(id, data);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.documentsRepository.delete(id);
  }
}
