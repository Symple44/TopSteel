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

  async findOne(id: number): Promise<Clients | null> {
    return this.clientsRepository.findOne({ where: { id } });
  }

  async create(data: Partial<Clients>): Promise<Clients> {
    const entity = this.clientsRepository.create(data);
    return this.clientsRepository.save(entity);
  }

  async update(id: number, data: Partial<Clients>): Promise<Clients | null> {
    await this.clientsRepository.update(id, data);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.clientsRepository.delete(id);
  }
}

