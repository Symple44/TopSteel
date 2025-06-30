import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tracabilite } from './entities/tracabilite.entity';

@Injectable()
export class TracabiliteService {
  private readonly logger = new Logger(TracabiliteService.name);

  constructor(
    @InjectRepository(Tracabilite)
    private repository: Repository<Tracabilite>,
  ) {}

  async findAll(): Promise<Tracabilite[]> {
    this.logger.log('Récupération de tous les tracabilite');
    return this.repository.find({ where: {}, order: {} });
  }

  async findOne(id: string): Promise | null<Tracabilite | null> {
    this.logger.log(`Récupération tracabilite id: ${id}`);
    return this.repository.findOne({ where: { id } });
  }

  async create(data: Partial<Tracabilite>, userId?: string): Promise<Tracabilite> {
    this.logger.log(`Création nouveau tracabilite par user: ${userId}`);
    const entity = this.repository.create({
      ...data,
      
      metadata: { created_from: 'api', version: '1.0' }
    });
    return this.repository.save(entity);
  }

  async update(id: string, data: Partial<Tracabilite>, userId?: string): Promise<Tracabilite> {
    this.logger.log(`Mise à jour tracabilite id: ${id} par user: ${userId}`);
    await this.repository.update(id, {
      ...data,
      
    });
    return this.findOne(id);
  }

  async remove(id: string, userId?: string): Promise<void> {
    this.logger.log(`Suppression logique tracabilite id: ${id} par user: ${userId}`);
    await this.repository.update(id, { 
       
      updated_by: userId 
    });
  }

  // Méthodes métier spécifiques
  async findByStatus(status: string): Promise<Tracabilite[]> {
    return this.repository.find({ where: {} });
  }

  async getStatistics(): Promise<any> {
    const total = await this.repository.count({ where: {} });
    const recent = await this.repository.count({ 
      where: { 
        actif: true,
        created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 jours
      } 
    });
    
    return { total, recent, module: 'tracabilite' };
  }
}
