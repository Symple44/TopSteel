import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThanOrEqual, Repository } from 'typeorm';
import { Machine } from './entities/machine.entity';

@Injectable()
export class MachinesService {
  private readonly logger = new Logger(MachinesService.name);

  constructor(
    @InjectRepository(Machine)
    private readonly repository: Repository<Machine>,
  ) {}

  async findAll(): Promise<Machine[]> {
    this.logger.log('Récupération de tous les machine');
    return this.repository.find({ 
      where: { actif: true }, 
      order: { created_at: "DESC" } 
    });
  }

  async findOne(id: string): Promise<Machine | null> {
    this.logger.log('Récupération machine id: ' + id);
    return this.repository.findOne({ where: { id } });
  }

  async create(data: Partial<Machine>, userId?: string): Promise<Machine> {
    this.logger.log('Création nouveau machine par user: ' + userId);
    const entity = this.repository.create({
      ...data,
      created_by: userId,
      metadata: { created_from: 'api', version: '1.0' }
    });
    return this.repository.save(entity);
  }

  async update(id: string, data: Partial<Machine>, userId?: string): Promise<Machine | null> {
    this.logger.log('Mise à jour machine id: ' + id + ' par user: ' + userId);
    // Omit 'metadata' from the update payload to avoid type incompatibility
    const { metadata: _metadata, ...updateData } = data;
    await this.repository.update(id, {
      ...updateData,
      updated_by: userId
    });
    return this.findOne(id);
  }

  async remove(id: string, userId?: string): Promise<void> {
    this.logger.log('Suppression logique machine id: ' + id + ' par user: ' + userId);
    await this.repository.update(id, { 
      actif: false,
      updated_by: userId 
    });
  }
  async findByStatus(status: string): Promise<Machine[]> {
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
    
    return { total, recent, module: 'machine' };
  }
}

