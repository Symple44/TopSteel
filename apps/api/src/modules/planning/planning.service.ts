import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThanOrEqual, Repository } from 'typeorm';
import { Planning } from './entities/planning.entity';

@Injectable()
export class PlanningService {
  private readonly logger = new Logger(PlanningService.name);

  constructor(
    @InjectRepository(Planning)
    private readonly repository: Repository<Planning>,
  ) {}

  async findAll(): Promise<Planning[]> {
    this.logger.log('Récupération de tous les planning');
    return this.repository.find({ 
      where: { actif: true }, 
      order: { created_at: "DESC" } 
    });
  }

  async findOne(id: string): Promise<Planning | null> {
    this.logger.log('Récupération planning id: ' + id);
    return this.repository.findOne({ where: { id } });
  }

  async create(data: Partial<Planning>, userId?: string): Promise<Planning> {
    this.logger.log('Création nouveau planning par user: ' + userId);
    const entity = this.repository.create({
      ...data,
      created_by: userId,
      metadata: { created_from: 'api', version: '1.0' }
    });
    return this.repository.save(entity);
  }

  async update(id: string, data: Partial<Planning>, userId?: string): Promise<Planning | null> {
    this.logger.log('Mise à jour planning id: ' + id + ' par user: ' + userId);
    // Omit 'metadata' from update payload to satisfy TypeORM typing
    const { metadata: _metadata, ...updateData } = data;
    await this.repository.update(id, {
      ...updateData,
      updated_by: userId
    });
    return this.findOne(id);
  }

  async remove(id: string, userId?: string): Promise<void> {
    this.logger.log('Suppression logique planning id: ' + id + ' par user: ' + userId);
    await this.repository.update(id, { 
      actif: false,
      updated_by: userId 
    });
  }
  async findByStatus(status: string): Promise<Planning[]> {
    return this.repository.find({ 
      where: { statut: status, actif: true } 
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
    
    return { total, recent, module: 'planning' };
  }
}
