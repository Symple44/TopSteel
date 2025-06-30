import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notifications } from './entities/notifications.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notifications)
    private notificationsRepository: Repository<Notifications>,
  ) {}

  async findAll(): Promise<Notifications[]> {
    return this.notificationsRepository.find();
  }

  async findOne(id: string): Promise<Notifications | null> {
    return this.notificationsRepository.findOne({ where: { id } });
  }

  async create(data: Partial<Notifications>): Promise<Notifications> {
    const entity = this.notificationsRepository.create(data);
    return this.notificationsRepository.save(entity);
  }

  async update(id: string, data: Partial<Notifications>): Promise<Notifications | null> {
    await this.notificationsRepository.update(id, data);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.notificationsRepository.delete(id);
  }
}
