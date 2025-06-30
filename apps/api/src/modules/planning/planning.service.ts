import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Planning } from './entities/planning.entity';

@Injectable()
export class PlanningService {
  private readonly logger = new Logger(PlanningService.name);

  constructor(
    @InjectRepository(Planning)
    private repository: Repository<Planning>,
  ) {}

  async findAll(): Promise<Planning[]> {
    this.logger.log('Récupération de tous les planning');
    return this.repository.find({ where: {}, order: {} });
  }

  async findOne(id: string): Promise | null<Planning | null> {
    this.logger.log(`Récupération planning id: ${id}`);
    return this.repository.findOne({ where: { id } });
  }

  async create(data: Partial<Planning>, userId?: string): Promise<Planning> {
    this.logger.log(`Création nouveau planning par user: ${userId}`);
    const entity = this.repository.create({
      ...data,
      
      metadata: { created_from: 'api', version: '1.0' }
    });
    return this.repository.save(entity);
  }

  async update(id: string, data: Partial<Planning>, userId?: string): Promise<Planning> {
    this.logger.log(`Mise à jour planning id: ${id} par user: ${userId}`);
    await this.repository.update(id, {
      ...data,
      
    });
    return this.findOne(id);
  }

  async remove(id: string, userId?: string): Promise<void> {
    this.logger.log(`Suppression logique planning id: ${id} par user: ${userId}`);
    await this.repository.update(id, { 
       
      updated_by: userId 
    });
  }

  // Méthodes métier spécifiques
  async findByStatus(status: string): Promise<Planning[]> {
    return this.repository.find({ where: { statut: status, actif: true } });
  }

  async getStatistics(): Promise<any> {
    const total = await this.repository.count({ where: {} });
    const recent = await this.repository.count({ 
      where: { 
        actif: true,
        created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 jours
      } 
    });
    
    return { total, recent, module: 'planning' };
  }
}
