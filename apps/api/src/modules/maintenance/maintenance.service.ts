// apps/api/src/modules/maintenance/maintenance.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThanOrEqual, Repository } from 'typeorm';
import { Maintenance } from './entities/maintenance.entity';

@Injectable()
export class MaintenanceService {
  constructor(
    @InjectRepository(Maintenance)
    private repository: Repository<Maintenance>
  ) {}

  async findAll(): Promise<Maintenance[]> {
    return this.repository.find({
      where: { actif: true },
      order: { createdAt: "DESC" } // ✅ CORRIGÉ : camelCase cohérent
    });
  }

  async findOne(id: string): Promise<Maintenance | null> {
    return this.repository.findOne({ where: { id, actif: true } });
  }

  async create(data: Partial<Maintenance>, userId?: string): Promise<Maintenance> {
    const entity = this.repository.create({
      ...data,
      createdBy: userId, // ✅ CORRIGÉ : camelCase cohérent
      metadata: { created_from: 'api', version: '1.0' }
    });
    return this.repository.save(entity); // ✅ CORRIGÉ : retourne Maintenance, pas Maintenance[]
  }

  async update(id: string, data: Partial<Maintenance>, userId?: string): Promise<Maintenance | null> {
    const { metadata, ...updateData } = data;
    
    await this.repository.update(id, {
      ...updateData,
      updatedBy: userId // ✅ CORRIGÉ : camelCase cohérent
    });
    return this.findOne(id);
  }

  async delete(id: string, userId?: string): Promise<void> {
    await this.repository.update(id, {
      actif: false,
      updatedBy: userId // ✅ CORRIGÉ : camelCase cohérent
    });
  }

  async findByStatus(status: string): Promise<Maintenance[]> {
    return this.repository.find({
      where: { typeMaintenance: status, actif: true } // ✅ CORRIGÉ : camelCase cohérent
    });
  }

  async findRecent(): Promise<Maintenance[]> {
    return this.repository.find({
      where: {
        actif: true,
        createdAt: MoreThanOrEqual(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) // ✅ CORRIGÉ : camelCase cohérent
      }
    });
  }

  // ✅ AJOUTÉ : Méthodes manquantes pour le contrôleur
  async getStatistics() {
    const total = await this.repository.count({ where: { actif: true } });
    const preventive = await this.repository.count({ 
      where: { actif: true, typeMaintenance: 'PREVENTIVE' } 
    });
    const corrective = await this.repository.count({ 
      where: { actif: true, typeMaintenance: 'CORRECTIVE' } 
    });
    const urgent = await this.repository.count({ 
      where: { actif: true, typeMaintenance: 'URGENT' } 
    });

    // Calcul des moyennes de coût
    const avgCost = await this.repository
      .createQueryBuilder('maintenance')
      .select('AVG(CAST(maintenance.cout AS DECIMAL))', 'avgCost')
      .where('maintenance.actif = :actif', { actif: true })
      .andWhere('maintenance.cout IS NOT NULL')
      .getRawOne();

    return {
      total,
      preventive,
      corrective,
      urgent,
      repartition: {
        preventive: total > 0 ? (preventive / total) * 100 : 0,
        corrective: total > 0 ? (corrective / total) * 100 : 0,
        urgent: total > 0 ? (urgent / total) * 100 : 0
      },
      coutMoyen: parseFloat(avgCost?.avgCost || '0')
    };
  }

  async remove(id: string, userId?: string): Promise<void> {
    // Soft delete - marquer comme inactif au lieu de supprimer
    await this.repository.update(id, {
      actif: false,
      updatedBy: userId
    });
  }

  // ✅ BONUS : Méthodes utiles supplémentaires
  async getStats() {
    return this.getStatistics(); // Alias pour compatibilité
  }

  async findByMachine(machineId: string): Promise<Maintenance[]> {
    return this.repository.find({
      where: { machineId, actif: true },
      order: { createdAt: "DESC" }
    });
  }

  async findByTechnician(technicienId: string): Promise<Maintenance[]> {
    return this.repository.find({
      where: { technicienId, actif: true },
      order: { createdAt: "DESC" }
    });
  }

  async findPlanned(): Promise<Maintenance[]> {
    return this.repository.find({
      where: { 
        actif: true,
        dateProgrammee: MoreThanOrEqual(new Date())
      },
      order: { dateProgrammee: "ASC" }
    });
  }

  async findOverdue(): Promise<Maintenance[]> {
    const today = new Date();
    return this.repository.find({
      where: { 
        actif: true,
        dateProgrammee: MoreThanOrEqual(today),
        dateRealisee: null
      },
      order: { dateProgrammee: "ASC" }
    });
  }
}