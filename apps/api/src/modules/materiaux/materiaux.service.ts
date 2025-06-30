import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { Materiau } from './entities/materiaux.entity';

@Injectable()
export class MateriauxService {
  private readonly logger = new Logger(MateriauxService.name);

  constructor(
    @InjectRepository(Materiau)
    private repository: Repository<Materiau>,
  ) {}

  async findAll(): Promise<Materiau[]> {
    this.logger.log('Récupération de tous les materiau');
    return this.repository.find({ 
      where: { actif: true }, 
      order: { created_at: "DESC" } 
    });
  }

  async findOne(id: string): Promise<Materiau | null> {
    this.logger.log('Récupération materiau id: ' + id);
    return this.repository.findOne({ where: { id } });
  }

  async create(data: Partial<Materiau>, userId?: string): Promise<Materiau> {
    this.logger.log('Création nouveau materiau par user: ' + userId);
    const entity = this.repository.create({
      ...data,
      created_by: userId,
      metadata: { created_from: 'api', version: '1.0' }
    });
    return this.repository.save(entity);
  }

  async update(id: string, data: Partial<Materiau>, userId?: string): Promise<Materiau | null> {
    this.logger.log('Mise à jour materiau id: ' + id + ' par user: ' + userId);
    await this.repository.update(id, {
      ...data,
      updated_by: userId
    });
    return this.findOne(id);
  }

  async remove(id: string, userId?: string): Promise<void> {
    this.logger.log('Suppression logique materiau id: ' + id + ' par user: ' + userId);
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
    
    return { total, recent, module: 'materiau' };
  }
}

