import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThanOrEqual, Repository } from 'typeorm';
import { ControleQualite } from './entities/qualite.entity';

@Injectable()
export class QualiteService {
  private readonly logger = new Logger(QualiteService.name);

  constructor(
    @InjectRepository(ControleQualite)
    private readonly repository: Repository<ControleQualite>,
  ) {}

  async findAll(): Promise<ControleQualite[]> {
    this.logger.log('Récupération de tous les controlequalite');
    return this.repository.find({ 
      where: { actif: true }, 
      order: { created_at: "DESC" } 
    });
  }

  async findOne(id: string): Promise<ControleQualite | null> {
    this.logger.log('Récupération controlequalite id: ' + id);
    return this.repository.findOne({ where: { id } });
  }

  async create(data: Partial<ControleQualite>, userId?: string): Promise<ControleQualite> {
    this.logger.log('Création nouveau controlequalite par user: ' + userId);
    const entity = this.repository.create({
      ...data,
      created_by: userId,
      metadata: { created_from: 'api', version: '1.0' }
    });
    return this.repository.save(entity);
  }

  async update(id: string, data: Partial<ControleQualite>, userId?: string): Promise<ControleQualite | null> {
    this.logger.log('Mise à jour controlequalite id: ' + id + ' par user: ' + userId);
    // Omit 'metadata' from update payload to avoid type incompatibility
    const { metadata: _metadata, ...updateData } = data;
    await this.repository.update(id, {
      ...updateData,
      updated_by: userId
    });
    return this.findOne(id);
  }

  async remove(id: string, userId?: string): Promise<void> {
    this.logger.log('Suppression logique controlequalite id: ' + id + ' par user: ' + userId);
    await this.repository.update(id, { 
      actif: false,
      updated_by: userId 
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
    
    return { total, recent, module: 'controlequalite' };
  }
}

