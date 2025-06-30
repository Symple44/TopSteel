import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThanOrEqual, Repository } from 'typeorm';
import { Maintenance } from './entities/maintenance.entity';

@Injectable()
export class MaintenanceService {
  private readonly logger = new Logger(MaintenanceService.name);

  constructor(
    @InjectRepository(Maintenance)
    private readonly repository: Repository<Maintenance>,
  ) {}

  async findAll(): Promise<Maintenance[]> {
    this.logger.log('Récupération de tous les maintenance');
    return this.repository.find({ 
      where: { actif: true }, 
      order: { created_at: "DESC" } 
    });
  }

  async findOne(id: string): Promise<Maintenance | null> {
    this.logger.log('Récupération maintenance id: ' + id);
    return this.repository.findOne({ where: { id } });
  }

  async create(data: Partial<Maintenance>, userId?: string): Promise<Maintenance> {
    this.logger.log('Création nouveau maintenance par user: ' + userId);
    const entity = this.repository.create({
      ...data,
      created_by: userId,
      metadata: { created_from: 'api', version: '1.0' }
    });
    return this.repository.save(entity);
  }

  async update(id: string, data: Partial<Maintenance>, userId?: string): Promise<Maintenance | null> {
    this.logger.log('Mise à jour maintenance id: ' + id + ' par user: ' + userId);
    // Omit 'metadata' from update payload to avoid type error
    const { metadata: _metadata, ...updateData } = data;
    await this.repository.update(id, {
      ...updateData,
      updated_by: userId
    });
    return this.findOne(id);
  }

  async remove(id: string, userId?: string): Promise<void> {
    this.logger.log('Suppression logique maintenance id: ' + id + ' par user: ' + userId);
    await this.repository.update(id, { 
      actif: false,
      updated_by: userId 
    });
  }
  async findByStatus(status: string): Promise<Maintenance[]> {
    return this.repository.find({ 
      where: { type_maintenance: status, actif: true } 
    });
  }

  async getStatistics(): Promise<{ total: number; recent: number; module: string }> {
    const total = await this.repository.count({ where: { actif: true } });
    const recent = await this.repository.count({ 
      where: { 
        actif: true,
        created_at: MoreThanOrEqual(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
      } 
    });
    
    return { total, recent, module: 'maintenance' };
  }
}
