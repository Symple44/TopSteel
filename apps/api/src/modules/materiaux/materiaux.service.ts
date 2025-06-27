import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Materiau } from './entities/materiaux.entity';

@Injectable()
export class MateriauxService {
  private readonly logger = new Logger(MateriauxService.name);

  constructor(
    @InjectRepository(Materiau)
    private repository: Repository<Materiau>,
  ) {}

  async findAll(): Promise<Materiau[]> {
    this.logger.log('Récupération de tous les materiaux');
    return this.repository.find({ where: { actif: true }, order: { created_at: 'DESC' } });
  }

  async findOne(id: string): Promise<Materiau> {
    this.logger.log(Récupération materiaux id: .\script.ps1{id});
    return this.repository.findOne({ where: { id, actif: true } });
  }

  async create(data: Partial<Materiau>, userId?: string): Promise<Materiau> {
    this.logger.log(Création nouveau materiaux par user: .\script.ps1{userId});
    const entity = this.repository.create({
      ...data,
      created_by: userId,
      metadata: { created_from: 'api', version: '1.0' }
    });
    return this.repository.save(entity);
  }

  async update(id: string, data: Partial<Materiau>, userId?: string): Promise<Materiau> {
    this.logger.log(Mise à jour materiaux id: .\script.ps1{id} par user: .\script.ps1{userId});
    await this.repository.update(id, {
      ...data,
      updated_by: userId,
    });
    return this.findOne(id);
  }

  async remove(id: string, userId?: string): Promise<void> {
    this.logger.log(Suppression logique materiaux id: .\script.ps1{id} par user: .\script.ps1{userId});
    await this.repository.update(id, { 
      actif: false, 
      updated_by: userId 
    });
  }

  // Méthodes métier spécifiques
  async findByStatus(status: string): Promise<Materiau[]> {
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
    
    return { total, recent, module: 'materiaux' };
  }
}