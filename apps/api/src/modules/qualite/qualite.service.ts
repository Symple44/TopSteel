import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ControleQualite } from './entities/qualite.entity';

@Injectable()
export class QualiteService {
  private readonly logger = new Logger(QualiteService.name);

  constructor(
    @InjectRepository(ControleQualite)
    private repository: Repository<ControleQualite>,
  ) {}

  async findAll(): Promise<ControleQualite[]> {
    this.logger.log('Récupération de tous les qualite');
    return this.repository.find({ where: { actif: true }, order: { created_at: 'DESC' } });
  }

  async findOne(id: string): Promise<ControleQualite> {
    this.logger.log(`Récupération qualite id: ${id}`);
    return this.repository.findOne({ where: { id, actif: true } });
  }

  async create(data: Partial<ControleQualite>, userId?: string): Promise<ControleQualite> {
    this.logger.log(`Création nouveau qualite par user: ${userId}`);
    const entity = this.repository.create({
      ...data,
      created_by: userId,
      metadata: { created_from: 'api', version: '1.0' }
    });
    return this.repository.save(entity);
  }

  async update(id: string, data: Partial<ControleQualite>, userId?: string): Promise<ControleQualite> {
    this.logger.log(`Mise à jour qualite id: ${id} par user: ${userId}`);
    await this.repository.update(id, {
      ...data,
      updated_by: userId,
    });
    return this.findOne(id);
  }

  async remove(id: string, userId?: string): Promise<void> {
    this.logger.log(`Suppression logique qualite id: ${id} par user: ${userId}`);
    await this.repository.update(id, { 
      actif: false, 
      updated_by: userId 
    });
  }

  // Méthodes métier spécifiques
  async findByStatus(status: string): Promise<ControleQualite[]> {
    return this.repository.find({ where: { statut: status, actif: true } });
  }

  async getStatistics(): Promise<any> {
    const total = await this.repository.count({ where: { actif: true } });
    const recent = await this.repository.count({ 
      where: { 
        actif: true,
        created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 jours
      } 
    });
    
    return { total, recent, module: 'qualite' };
  }
}
