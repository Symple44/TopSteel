import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
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
    return this.repository.find({ 
      where: { actif: true }, 
      order: { created_at: "DESC" } 
    });
  }

  async findOne(id: string): Promise<Tracabilite | null> {
    this.logger.log('Récupération tracabilite id: ' + id);
    return this.repository.findOne({ where: { id } });
  }

  async create(data: Partial<Tracabilite>, userId?: string): Promise<Tracabilite> {
    this.logger.log('Création nouveau tracabilite par user: ' + userId);
    const entity = this.repository.create({
      ...data,
      created_by: userId,
      metadata: { created_from: 'api', version: '1.0' }
    });
    return this.repository.save(entity);
  }

  async update(id: string, data: Partial<Tracabilite>, userId?: string): Promise<Tracabilite | null> {
    this.logger.log('Mise à jour tracabilite id: ' + id + ' par user: ' + userId);
    await this.repository.update(id, {
      ...data,
      updated_by: userId
    });
    return this.findOne(id);
  }

  async remove(id: string, userId?: string): Promise<void> {
    this.logger.log('Suppression logique tracabilite id: ' + id + ' par user: ' + userId);
    await this.repository.update(id, { 
      actif: false,
      updated_by: userId 
    });
  }

  async getStatistics(): Promise<any> {
    const total = await this.repository.count({ where: { actif: true } });
    const recent = await this.repository.count({ 
      where: { 
        actif: true,
        created_at: MoreThanOrEqual(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
      } 
    });
    
    return { total, recent, module: 'tracabilite' };
  }
}
