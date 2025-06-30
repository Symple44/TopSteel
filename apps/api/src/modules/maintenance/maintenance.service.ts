import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Maintenance } from './entities/maintenance.entity';

@Injectable()
export class MaintenanceService {
  private readonly logger = new Logger(MaintenanceService.name);

  constructor(
    @InjectRepository(Maintenance)
    private repository: Repository<Maintenance>,
  ) {}

  async findAll(): Promise<Maintenance[]> {
    this.logger.log('Récupération de tous les maintenance');
    return this.repository.find({ where: {}, order: {} });
  }

  async findOne(id: string): Promise | null<Maintenance | null> {
    this.logger.log(`Récupération maintenance id: ${id}`);
    return this.repository.findOne({ where: { id } });
  }

  async create(data: Partial<Maintenance>, userId?: string): Promise<Maintenance> {
    this.logger.log(`Création nouveau maintenance par user: ${userId}`);
    const entity = this.repository.create({
      ...data,
      
      metadata: { created_from: 'api', version: '1.0' }
    });
    return this.repository.save(entity);
  }

  async update(id: string, data: Partial<Maintenance>, userId?: string): Promise<Maintenance> {
    this.logger.log(`Mise à jour maintenance id: ${id} par user: ${userId}`);
    await this.repository.update(id, {
      ...data,
      
    });
    return this.findOne(id);
  }

  async remove(id: string, userId?: string): Promise<void> {
    this.logger.log(`Suppression logique maintenance id: ${id} par user: ${userId}`);
    await this.repository.update(id, { 
       
      updated_by: userId 
    });
  }

  // Méthodes métier spécifiques
  async findByStatus(status: string): Promise<Maintenance[]> {
    return this.repository.find({ where: { type_maintenance: status, actif: true } });
  }

  async getStatistics(): Promise<any> {
    const total = await this.repository.count({ where: {} });
    const recent = await this.repository.count({ 
      where: { 
        actif: true,
        created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 jours
      } 
    });
    
    return { total, recent, module: 'maintenance' };
  }
}
