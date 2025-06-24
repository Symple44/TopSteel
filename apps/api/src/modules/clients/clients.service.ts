import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Clients } from './entities/clients.entity';

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(Clients)
    private clientsRepository: Repository<Clients>,
  ) {}

  async findAll(): Promise<Clients[]> {
    return this.clientsRepository.find();
  }

  async findOne(id: string): Promise<Clients> {
    return this.clientsRepository.findOne({ where: { id } });
  }

  async create(data: Partial<Clients>): Promise<Clients> {
    const entity = this.clientsRepository.create(data);
    return this.clientsRepository.save(entity);
  }

  async update(id: string, data: Partial<Clients>): Promise<Clients> {
    await this.clientsRepository.update(id, data);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.clientsRepository.delete(id);
  }
}
