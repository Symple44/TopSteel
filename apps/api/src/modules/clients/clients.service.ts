// apps/api/src/modules/clients/clients.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client } from './entities/clients.entity';

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(Client) 
    private clientsRepository: Repository<Client>,
  ) {}

  async findAll(): Promise<Client[]> {
    return this.clientsRepository.find();
  }

  async findOne(id: number): Promise<Client | null> {
    return this.clientsRepository.findOne({ where: { id } });
  }

  async create(data: Partial<Client>): Promise<Client> {
    const entity = this.clientsRepository.create(data);
    return this.clientsRepository.save(entity);
  }

  async update(id: number, data: Partial<Client>): Promise<Client | null> {
    await this.clientsRepository.update(id, data);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.clientsRepository.delete(id);
  }
}